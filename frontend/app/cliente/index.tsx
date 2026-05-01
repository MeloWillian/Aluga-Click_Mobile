import {
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  dateInputToIsoDate,
  digitsOnly,
  maskDateInput,
  maskTimeInput,
  timeInputToIsoTime,
} from "../../lib/input-masks";
import {
  createReserva,
  listCategorias,
  searchAvailableVehicles,
  type Categoria,
  type Veiculo,
} from "../../lib/rental-api";

type SearchState = {
  dataInicio: string;
  horaInicio: string;
  dataFim: string;
  horaFim: string;
  categoriaId: string;
};

type ReservationState = {
  clienteId: string;
  tipoCobranca: string;
};

const billingOptions = ["DIARIA", "KM"] as const;

const defaultSearchState: SearchState = {
  dataInicio: "",
  horaInicio: "",
  dataFim: "",
  horaFim: "",
  categoriaId: "",
};

const defaultReservationState: ReservationState = {
  clienteId: "",
  tipoCobranca: "DIARIA",
};

export default function ClientHome() {
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [search, setSearch] = useState<SearchState>(defaultSearchState);
  const [reservation, setReservation] = useState<ReservationState>(
    defaultReservationState,
  );
  const [vehicles, setVehicles] = useState<Veiculo[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setCategories(await listCategorias());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao carregar categorias.",
        );
      }
    })();
  }, []);

  const hasResults = useMemo(() => vehicles.length > 0, [vehicles]);

  function updateSearch<K extends keyof SearchState>(
    key: K,
    value: SearchState[K],
  ) {
    setSearch((current) => ({ ...current, [key]: value }));
  }

  function updateReservation<K extends keyof ReservationState>(
    key: K,
    value: ReservationState[K],
  ) {
    setReservation((current) => ({ ...current, [key]: value }));
  }

  function composeDateTime(date: string, time: string) {
    const isoDate = dateInputToIsoDate(date);
    const isoTime = timeInputToIsoTime(time);

    if (!isoDate || !isoTime) {
      return null;
    }

    return `${isoDate}T${isoTime}:00`;
  }

  async function handleSearch() {
    setError(null);
    setSuccess(null);

    const dataInicio = composeDateTime(search.dataInicio, search.horaInicio);
    const dataFim = composeDateTime(search.dataFim, search.horaFim);

    if (!dataInicio || !dataFim || !search.categoriaId) {
      setError("Preencha data, hora e categoria.");
      return;
    }

    setSearching(true);
    try {
      const found = await searchAvailableVehicles({
        dataInicial: dataInicio,
        dataFim,
        categoriaId: Number(search.categoriaId),
      });

      setVehicles(found);
      setSelectedVehicleId(
        found.length > 0 ? String((found[0] as Veiculo).id) : "",
      );
    } catch (err) {
      setVehicles([]);
      setSelectedVehicleId("");
      setError(
        err instanceof Error ? err.message : "Falha ao buscar veículos.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleReserve() {
    setError(null);
    setSuccess(null);

    if (
      !search.dataInicio ||
      !search.horaInicio ||
      !search.dataFim ||
      !search.horaFim ||
      !selectedVehicleId ||
      !reservation.clienteId ||
      !reservation.tipoCobranca
    ) {
      setError("Preencha dados da reserva antes de enviar.");
      return;
    }

    setSaving(true);
    try {
      const dataInicio = composeDateTime(search.dataInicio, search.horaInicio);
      const dataFim = composeDateTime(search.dataFim, search.horaFim);

      if (!dataInicio || !dataFim) {
        setError("Informe datas válidas no formato dd/mm/aaaa.");
        return;
      }

      const createdReserva = await createReserva({
        dataInicio,
        dataFim,
        tipoCobranca: reservation.tipoCobranca,
        cliente: { id: Number(reservation.clienteId), tipoUsuario: "CLIENTE" },
        veiculo: { id: Number(selectedVehicleId) },
        status: "PENDENTE",
      });

      if (!createdReserva || typeof createdReserva !== "object" || !("id" in createdReserva)) {
        throw new Error("Reserva não confirmada pelo servidor.");
      }

      setSearch(defaultSearchState);
      setReservation(defaultReservationState);
      setVehicles([]);
      setSelectedVehicleId("");
      setSuccess("Reserva criada com status pendente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar reserva.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Cliente</Text>
        <Text style={styles.title}>Buscar e reservar</Text>
        <Text style={styles.subtitle}>
          Data, hora, categoria e veículo disponível.
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Section title="Buscar veículos">
        <DateTimeFields search={search} updateSearch={updateSearch} />

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.chipsWrap}>
          {categories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.chip,
                search.categoriaId === String(category.id) && styles.chipActive,
              ]}
              onPress={() => updateSearch("categoriaId", String(category.id))}
            >
              <Text
                style={[
                  styles.chipText,
                  search.categoriaId === String(category.id) &&
                    styles.chipTextActive,
                ]}
              >
                {category.nome}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={handleSearch}
          disabled={searching}
        >
          <Text style={styles.primaryButtonText}>
            {searching ? "Buscando..." : "Buscar veículos"}
          </Text>
        </Pressable>
      </Section>

      <Section title="Resultados">
        {searching ? (
          <ActivityIndicator color="#0284c7" />
        ) : hasResults ? (
          vehicles.map((vehicle) => (
            <Pressable
              key={vehicle.id}
              style={[
                styles.resultCard,
                selectedVehicleId === String(vehicle.id) &&
                  styles.resultCardSelected,
              ]}
              onPress={() => setSelectedVehicleId(String(vehicle.id))}
            >
              <Text style={styles.resultTitle}>{vehicle.modelo}</Text>
              <Text style={styles.resultText}>
                {vehicle.marca} · {vehicle.placa}
              </Text>
              <Text style={styles.resultText}>Status: {vehicle.status}</Text>
              <Text style={styles.resultText}>
                Categoria: {vehicle.categoria?.nome ?? "-"}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.empty}>
            Nenhum veículo disponível para filtro informado.
          </Text>
        )}
      </Section>

      <Section title="Criar reserva">
        <Field
          label="ID do cliente"
          value={reservation.clienteId}
          onChangeText={(value) =>
            updateReservation("clienteId", digitsOnly(value).slice(0, 11))
          }
          keyboardType="numeric"
          maxLength={11}
        />

        <Text style={styles.label}>Tipo de cobrança</Text>
        <View style={styles.chipsWrap}>
          {billingOptions.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.chip,
                reservation.tipoCobranca === option && styles.chipActive,
              ]}
              onPress={() => updateReservation("tipoCobranca", option)}
            >
              <Text
                style={[
                  styles.chipText,
                  reservation.tipoCobranca === option && styles.chipTextActive,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.helper}>
          Veículo selecionado: {selectedVehicleId || "nenhum"}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={handleReserve}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "Enviando..." : "Criar reserva"}
          </Text>
        </Pressable>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function DateTimeFields({
  search,
  updateSearch,
}: {
  search: SearchState;
  updateSearch: <K extends keyof SearchState>(
    key: K,
    value: SearchState[K],
  ) => void;
}) {
  return (
    <>
      <View style={styles.row}>
        <Field
          label="Data inicial"
          value={search.dataInicio}
          onChangeText={(value) =>
            updateSearch("dataInicio", maskDateInput(value))
          }
          placeholder="DD/MM/AAAA"
          maxLength={10}
          containerStyle={styles.rowItem}
        />
        <Field
          label="Hora inicial"
          value={search.horaInicio}
          onChangeText={(value) =>
            updateSearch("horaInicio", maskTimeInput(value))
          }
          placeholder="HH:MM"
          maxLength={5}
          containerStyle={styles.rowItem}
        />
      </View>

      <View style={styles.row}>
        <Field
          label="Data final"
          value={search.dataFim}
          onChangeText={(value) =>
            updateSearch("dataFim", maskDateInput(value))
          }
          placeholder="DD/MM/AAAA"
          maxLength={10}
          containerStyle={styles.rowItem}
        />
        <Field
          label="Hora final"
          value={search.horaFim}
          onChangeText={(value) =>
            updateSearch("horaFim", maskTimeInput(value))
          }
          placeholder="HH:MM"
          maxLength={5}
          containerStyle={styles.rowItem}
        />
      </View>
    </>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
  maxLength,
  containerStyle,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  placeholder?: string;
  maxLength?: number;
  containerStyle?: object;
}) {
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        maxLength={maxLength}
        style={styles.input}
      />
    </View>
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
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionBody: {
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  field: {
    gap: 6,
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
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
  },
  chipActive: {
    backgroundColor: "#0f172a",
  },
  chipText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },
  primaryButton: {
    backgroundColor: "#0284c7",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  resultCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4,
  },
  resultCardSelected: {
    borderColor: "#0284c7",
    backgroundColor: "#eff6ff",
  },
  resultTitle: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 16,
  },
  resultText: {
    color: "#475569",
  },
  empty: {
    color: "#64748b",
  },
  helper: {
    color: "#475569",
  },
  error: {
    color: "#b91c1c",
  },
  success: {
    color: "#15803d",
  },
});
