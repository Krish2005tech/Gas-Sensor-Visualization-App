import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hides the header globally
      }}>
      {/* <Stack.Screen name="index" /> */}
      <Stack.Screen name="details" />
    </Stack>
  );
}
