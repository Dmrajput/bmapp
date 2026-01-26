import { useAuth } from "@/context/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: "Weak", color: "#f87171" };
  if (score === 2) return { label: "Okay", color: "#f59e0b" };
  if (score === 3) return { label: "Good", color: "#60a5fa" };
  return { label: "Strong", color: "#34d399" };
};

export default function SignupScreen() {
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [email],
  );

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSignup = async () => {
    setError("");
    if (!name || !emailValid || !password) {
      setError("Please fill all fields with valid details.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await signUp({ name, email, password });
    setLoading(false);

    if (!result?.ok) {
      setError(result?.message || "Signup failed. Please try again.");
      return;
    }

    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Save and reuse your soundtracks</Text>
          </View>

          <View style={styles.card}>
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

            <View style={styles.strengthRow}>
              <View
                style={[
                  styles.strengthDot,
                  { backgroundColor: strength.color },
                ]}
              />
              <Text style={[styles.strengthText, { color: strength.color }]}>
                {strength.label} password
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed" size={18} color="#9aa0a6" />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                placeholderTextColor="#6b7280"
                secureTextEntry={!showConfirm}
                style={styles.input}
              />
              <Pressable onPress={() => setShowConfirm((prev) => !prev)}>
                <Ionicons
                  name={showConfirm ? "eye" : "eye-off"}
                  size={18}
                  color="#9aa0a6"
                />
              </Pressable>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Create account</Text>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => router.push("/auth/login")}>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.link}>Log in</Text>
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
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  strengthDot: { width: 8, height: 8, borderRadius: 999 },
  strengthText: { fontSize: 12, fontWeight: "600" },
  primaryBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  disabledBtn: { opacity: 0.7 },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#f87171", fontSize: 12 },
  link: { color: "#8b5cf6", fontWeight: "600" },
  footerText: { color: "#9aa0a6", textAlign: "center" },
});
