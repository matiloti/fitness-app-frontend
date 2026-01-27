import { Stack } from 'expo-router';

export default function DiaryLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitleVisible: true,
        headerTintColor: '#007AFF',
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: '#F2F2F7',
        },
      }}
    >
      <Stack.Screen
        name="food-search"
        options={{
          presentation: 'modal',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="food/[id]"
        options={{
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="food/create"
        options={{
          presentation: 'modal',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
