import { Stack } from 'expo-router';

export default function ManagerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="manager-dashboard" />
      <Stack.Screen name="menu-management" />
      <Stack.Screen name="leave-requests" />
      <Stack.Screen name="feedback-review" />
      <Stack.Screen name="announcement-management" />
    </Stack>
  );
}
