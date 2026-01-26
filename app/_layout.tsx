import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/context/auth-context";
import { FavoritesProvider } from "@/context/favorites-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "auth";
    if (user && inAuth) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <FavoritesProvider>
          <AuthGate>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
            </Stack>
            <StatusBar style="auto" />
          </AuthGate>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
