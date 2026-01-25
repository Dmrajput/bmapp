import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrackDetailsScreen() {
  const { track } = useLocalSearchParams();
  const item = useMemo(() => {
    try {
      return typeof track === "string" ? JSON.parse(track) : track;
    } catch (error) {
      return null;
    }
  }, [track]);

  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const playPreview = async () => {
    if (!item?.audioUrl && !item?.uri) return;

    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: item.audioUrl || item.uri },
        { shouldPlay: true },
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          setIsPlaying(false);
        }
      });

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Track not found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#111827" />
            <Text style={styles.backText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isAiGenerated = item.source === "ai_generated";
  const attributionRequired = Boolean(item.attribution_required);
  const redistributionAllowed = Boolean(item.is_redistribution_allowed);
  const safeUsageLabel = isAiGenerated ? "AI Generated" : "Licensed";
  const durationText = formatDuration(item.duration);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Track Details</Text>
        </View>

        {/* TITLE */}
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{item.category}</Text>
          <View style={styles.dot} />
          <Text style={styles.meta}>{durationText}</Text>
        </View>

        {/* PREVIEW */}
        <Pressable style={styles.previewBtn} onPress={playPreview}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons
              name={isPlaying ? "stop" : "play"}
              size={20}
              color="#fff"
            />
          )}
          <Text style={styles.previewText}>
            {isPlaying ? "Stop Preview" : "Play Preview"}
          </Text>
        </Pressable>

        {/* LICENSE STATUS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Usage Rights</Text>

          {/* ✅ License-related badges */}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.badgeSafe]}>
              <Ionicons name="shield-checkmark" size={14} color="#16a34a" />
              <Text style={styles.badgeText}>Free to use</Text>
            </View>
            <View style={[styles.badge, styles.badgeMuted]}>
              <Ionicons name="sparkles" size={14} color="#2563eb" />
              <Text style={styles.badgeText}>{safeUsageLabel}</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                attributionRequired ? styles.badgeWarn : styles.badgeSafe,
              ]}
            >
              <Ionicons
                name={attributionRequired ? "alert" : "checkmark-circle"}
                size={14}
                color={attributionRequired ? "#b45309" : "#16a34a"}
              />
              <Text style={styles.badgeText}>
                {attributionRequired ? "Credit required" : "No credit required"}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                redistributionAllowed ? styles.badgeSafe : styles.badgeWarn,
              ]}
            >
              <Ionicons
                name={
                  redistributionAllowed ? "checkmark-circle" : "close-circle"
                }
                size={14}
                color={redistributionAllowed ? "#16a34a" : "#b45309"}
              />
              <Text style={styles.badgeText}>
                {redistributionAllowed
                  ? "Redistribution OK"
                  : "No redistribution"}
              </Text>
            </View>
          </View>

          <Text style={styles.safeBlurb}>
            Safe for YouTube (including Shorts), Instagram Reels, Facebook
            videos, ads, and client projects.
          </Text>
        </View>

        {/* LICENSE INFO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>License Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Source</Text>
            <Text style={styles.value}>
              {isAiGenerated ? "AI Generated Music" : item.source}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>License Type</Text>
            <Text style={styles.value}>{item.license_type || "—"}</Text>
          </View>

          {/* ✅ License proof section */}
          {item.license_url ? (
            <Pressable
              style={styles.linkRow}
              onPress={() => Linking.openURL(item.license_url)}
            >
              <Ionicons name="document-text" size={16} color="#4f46e5" />
              <Text style={styles.link}>View License Proof</Text>
            </Pressable>
          ) : null}
        </View>

        {/* CREATOR */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Creator</Text>
          <Text style={styles.value}>{item.artist_name || "—"}</Text>
        </View>

        {/* USAGE NOTES */}
        {item.usage_notes ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Usage Notes</Text>
            <Text style={styles.value}>{item.usage_notes}</Text>
          </View>
        ) : null}

        {/* SAFETY MESSAGE */}
        <View style={styles.safeBox}>
          <Ionicons name="shield-checkmark" size={20} color="#16a34a" />
          <Text style={styles.safeText}>
            Copyright-safe for YouTube (including Shorts), Instagram Reels,
            Facebook videos, and ad campaigns. Use confidently in client work.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { padding: 16, paddingBottom: 28 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  meta: {
    fontSize: 13,
    color: "#6B7280",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5F5",
  },

  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6366f1",
    padding: 14,
    borderRadius: 14,
    marginVertical: 16,
    justifyContent: "center",
  },
  previewText: {
    color: "#fff",
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
    marginBottom: 10,
  },

  label: {
    fontSize: 12,
    color: "#6B7280",
  },
  value: {
    fontSize: 14,
    color: "#111827",
    marginTop: 4,
  },
  infoRow: {
    marginBottom: 10,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
  },
  badgeSafe: {
    backgroundColor: "#DCFCE7",
  },
  badgeWarn: {
    backgroundColor: "#FEF3C7",
  },
  badgeMuted: {
    backgroundColor: "#E0E7FF",
  },
  badgeText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
  safeBlurb: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
  },

  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  link: {
    color: "#4f46e5",
    fontWeight: "600",
  },

  safeBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#ECFDF5",
    padding: 14,
    borderRadius: 16,
    marginTop: 6,
  },
  safeText: {
    color: "#065F46",
    fontSize: 13,
    flex: 1,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backText: {
    color: "#111827",
    fontWeight: "600",
  },
});
