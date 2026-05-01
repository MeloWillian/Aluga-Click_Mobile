import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
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
  listCategorias,
  updateVeiculo,
  type Categoria,
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

type FormState = {
  placa: string;
  modelo: string;
  marca: string;
  ano: string;
  cor: string;
  quilometragem: string;
  valorDiaria: string;
  valorKM: string;
  status: string;
  categoriaId: string;
};

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

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [cats, vehicle] = await Promise.all([
          listCategorias(),
          editId ? getVeiculo(editId) : Promise.resolve(null),
        ]);

        if (!alive) return;

        setCategories(cats);

        if (vehicle) {
          setForm({
            placa: maskPlateInput(vehicle.placa),
            modelo: vehicle.modelo,
            marca: vehicle.marca,
            ano: String(vehicle.ano),
            cor: vehicle.cor ?? "",
            quilometragem: maskIntegerInput(String(vehicle.quilometragem)),
            valorDiaria: formatCurrencyValue(vehicle.valorDiaria),
            valorKM: vehicle.valorKM != null ? formatCurrencyValue(vehicle.valorKM) : "",
            status: vehicle.status,
            categoriaId: String(vehicle.categoria?.id ?? ""),
          });
        }
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error
              ? err.message
              : "Falha ao carregar formulário.",
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [editId]);

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
      if (editId) {
        await updateVeiculo(editId, payload);
        setMessage("Veículo atualizado com sucesso.");
      } else {
        await createVeiculo(payload);
        setMessage("Veículo cadastrado com sucesso.");
        setForm(defaultState);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar veículo.");
    } finally {
      setSaving(false);
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
          onChangeText={(value) => updateField("ano", digitsOnly(value).slice(0, 4))}
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
          onChangeText={(value) => updateField("quilometragem", maskIntegerInput(value))}
          keyboardType="numeric"
          containerStyle={styles.rowItem}
        />
        <Field
          label="Valor diária"
          value={form.valorDiaria}
          onChangeText={(value) => updateField("valorDiaria", maskCurrencyInput(value))}
          keyboardType="numeric"
          containerStyle={styles.rowItem}
        />
      </View>

      <Field
        label="Valor KM"
        value={form.valorKM}
        onChangeText={(value) => updateField("valorKM", maskCurrencyInput(value))}
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
  error: {
    color: "#b91c1c",
  },
  success: {
    color: "#15803d",
  },
});
