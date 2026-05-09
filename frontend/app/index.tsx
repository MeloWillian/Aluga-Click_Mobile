import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Aluga Click</Text>
      <Text style={styles.title}>Escolha sua jornada</Text>
      <Text style={styles.subtitle}>
        Entrada rápida para gerente ou cliente.
      </Text>

      <View style={styles.cardGrid}>
        <Link href="/gerente" asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>Gerente</Text>
            <Text style={styles.cardText}>
              Listar, cadastrar e editar veículos.
            </Text>
          </Pressable>
        </Link>

        <Link href="/cliente" asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>Cliente</Text>
            <Text style={styles.cardText}>
              Buscar veículos, criar e acompanhar reservas.
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#0f172a",
  },
  kicker: {
    color: "#93c5fd",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontSize: 12,
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 16,
    marginBottom: 28,
  },
  cardGrid: {
    gap: 16,
  },
  card: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardText: {
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 20,
  },
});
