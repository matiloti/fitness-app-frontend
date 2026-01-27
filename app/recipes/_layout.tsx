import { Stack } from 'expo-router';

export default function RecipesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="create" />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen
        name="add-ingredient"
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="add-step"
        options={{
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
