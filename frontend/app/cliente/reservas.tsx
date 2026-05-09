import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { digitsOnly } from "../../lib/input-masks";
import {
  clearClientReservationsDraft,
  listClientReservations,
  readCachedClientReservations,
  readClientReservationsDraft,
  readOfflineSummary,
  saveClientReservationsDraft,
  syncPendingMutations,
  type PendingMutationSummary,
  type Reserva,
} from "../../lib/rental-api";

type ReservationListState = {
  clienteId: string;
};

const defaultState: ReservationListState = {
  clienteId: "",
};

export default function ClientReservations() {
  const [state, setState] = useState(defaultState);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [summary, setSummary] = useState<PendingMutationSummary | null>(null);

  const clienteIdNumber = useMemo(
    () => Number(state.clienteId),
    [state.clienteId],
  );

  const load = useCallback(async (clienteId: number) => {
    setError(null);
    setBanner(null);

    if (!clienteId) {
      setReservas([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    let cacheErrorMessage: string | null = null;
    const [cachedResult, summaryResult] = await Promise.allSettled([
      readCachedClientReservations(clienteId),
      readOfflineSummary(),
    ]);

    const cached =
      cachedResult.status === "fulfilled" ? cachedResult.value : null;
    const offlineSummary =
      summaryResult.status === "fulfilled"
        ? summaryResult.value
        : { total: 0, pending: 0, failed: 0, hasPending: false };

    if (
      cachedResult.status === "rejected" &&
      cachedResult.reason instanceof Error
    ) {
      cacheErrorMessage = cachedResult.reason.message;
    }

    setSummary(offlineSummary);

    if (cached) {
      setReservas(cached.data);
      setBanner(
        cached.isStale
          ? "Reservas em cache desatualizado"
          : "Reservas em cache",
      );
    }

    try {
      const fresh = await listClientReservations(clienteId);
      setReservas(fresh);
      setBanner(
        cacheErrorMessage
          ? "Reservas atualizadas online após ignorar cache corrompido"
          : "Reservas atualizadas online",
      );
    } catch (err) {
      if (!cached) {
        setError(
          cacheErrorMessage ??
            (err instanceof Error
              ? err.message
              : "Falha ao carregar reservas."),
        );
      } else {
        setBanner("Usando reservas em cache");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await syncPendingMutations();

        const draft = await readClientReservationsDraft();
        if (draft?.clienteId) {
          setState(draft);
          await load(Number(draft.clienteId));
          return;
        }

        setLoading(false);
      })();
    }, [load]),
  );

  useEffect(() => {
    void saveClientReservationsDraft(state);
  }, [state]);

  const onRefresh = () => {
    if (!clienteIdNumber) {
      return;
    }

    setRefreshing(true);
    void load(clienteIdNumber);
  };

  const handleLoad = () => {
    setLoading(true);
    void load(clienteIdNumber);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>Cliente</Text>
        <Text style={styles.title}>Minhas reservas</Text>
        <Text style={styles.subtitle}>
          Histórico do cliente com cache offline no dispositivo.
        </Text>
      </View>

      {summary?.hasPending ? (
        <Text style={styles.bannerWarning}>
          Há {summary.pending} ação(ões) pendente(s) de sincronização.
        </Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>ID do cliente</Text>
        <TextInput
          value={state.clienteId}
          onChangeText={(value) =>
            setState({ clienteId: digitsOnly(value).slice(0, 11) })
          }
          keyboardType="numeric"
          placeholder="Digite o ID"
          style={styles.input}
        />

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleLoad}>
            <Text style={styles.primaryButtonText}>Carregar reservas</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={async () => {
              await clearClientReservationsDraft();
              setState(defaultState);
              setReservas([]);
              setBanner("Filtro limpo");
            }}
          >
            <Text style={styles.secondaryButtonText}>Limpar</Text>
          </Pressable>
        </View>
      </View>

      {banner ? <Text style={styles.banner}>{banner}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color="#0284c7" />
      ) : reservas.length === 0 ? (
        <Text style={styles.empty}>Nenhuma reserva encontrada.</Text>
      ) : (
        <View style={styles.list}>
          {reservas.map((reserva) => (
            <View key={String(reserva.id)} style={styles.reservaCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>
                  {reserva.veiculo?.modelo ?? `Reserva ${String(reserva.id)}`}
                </Text>
                <Text
                  style={[
                    styles.status,
                    reserva.syncState === "pending" && styles.statusPending,
                  ]}
                >
                  {reserva.syncState === "pending"
                    ? "Pendente de Sicronização"
                    : reserva.status}
                </Text>
              </View>

              <Text style={styles.cardText}>
                {reserva.veiculo?.marca ?? "-"} ·{" "}
                {reserva.veiculo?.placa ?? "-"}
              </Text>
              <Text style={styles.cardText}>
                Período: {formatDateTime(reserva.dataInicio)} até{" "}
                {formatDateTime(reserva.dataFim)}
              </Text>
              <Text style={styles.cardText}>
                Cobrança: {reserva.tipoCobranca}
              </Text>
              <Text style={styles.cardText}>
                Veículo: {reserva.veiculo?.id ? `#${reserva.veiculo.id}` : "-"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  kicker: {
    color: "#0284c7",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: "#0f172a",
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    color: "#475569",
    fontSize: 15,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  label: {
    color: "#334155",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#0f172a",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#0284c7",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#e2e8f0",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  banner: {
    color: "#0f172a",
    backgroundColor: "#e0f2fe",
    padding: 12,
    borderRadius: 12,
  },
  bannerWarning: {
    color: "#92400e",
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 12,
  },
  error: {
    color: "#b91c1c",
  },
  empty: {
    color: "#64748b",
  },
  list: {
    gap: 12,
  },
  reservaCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  cardText: {
    color: "#475569",
  },
  status: {
    color: "#0f172a",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "700",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
});
