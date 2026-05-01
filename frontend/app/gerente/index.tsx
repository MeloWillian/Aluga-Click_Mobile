import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { listFrota, type Veiculo } from "../../lib/rental-api";

export default function GerenteHome() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listFrota();
      setVeiculos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar frota.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
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
        <Text style={styles.kicker}>Gerente</Text>
        <Text style={styles.title}>Frota</Text>
        <Text style={styles.subtitle}>
          Lista, cadastro e edição de veículos.
        </Text>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push("/gerente/veiculos/form")}
      >
        <Text style={styles.primaryButtonText}>Novo veículo</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator color="#38bdf8" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : veiculos.length === 0 ? (
        <Text style={styles.empty}>Nenhum veículo cadastrado.</Text>
      ) : (
        <View style={styles.list}>
          {veiculos.map((veiculo) => (
            <View key={veiculo.id} style={styles.card}>
              <Text style={styles.cardTitle}>{veiculo.modelo}</Text>
              <Text style={styles.cardText}>
                {veiculo.marca} · {veiculo.placa}
              </Text>
              <Text style={styles.cardText}>Status: {veiculo.status}</Text>
              <Text style={styles.cardText}>
                Categoria: {veiculo.categoria?.nome ?? "-"}
              </Text>

              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  router.push(`/gerente/veiculos/form?id=${veiculo.id}`)
                }
              >
                <Text style={styles.secondaryButtonText}>Editar</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
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
  primaryButton: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700",
  },
  cardText: {
    color: "#475569",
  },
  secondaryButton: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#e2e8f0",
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  empty: {
    color: "#64748b",
  },
  error: {
    color: "#b91c1c",
  },
});
