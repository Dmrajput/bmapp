import { API_BASE_URL } from "@/src/config/api.config";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORY_OPTIONS = [
  "General",
  "Vlog Music",
  "Cinematic",
  "Travel",
  "Gaming",
  "Funny / Comedy",
  "Motivational",
  "Calm",
];

const TYPE_OPTIONS = ["music", "sound", "background music", "fx"];

function formatSeconds(totalSeconds) {
  const sec = Math.max(0, Number(totalSeconds || 0));
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}:${String(rem).padStart(2, "0")}`;
}

function RatingSlider({ value, onChange }) {
  return (
    <View style={styles.ratingWrap}>
      <View style={styles.ratingTrack}>
        {Array.from({ length: 6 }).map((_, index) => {
          const active = index <= value;
          return (
            <Pressable
              key={`rating-${index}`}
              style={[styles.ratingStep, active && styles.ratingStepActive]}
              onPress={() => onChange(index)}
            />
          );
        })}
      </View>
      <Text style={styles.ratingValue}>{value.toFixed(1)}</Text>
    </View>
  );
}

export default function UploadAudioScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [audioType, setAudioType] = useState("music");
  const [duration, setDuration] = useState("0");
  const [artistName, setArtistName] = useState("");
  const [source, setSource] = useState("AI Generated");
  const [rating, setRating] = useState(0);
  const [priority, setPriority] = useState("0");
  const [licenseType, setLicenseType] = useState(
    "Envato MusicGen - Commercial License",
  );
  const [licenseUrl, setLicenseUrl] = useState("");
  const [attributionRequired, setAttributionRequired] = useState(false);
  const [redistributionAllowed, setRedistributionAllowed] = useState(false);
  const [usageNotes, setUsageNotes] = useState("");

  const [audioFile, setAudioFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const previewSoundRef = useRef(null);

  const waveformBars = useMemo(() => {
    const seed = String(audioFile?.name || "wave")
      .split("")
      .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

    return Array.from({ length: 20 }, (_, index) => {
      return 8 + ((seed + index * 13) % 28);
    });
  }, [audioFile?.name]);

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const picked = result.assets[0];
      let detectedDurationSeconds = 0;

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: picked.uri },
          { shouldPlay: false },
        );
        const status = await sound.getStatusAsync();
        if (status?.isLoaded && status.durationMillis) {
          detectedDurationSeconds = Math.round(status.durationMillis / 1000);
        }
        await sound.unloadAsync();
      } catch {
        // Keep manual duration fallback if detection fails
      }

      setAudioFile({
        uri: picked.uri,
        name: picked.name || `audio-${Date.now()}.mp3`,
        type: picked.mimeType || "audio/mpeg",
        size: picked.size || 0,
        durationSeconds: detectedDurationSeconds,
      });

      if (detectedDurationSeconds > 0) {
        setDuration(String(detectedDurationSeconds));
      }
    } catch (error) {
      Alert.alert("File error", "Unable to select audio file.");
    }
  };

  const togglePreviewPlay = async () => {
    if (!audioFile?.uri) {
      Alert.alert("No file", "Please select an audio file first.");
      return;
    }

    try {
      if (previewSoundRef.current) {
        if (previewPlaying) {
          await previewSoundRef.current.pauseAsync();
          setPreviewPlaying(false);
        } else {
          await previewSoundRef.current.playAsync();
          setPreviewPlaying(true);
        }
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioFile.uri },
        { shouldPlay: true },
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPreviewPlaying(false);
        }
      });

      previewSoundRef.current = sound;
      setPreviewPlaying(true);
    } catch {
      Alert.alert("Preview error", "Unable to play selected file.");
    }
  };

  const cleanupPreview = useCallback(async () => {
    if (!previewSoundRef.current) {
      return;
    }
    try {
      await previewSoundRef.current.stopAsync();
      await previewSoundRef.current.unloadAsync();
    } catch {}
    previewSoundRef.current = null;
    setPreviewPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanupPreview();
    };
  }, [cleanupPreview]);

  const canSubmit = useMemo(() => {
    return Boolean(title.trim() && audioFile?.uri);
  }, [audioFile?.uri, title]);

  const onCancel = async () => {
    await cleanupPreview();
    router.back();
  };

  const onUpload = async () => {
    if (!canSubmit || !audioFile?.uri) {
      Alert.alert("Missing info", "Audio title and file are required.");
      return;
    }

    if (!API_BASE_URL) {
      Alert.alert("API not configured", "Please set API URL in app config.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("audio", {
      uri: audioFile.uri,
      name: audioFile.name,
      type: audioFile.type,
    });

    formData.append("title", title.trim());
    formData.append("category", category);
    formData.append("type", audioType);
    formData.append("duration", String(parseInt(duration || "0", 10) || 0));
    formData.append("artist_name", artistName.trim() || "Envato MusicGen AI");
    formData.append(
      "source",
      source.toLowerCase().includes("user") ? "user_uploaded" : "ai_generated",
    );
    formData.append("rating", String(rating));
    formData.append("priority", String(parseInt(priority || "0", 10) || 0));
    formData.append("license_type", licenseType.trim());
    formData.append("license_url", licenseUrl.trim());
    formData.append("attribution_required", String(attributionRequired));
    formData.append("is_redistribution_allowed", String(redistributionAllowed));
    formData.append("usage_notes", usageNotes.trim());

    // Current backend requires license_txt when soundflag !== 1.
    const soundflag = source.toLowerCase().includes("user") ? 1 : 0;
    formData.append("soundflag", String(soundflag));

    if (soundflag !== 1) {
      const licenseText = [
        `License Type: ${licenseType || "N/A"}`,
        `License URL: ${licenseUrl || "N/A"}`,
        `Usage Notes: ${usageNotes || "N/A"}`,
      ].join("\n");

      if (!FileSystem.cacheDirectory) {
        setIsUploading(false);
        Alert.alert("Storage error", "Temporary storage is not available.");
        return;
      }

      const licensePath = `${FileSystem.cacheDirectory}license-${Date.now()}.txt`;

      try {
        await FileSystem.writeAsStringAsync(licensePath, licenseText);
      } catch {
        setIsUploading(false);
        Alert.alert("File error", "Unable to prepare license file.");
        return;
      }

      formData.append("license_txt", {
        uri: licensePath,
        name: "license.txt",
        type: "text/plain",
      });
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/audio/upload`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }
      const pct = Math.max(1, Math.round((event.loaded / event.total) * 100));
      setUploadProgress(pct);
    };

    xhr.onload = async () => {
      setIsUploading(false);
      setUploadProgress(100);

      if (xhr.status >= 200 && xhr.status < 300) {
        Alert.alert("Success", "Audio uploaded successfully.", [
          {
            text: "OK",
            onPress: async () => {
              await cleanupPreview();
              router.back();
            },
          },
        ]);
        return;
      }

      let message = "Upload failed.";
      try {
        const parsed = JSON.parse(xhr.responseText || "{}");
        message = parsed?.error || parsed?.message || message;
      } catch {}

      Alert.alert("Upload error", message);
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setUploadProgress(0);
      Alert.alert("Network error", "Unable to upload audio.");
    };

    xhr.send(formData);
  };

  return (
    <LinearGradient colors={["#080A12", "#0E1222", "#15192C"]} style={styles.screen}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={onCancel}>
            <Ionicons name="arrow-back" size={18} color="#D5DCFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Upload Audio</Text>
          <View style={styles.backBtnGhost} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Audio Info</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Audio Title"
              placeholderTextColor="#7C86A8"
              style={styles.input}
            />

            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={category}
                onValueChange={(value) => setCategory(value)}
                dropdownIconColor="#D7DDF7"
                style={styles.picker}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <Picker.Item key={option} label={option} value={option} color="#E8ECFF" />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={audioType}
                onValueChange={(value) => setAudioType(value)}
                dropdownIconColor="#D7DDF7"
                style={styles.picker}
              >
                {TYPE_OPTIONS.map((option) => (
                  <Picker.Item key={option} label={option} value={option} color="#E8ECFF" />
                ))}
              </Picker>
            </View>

            <TextInput
              value={duration}
              onChangeText={setDuration}
              placeholder="Duration in seconds"
              placeholderTextColor="#7C86A8"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Section</Text>
            <Pressable style={styles.fileBtn} onPress={pickAudioFile}>
              <Ionicons name="document-attach-outline" size={18} color="#D8DEFF" />
              <Text style={styles.fileBtnText}>Upload Audio File</Text>
            </Pressable>

            {audioFile ? (
              <View style={styles.fileCard}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {audioFile.name}
                </Text>
                <Text style={styles.fileMeta}>
                  {(audioFile.size / (1024 * 1024 || 1)).toFixed(2)} MB · {formatSeconds(parseInt(duration || "0", 10))}
                </Text>

                <View style={styles.waveWrap}>
                  {waveformBars.map((h, idx) => (
                    <View key={`bar-${idx}`} style={[styles.waveBar, { height: h }]} />
                  ))}
                </View>

                <Pressable style={styles.previewBtn} onPress={togglePreviewPlay}>
                  <Ionicons
                    name={previewPlaying ? "pause" : "play"}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.previewText}>
                    {previewPlaying ? "Pause Preview" : "Play Preview"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metadata</Text>
            <TextInput
              value={artistName}
              onChangeText={setArtistName}
              placeholder="Artist Name"
              placeholderTextColor="#7C86A8"
              style={styles.input}
            />
            <TextInput
              value={source}
              onChangeText={setSource}
              placeholder="Source"
              placeholderTextColor="#7C86A8"
              style={styles.input}
            />

            <Text style={styles.label}>Rating (0 - 5)</Text>
            <RatingSlider value={rating} onChange={setRating} />

            <TextInput
              value={priority}
              onChangeText={setPriority}
              placeholder="Priority"
              keyboardType="numeric"
              placeholderTextColor="#7C86A8"
              style={styles.input}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>License Section</Text>
            <TextInput
              value={licenseType}
              onChangeText={setLicenseType}
              placeholder="License Type"
              placeholderTextColor="#7C86A8"
              style={styles.input}
            />
            <TextInput
              value={licenseUrl}
              onChangeText={setLicenseUrl}
              placeholder="License URL"
              placeholderTextColor="#7C86A8"
              autoCapitalize="none"
              style={styles.input}
            />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Attribution Required</Text>
              <Switch
                value={attributionRequired}
                onValueChange={setAttributionRequired}
                trackColor={{ false: "#2B3550", true: "#7C3AED" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Redistribution Allowed</Text>
              <Switch
                value={redistributionAllowed}
                onValueChange={setRedistributionAllowed}
                trackColor={{ false: "#2B3550", true: "#EC4899" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TextInput
              value={usageNotes}
              onChangeText={setUsageNotes}
              placeholder="Usage Notes"
              placeholderTextColor="#7C86A8"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
            />
          </View>

          {isUploading ? (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${Math.min(uploadProgress, 100)}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
              <ActivityIndicator size="small" color="#EC4899" style={{ marginTop: 8 }} />
            </View>
          ) : null}

          <View style={styles.bottomActions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.uploadActionWrap, !canSubmit && styles.uploadActionDisabled]}
              disabled={!canSubmit || isUploading}
              onPress={onUpload}
            >
              <LinearGradient
                colors={canSubmit ? ["#7C3AED", "#EC4899"] : ["#4B5563", "#4B5563"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.uploadAction}
              >
                <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                <Text style={styles.uploadActionText}>Upload Audio</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  backBtnGhost: { width: 36, height: 36 },
  headerTitle: {
    color: "#F4F7FF",
    fontSize: 20,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 12,
  },
  section: {
    backgroundColor: "rgba(18,23,36,0.9)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  sectionTitle: {
    color: "#E8ECFF",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 2,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#F4F7FF",
    fontSize: 14,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  pickerWrap: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  picker: {
    color: "#F4F7FF",
  },
  fileBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(172,196,255,0.45)",
    backgroundColor: "rgba(172,196,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  fileBtnText: {
    color: "#E8ECFF",
    fontWeight: "700",
  },
  fileCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  fileName: {
    color: "#F3F4FF",
    fontWeight: "700",
  },
  fileMeta: {
    color: "#9EB0D9",
    marginTop: 4,
    fontSize: 12,
  },
  waveWrap: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 42,
  },
  waveBar: {
    width: 4,
    borderRadius: 999,
    backgroundColor: "#7C83FF",
  },
  previewBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(124,131,255,0.35)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  label: {
    color: "#CDD5F3",
    fontSize: 13,
    fontWeight: "600",
  },
  ratingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  ratingTrack: {
    flex: 1,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingStep: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#374151",
  },
  ratingStepActive: {
    backgroundColor: "#F43F5E",
  },
  ratingValue: {
    color: "#F9FAFB",
    width: 36,
    textAlign: "right",
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    color: "#DFE5FF",
    fontSize: 14,
  },
  progressWrap: {
    backgroundColor: "rgba(18,23,36,0.9)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 12,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#EC4899",
  },
  progressText: {
    color: "#E8ECFF",
    marginTop: 8,
    fontWeight: "700",
    textAlign: "right",
  },
  bottomActions: {
    marginTop: 6,
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cancelBtnText: {
    color: "#E8ECFF",
    fontSize: 15,
    fontWeight: "700",
  },
  uploadActionWrap: {
    flex: 1.4,
    borderRadius: 14,
    overflow: "hidden",
  },
  uploadActionDisabled: {
    opacity: 0.6,
  },
  uploadAction: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  uploadActionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
