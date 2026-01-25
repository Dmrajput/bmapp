import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <LinearGradient
          colors={["#6366f1", "#a855f7", "#ec4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}
        />
        <Text style={styles.title}>BeatMates</Text>
        <Text style={styles.subtitle}>
          Find the perfect music for your videos
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.primaryBtnPressed,
          ]}
          onPress={() => router.push("/auth/signup")}
        >
          <Text style={styles.primaryText}>Continue with Email</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.secondaryBtnPressed,
          ]}
          onPress={() => router.push("/auth/login?provider=google")}
        >
          <Text style={styles.secondaryText}>Continue with Google</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(tabs)")}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    marginTop: 40,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 26,
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#9aa0a6",
    fontSize: 14,
    marginTop: 8,
  },
  actions: {
    gap: 14,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#2d2f3a",
    backgroundColor: "#151520",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryBtnPressed: {
    opacity: 0.85,
  },
  secondaryText: {
    color: "#e2e8f0",
    fontWeight: "600",
    fontSize: 16,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  skipText: {
    color: "#9aa0a6",
    fontSize: 13,
  },
});
