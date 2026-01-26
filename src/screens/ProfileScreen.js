import { useAuth } from "@/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/welcome");
    }
  }, [user, isLoading]);

  const initials = useMemo(() => {
    if (!user?.name) return "BM";
    const parts = user.name.trim().split(" ");
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [user?.name]);

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/welcome");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name || "Creator"}</Text>
        <Text style={styles.email}>{user?.email || ""}</Text>
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c0c0c",
    padding: 20,
    alignItems: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "#151515",
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
    marginTop: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#1f1f2e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#c7d2fe", fontSize: 26, fontWeight: "700" },
  name: { color: "#fff", fontSize: 20, fontWeight: "700" },
  email: { color: "#9aa0a6", fontSize: 13, marginTop: 6 },
  logoutBtn: {
    marginTop: 28,
    backgroundColor: "#ef4444",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoutText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
