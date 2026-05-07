import { Stack } from "expo-router";

export default function NotesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="create"
        options={{ title: "Nueva nota", headerBackTitle: "Listado" }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{ title: "Detalle", headerBackTitle: "Listado" }}
      />
      <Stack.Screen name="[id]/edit" options={{ title: "Editar nota" }} />
    </Stack>
  );
}
