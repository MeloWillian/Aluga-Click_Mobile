import { useEffect } from "react";
import { Stack } from "expo-router";

import { syncPendingMutations } from "../lib/rental-api";

export default function RootLayout() {
  useEffect(() => {
    void syncPendingMutations();
  }, []);

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Aluga Click", headerShown: false }}
      />
      <Stack.Screen
        name="gerente/index"
        options={{ title: "Gestão de Veículos" }}
      />
      <Stack.Screen
        name="gerente/veiculos/form"
        options={{ title: "Veículo" }}
      />
      <Stack.Screen name="cliente/index" options={{ title: "Reserva" }} />
    </Stack>
  );
}
