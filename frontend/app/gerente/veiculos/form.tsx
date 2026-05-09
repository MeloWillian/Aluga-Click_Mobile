import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
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
  createVeiculo,
  getVeiculo,
  isPendingSyncResult,
  listCategorias,
  readCachedCategorias,
  readCachedVeiculo,
  readOfflineSummary,
  readVehicleDraft,
  clearVehicleDraft,
  saveVehicleDraft,
  syncPendingMutations,
  updateVeiculo,
  type Categoria,
  type PendingMutationSummary,
  type VehicleFormDraft,
} from "../../../lib/rental-api";
import {
  digitsOnly,
  formatCurrencyValue,
  maskCurrencyInput,
  maskIntegerInput,
  maskPlateInput,
  normalizePlateInput,
  parseCurrencyInput,
  parseIntegerInput,
} from "../../../lib/input-masks";

type FormState = VehicleFormDraft;

const defaultState: FormState = {
  placa: "",
  modelo: "",
  marca: "",
  ano: "",
  cor: "",
  quilometragem: "",
  valorDiaria: "",
  valorKM: "",
  status: "DISPONIVEL",
  categoriaId: "",
};

const statusOptions = ["DISPONIVEL", "INDISPONIVEL", "MANUTENCAO", "RETIRADO"];

export default function VehicleFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    return raw ? Number(raw) : null;
  }, [params.id]);

  const [form, setForm] = useState<FormState>(defaultState);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cacheState, setCacheState] = useState<string | null>(null);
  const [summary, setSummary] = useState<PendingMutationSummary | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const skipDraftSaveRef = useRef(false);

  const draftKey = editId ?? "new";

  const refreshSummary = useCallback(async () => {
    setSummary(await readOfflineSummary());
  }, []);

  const toFormState = useCallback(
    (vehicle: {
      placa: string;
      modelo: string;
      marca: string;
      ano: number;
      cor?: string | null;
      quilometragem: number;
      valorDiaria: number;
      valorKM?: number | null;
      status: string;
      categoria?: { id?: number | null } | null;
    }): FormState => ({
      placa: maskPlateInput(vehicle.placa),
      modelo: vehicle.modelo,
      marca: vehicle.marca,
      ano: String(vehicle.ano),
      cor: vehicle.cor ?? "",
      quilometragem: maskIntegerInput(String(vehicle.quilometragem)),
      valorDiaria: formatCurrencyValue(vehicle.valorDiaria),
      valorKM:
        vehicle.valorKM != null ? formatCurrencyValue(vehicle.valorKM) : "",
      status: vehicle.status,
      categoriaId: String(vehicle.categoria?.id ?? ""),
    }),
    [],
  );

  const load = useCallback(async () => {
    setError(null);
    let cacheErrorMessage: string | null = null;

    const [categoriesResult, vehicleResult, draftResult, summaryResult] =
      await Promise.allSettled([
        readCachedCategorias(),
        editId ? readCachedVeiculo(editId) : Promise.resolve(null),
        readVehicleDraft(draftKey),
        readOfflineSummary(),
      ]);

    const cachedCategories =
      categoriesResult.status === "fulfilled" ? categoriesResult.value : null;
    const cachedVehicle =
      vehicleResult.status === "fulfilled" ? vehicleResult.value : null;
    const draft = draftResult.status === "fulfilled" ? draftResult.value : null;
    const offlineSummary =
      summaryResult.status === "fulfilled"
        ? summaryResult.value
        : { total: 0, pending: 0, failed: 0, hasPending: false };

    if (
      categoriesResult.status === "rejected" &&
      categoriesResult.reason instanceof Error
    ) {
      cacheErrorMessage = categoriesResult.reason.message;
    } else if (
      vehicleResult.status === "rejected" &&
      vehicleResult.reason instanceof Error
    ) {
      cacheErrorMessage = vehicleResult.reason.message;
    } else if (
      draftResult.status === "rejected" &&
      draftResult.reason instanceof Error
    ) {
      cacheErrorMessage = draftResult.reason.message;
    }

    setSummary(offlineSummary);

    if (cachedCategories) {
      setCategories(cachedCategories.data);
      setCacheState(
        cachedCategories.isStale
          ? "Categorias desatualizadas"
          : "Categorias em cache",
      );
      setLoading(false);
    }

    if (draft) {
      setForm(draft);
      setLoading(false);
    } else if (cachedVehicle) {
      setForm(toFormState(cachedVehicle.data));
      setLoading(false);
    }

    try {
      const cats = await listCategorias();
      setCategories(cats);
      setCacheState(
        cacheErrorMessage
          ? "Categorias atualizadas online após ignorar cache corrompido"
          : "Categorias atualizadas online",
      );
    } catch (err) {
      if (!cachedCategories) {
        setError(
          cacheErrorMessage ??
            (err instanceof Error
              ? err.message
              : "Falha ao carregar formulário."),
        );
      } else {
        setCacheState("Usando categorias em cache");
      }
    }

    if (!draft && editId) {
      try {
        const vehicle = await getVeiculo(editId);
        setForm(toFormState(vehicle));
        setCacheState("Veículo atualizado online");
      } catch (err) {
        if (!cachedVehicle) {
          setError(
            err instanceof Error
              ? err.message
              : "Falha ao carregar formulário.",
          );
        } else {
          setCacheState("Usando veículo em cache");
        }
      }
    }

    setLoading(false);
    setHydrated(true);
  }, [draftKey, editId, toFormState]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await syncPendingMutations();
        await load();
      })();
    }, [load]),
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      return;
    }

    void saveVehicleDraft(draftKey, form);
  }, [draftKey, form, hydrated]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    if (
      !form.placa ||
      !form.modelo ||
      !form.marca ||
      !form.ano ||
      !form.quilometragem ||
      !form.valorDiaria ||
      !form.status ||
      !form.categoriaId
    ) {
      return "Preencha os campos obrigatórios.";
    }

    if (normalizePlateInput(form.placa).length !== 7) {
      return "Informe uma placa válida.";
    }

    if (parseIntegerInput(form.ano) < 1900) {
      return "Informe um ano válido.";
    }

    if (parseCurrencyInput(form.valorDiaria) <= 0) {
      return "Informe um valor de diária válido.";
    }

    return null;
  }

  async function handleSave() {
    const validation = validate();

    if (validation) {
      setError(validation);
      setMessage(null);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    const placaNormalizada = normalizePlateInput(form.placa);

    const payload = {
      placa: placaNormalizada,
      modelo: form.modelo.trim(),
      marca: form.marca.trim(),
      ano: parseIntegerInput(form.ano),
      cor: form.cor.trim() || undefined,
      quilometragem: parseIntegerInput(form.quilometragem),
      valorDiaria: parseCurrencyInput(form.valorDiaria),
      valorKM: form.valorKM.trim() ? parseCurrencyInput(form.valorKM) : null,
      status: form.status,
      categoria: { id: Number(form.categoriaId) },
    };

    try {
      const result = editId
        ? await updateVeiculo(editId, payload)
        : await createVeiculo(payload);

      if (isPendingSyncResult(result)) {
        setMessage(result.message);
      } else if (editId) {
        setMessage("Veículo atualizado com sucesso.");
      } else {
        setMessage("Veículo cadastrado com sucesso.");
        setForm(defaultState);
      }

      skipDraftSaveRef.current = true;
      await clearVehicleDraft(draftKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar veículo.");
    } finally {
      setSaving(false);
      void refreshSummary();
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0284c7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>
        {editId ? "Editar veículo" : "Novo veículo"}
      </Text>
      <Text style={styles.title}>
        {editId ? "Atualize a frota" : "Cadastre um veículo"}
      </Text>

      {cacheState ? <Text style={styles.banner}>{cacheState}</Text> : null}
      {summary?.hasPending ? (
        <Text style={styles.bannerWarning}>
          Há {summary.pending} operação(ões) aguardando sincronização.
        </Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <Field
        label="Placa"
        value={form.placa}
        onChangeText={(value) => updateField("placa", maskPlateInput(value))}
        placeholder="ABC-1234"
        maxLength={8}
        autoCapitalize="characters"
      />
      <Field
        label="Modelo"
        value={form.modelo}
        onChangeText={(value) => updateField("modelo", value)}
      />
      <Field
        label="Marca"
        value={form.marca}
        onChangeText={(value) => updateField("marca", value)}
      />

      <View style={styles.row}>
        <Field
          label="Ano"
          value={form.ano}
          onChangeText={(value) =>
            updateField("ano", digitsOnly(value).slice(0, 4))
          }
          keyboardType="numeric"
          maxLength={4}
          containerStyle={styles.rowItem}
        />
        <Field
          label="Cor"
          value={form.cor}
          onChangeText={(value) => updateField("cor", value)}
          containerStyle={styles.rowItem}
        />
      </View>

      <View style={styles.row}>
        <Field
          label="Quilometragem"
          value={form.quilometragem}
          onChangeText={(value) =>
            updateField("quilometragem", maskIntegerInput(value))
          }
          keyboardType="numeric"
          containerStyle={styles.rowItem}
        />
        <Field
          label="Valor diária"
          value={form.valorDiaria}
          onChangeText={(value) =>
            updateField("valorDiaria", maskCurrencyInput(value))
          }
          keyboardType="numeric"
          containerStyle={styles.rowItem}
        />
      </View>

      <Field
        label="Valor KM"
        value={form.valorKM}
        onChangeText={(value) =>
          updateField("valorKM", maskCurrencyInput(value))
        }
        keyboardType="numeric"
      />

      <Text style={styles.label}>Status</Text>
      <View style={styles.chipsRow}>
        {statusOptions.map((option) => (
          <Pressable
            key={option}
            style={[styles.chip, form.status === option && styles.chipActive]}
            onPress={() => updateField("status", option)}
          >
            <Text
              style={[
                styles.chipText,
                form.status === option && styles.chipTextActive,
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Categoria</Text>
      <View style={styles.chipsWrap}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={[
              styles.categoryChip,
              form.categoriaId === String(category.id) && styles.chipActive,
            ]}
            onPress={() => updateField("categoriaId", String(category.id))}
          >
            <Text
              style={[
                styles.chipText,
                form.categoriaId === String(category.id) &&
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
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.primaryButtonText}>
          {saving
            ? "Salvando..."
            : editId
              ? "Salvar alterações"
              : "Cadastrar veículo"}
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryButtonText}>Voltar</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
  maxLength,
  autoCapitalize,
  containerStyle,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: ComponentProps<typeof TextInput>["keyboardType"];
  placeholder?: string;
  maxLength?: number;
  autoCapitalize?: ComponentProps<typeof TextInput>["autoCapitalize"];
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
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    gap: 14,
  },
  kicker: {
    color: "#0284c7",
    textTransform: "uppercase",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: "700",
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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
  categoryChip: {
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
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#e2e8f0",
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
  success: {
    color: "#15803d",
  },
});
