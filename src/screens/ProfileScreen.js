import { useAuth } from "@/context/auth-context";
import { useFavorites } from "@/context/favorites-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const UPLOAD_ADMIN_EMAIL = "divyarajsinh5216@gmail.com";

export default function ProfileScreen() {
  const { user, isLoading, logout } = useAuth();
  const { favorites } = useFavorites();
  const router = useRouter();

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

  const canUploadAudio = useMemo(() => {
    const email = String(user?.email || "").trim().toLowerCase();
    const userId = String(user?.id || user?._id || "").trim();
    return email === UPLOAD_ADMIN_EMAIL || userId === UPLOAD_ADMIN_EMAIL;
  }, [user?.email, user?.id, user?._id]);

  const stats = useMemo(
    () => [
      { label: "Uploads", value: String(user?.uploadCount || 0) },
      { label: "Downloads", value: String(user?.downloadCount || 0) },
      { label: "Favorites", value: String(favorites?.length || 0) },
    ],
    [favorites?.length, user?.downloadCount, user?.uploadCount],
  );

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

        <View style={styles.statsRow}>
          {stats.map((item) => (
            <View key={item.label} style={styles.statItem}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {canUploadAudio ? (
          <Pressable
            style={styles.uploadBtnWrap}
            onPress={() => router.push("/upload-audio")}
          >
            <LinearGradient
              colors={["#7C3AED", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.uploadBtn}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.uploadBtnText}>Upload Audio</Text>
            </LinearGradient>
          </Pressable>
        ) : null}
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
  statsRow: {
    marginTop: 18,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "#233044",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  statValue: {
    color: "#F8FAFC",
    fontWeight: "800",
    fontSize: 16,
  },
  statLabel: {
    color: "#93A4BE",
    fontSize: 11,
    marginTop: 2,
  },
  uploadBtnWrap: {
    width: "100%",
    marginTop: 18,
    borderRadius: 14,
    overflow: "hidden",
  },
  uploadBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
