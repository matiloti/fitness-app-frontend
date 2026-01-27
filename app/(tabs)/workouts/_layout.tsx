import { Stack } from 'expo-router';

export default function WorkoutsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="log"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Log Workout',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          headerTitle: 'Workout',
          headerBackTitle: 'Workouts',
        }}
      />
    </Stack>
  );
}
