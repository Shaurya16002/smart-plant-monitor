import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f172a' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add-plant" />
      <Stack.Screen name="plant-details" />
      <Stack.Screen name="arduino-setup" />
    </Stack>
  );
}
