import { useAuth } from "@/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const params = useLocalSearchParams();
  const provider = String(params?.provider || "");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [email],
  );

  const handleLogin = async () => {
    setError("");
    if (!emailValid || !password) {
      setError("Enter a valid email and password.");
      return;
    }

    try {
      setLoading(true);
      await signIn({ email, password, remember });
      router.replace("/(tabs)");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    if (!name || !emailValid) {
      setError("Enter your name and a valid email.");
      return;
    }

    try {
      setLoading(true);
      await signInWithGoogle({ name, email });
      router.replace("/(tabs)");
    } catch (err) {
      setError(err.message || "Google auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Log in to your creator library</Text>
          </View>

          {provider === "google" ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Continue with Google</Text>
              <Text style={styles.cardHint}>
                Enter the email connected to Google
              </Text>
              <View style={styles.inputGroup}>
                <Ionicons name="person" size={18} color="#9aa0a6" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  placeholderTextColor="#6b7280"
                  style={styles.input}
                />
              </View>
              <View style={styles.inputGroup}>
                <Ionicons name="mail" size={18} color="#9aa0a6" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor="#6b7280"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleGoogle}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Continue</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Ionicons name="mail" size={18} color="#9aa0a6" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor="#6b7280"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>
              {!emailValid && email.length > 3 ? (
                <Text style={styles.inlineHint}>Enter a valid email.</Text>
              ) : null}

              <View style={styles.inputGroup}>
                <Ionicons name="lock-closed" size={18} color="#9aa0a6" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#6b7280"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={18}
                    color="#9aa0a6"
                  />
                </Pressable>
              </View>

              <View style={styles.row}>
                <View style={styles.rememberRow}>
                  <Switch
                    value={remember}
                    onValueChange={setRemember}
                    thumbColor={remember ? "#6366f1" : "#6b7280"}
                  />
                  <Text style={styles.rememberText}>Remember me</Text>
                </View>
                <Pressable onPress={() => setError("Reset link coming soon")}>
                  <Text style={styles.link}>Forgot password?</Text>
                </Pressable>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Log in</Text>
                )}
              </Pressable>
            </View>
          )}

          <Pressable onPress={() => router.push("/auth/signup")}>
            <Text style={styles.footerText}>
              New here? <Text style={styles.link}>Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0f" },
  content: { padding: 20, gap: 16 },
  header: { marginTop: 12 },
  title: { color: "#fff", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#9aa0a6", marginTop: 6 },
  card: {
    backgroundColor: "#151520",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 12,
  },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "600" },
  cardHint: { color: "#9aa0a6", fontSize: 13, marginBottom: 4 },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0f0f17",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  input: { color: "#fff", flex: 1, fontSize: 14 },
  inlineHint: { color: "#f59e0b", fontSize: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rememberText: { color: "#e2e8f0", fontSize: 13 },
  link: { color: "#8b5cf6", fontWeight: "600" },
  primaryBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  disabledBtn: { opacity: 0.7 },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#f87171", fontSize: 12 },
  footerText: { color: "#9aa0a6", textAlign: "center" },
});
