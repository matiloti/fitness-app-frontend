import { Stack } from 'expo-router';

export default function ProgressLayout() {
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
          headerTitle: 'Log Metrics',
        }}
      />
      <Stack.Screen
        name="photos"
        options={{
          headerShown: true,
          headerTitle: 'Progress Photos',
          headerBackTitle: 'Progress',
        }}
      />
      <Stack.Screen
        name="weight"
        options={{
          headerShown: true,
          headerTitle: 'Weight Trend',
          headerBackTitle: 'Progress',
        }}
      />
      <Stack.Screen
        name="body-comp"
        options={{
          headerShown: true,
          headerTitle: 'Body Composition',
          headerBackTitle: 'Progress',
        }}
      />
      <Stack.Screen
        name="nutrition"
        options={{
          headerShown: true,
          headerTitle: 'Nutrition Analytics',
          headerBackTitle: 'Progress',
        }}
      />
    </Stack>
  );
}
