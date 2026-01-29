import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { API_BASE_URL } from "../config/api.config";
import { CATEGORY_SECTIONS } from "./HomeScreen";

const CATEGORY_OPTIONS = CATEGORY_SECTIONS.flatMap((section) =>
  section.data.map((item) => ({
    id: item.id,
    name: item.name,
  })),
);

export default function AdminScreen() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]?.id || "");
  const [duration, setDuration] = useState("");
  const [originalAudioUrl, setOriginalAudioUrl] = useState("");

  const [audioFile, setAudioFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const soundRef = useRef(null);

  const resetPreview = useCallback(async () => {
    const sound = soundRef.current;
    if (sound) {
      try {
        await sound.stopAsync();
      } catch (e) {
        console.log("⚠️ stopAsync error (AdminScreen resetPreview):", e);
      }
      try {
        await sound.unloadAsync();
      } catch (e) {
        console.log("⚠️ unloadAsync error (AdminScreen resetPreview):", e);
      }
      soundRef.current = null;
    }
    setIsPreviewPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      resetPreview();
    };
  }, [resetPreview]);

  const pickFile = async (type, setter) => {
    setStatusMessage("");
    const result = await DocumentPicker.getDocumentAsync({
      type,
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0] || result;
    if (!asset?.uri) return;

    setter({
      uri: asset.uri,
      name: asset.name || asset.uri.split("/").pop(),
      mimeType: asset.mimeType || asset.type,
    });
  };

  const handlePreview = async () => {
    if (!audioFile?.uri) return;

    try {
      if (isPreviewPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPreviewPlaying(false);
        return;
      }

      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioFile.uri },
          { shouldPlay: true },
        );
        soundRef.current = sound;
        setIsPreviewPlaying(true);
        return;
      }

      await soundRef.current.playAsync();
      setIsPreviewPlaying(true);
    } catch (e) {
      console.log("❌ Preview audio error (AdminScreen):", e);
      soundRef.current = null;
      setIsPreviewPlaying(false);
    }
  };

  const handleSubmit = async () => {
    setStatusMessage("");

    if (!title.trim()) {
      setStatusMessage("Title is required.");
      return;
    }

    if (!category) {
      setStatusMessage("Category is required.");
      return;
    }

    if (!duration || Number.isNaN(Number(duration))) {
      setStatusMessage("Duration must be a valid number.");
      return;
    }

    if (!audioFile?.uri) {
      setStatusMessage("Please upload an audio file.");
      return;
    }

    if (!licenseFile?.uri) {
      setStatusMessage("Please upload the license file.");
      return;
    }

    if (!API_BASE_URL) {
      setStatusMessage("API base URL is not configured.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("category", category);
      formData.append("duration", String(Number(duration)));
      formData.append("original_audio_url", originalAudioUrl.trim());
      formData.append("artist_name", "Envato MusicGen AI");

      // File fields expected by backend: audio, license_txt
      formData.append("audio", {
        uri: audioFile.uri,
        name: audioFile.name || "audio-file",
        type: audioFile.mimeType || "audio/mpeg",
      });

      formData.append("license_txt", {
        uri: licenseFile.uri,
        name: licenseFile.name || "license.txt",
        type: licenseFile.mimeType || "text/plain",
      });

      const response = await fetch(`${API_BASE_URL}/audio/upload`, {
        method: "POST",
        // Don't set Content-Type; let fetch/React Native set the multipart boundary
        body: formData,
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json.success) {
        throw new Error(json.error || json.message || "Upload failed.");
      }

      setStatusMessage("Audio uploaded successfully.");
      setTitle("");
      setDuration("");
      setOriginalAudioUrl("");
      setAudioFile(null);
      setLicenseFile(null);
      await resetPreview();
    } catch (error) {
      setStatusMessage(error.message || "Upload failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardWrap}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.header}>Admin Upload</Text>
          <Text style={styles.subheader}>Add music for creators</Text>

          {statusMessage ? (
            <View style={styles.statusBanner}>
              <Text style={styles.statusText}>{statusMessage}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Audio Details</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Epic Rise"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={category}
                onValueChange={(value) => setCategory(value)}
                style={styles.picker}
              >
                {CATEGORY_OPTIONS.map((item) => (
                  <Picker.Item
                    key={item.id}
                    label={item.name}
                    value={item.id}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Duration (seconds)</Text>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              placeholder="45"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Audio Upload</Text>

            <Pressable
              style={styles.uploadButton}
              onPress={() => pickFile("audio/*", setAudioFile)}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.uploadText}>Upload Audio File</Text>
            </Pressable>

            <Text style={styles.fileName}>
              {audioFile?.name || "No file selected"}
            </Text>

            <Pressable
              style={styles.previewButton}
              onPress={handlePreview}
              disabled={!audioFile?.uri}
            >
              <Ionicons
                name={isPreviewPlaying ? "pause" : "play"}
                size={16}
                color="#111827"
              />
              <Text style={styles.previewText}>
                {isPreviewPlaying ? "Pause Preview" : "Play Preview"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>License & Source</Text>

            <View style={styles.readonlyRow}>
              <Text style={styles.readonlyLabel}>Source</Text>
              <Text style={styles.readonlyValue}>AI Generated</Text>
            </View>

            <View style={styles.readonlyRow}>
              <Text style={styles.readonlyLabel}>License Type</Text>
              <Text style={styles.readonlyValue}>
                Envato MusicGen – Commercial License
              </Text>
            </View>

            <Text style={styles.label}>Original Envato Track URL</Text>
            <TextInput
              value={originalAudioUrl}
              onChangeText={setOriginalAudioUrl}
              placeholder="https://envato.com/track"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Pressable
              style={styles.uploadButton}
              onPress={() => pickFile("text/plain", setLicenseFile)}
            >
              <Ionicons name="document-attach-outline" size={18} color="#fff" />
              <Text style={styles.uploadText}>Upload License TXT</Text>
            </Pressable>

            <Text style={styles.fileName}>
              {licenseFile?.name || "No file selected"}
            </Text>

            <View style={styles.readonlyRow}>
              <Text style={styles.readonlyLabel}>Artist Name</Text>
              <Text style={styles.readonlyValue}>Envato MusicGen AI</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Usage Rules</Text>

            <View style={styles.ruleRow}>
              <Text style={styles.ruleLabel}>Redistribution Allowed</Text>
              <Text style={styles.ruleValue}>❌ No</Text>
            </View>
            <View style={styles.ruleRow}>
              <Text style={styles.ruleLabel}>Attribution Required</Text>
              <Text style={styles.ruleValue}>❌ No</Text>
            </View>

            <Text style={styles.usageNotes}>
              “Licensed via Envato MusicGen. Allowed for commercial use inside
              this app as part of an end product. Redistribution outside the app
              is not permitted.”
            </Text>
          </View>

          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Upload Music</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardWrap: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  subheader: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },
  statusBanner: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statusText: {
    color: "#4338CA",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    marginBottom: 12,
  },
  picker: {
    height: 46,
    color: "#111827",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingVertical: 10,
    borderRadius: 12,
  },
  uploadText: {
    color: "#fff",
    fontWeight: "600",
  },
  fileName: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
  },
  previewButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
  },
  previewText: {
    color: "#111827",
    fontWeight: "600",
  },
  readonlyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  readonlyLabel: {
    color: "#6B7280",
    fontSize: 12,
  },
  readonlyValue: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },
  ruleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  ruleLabel: {
    color: "#6B7280",
    fontSize: 12,
  },
  ruleValue: {
    color: "#111827",
    fontWeight: "600",
  },
  usageNotes: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
