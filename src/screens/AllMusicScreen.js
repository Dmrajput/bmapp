import { useFavorites } from "@/context/favorites-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import { Directory, File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiService from "../services/apiService";

export default function AllMusicScreen() {
  const { toggleFavorite, isFavorite } = useFavorites();

  const [musicList, setMusicList] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);
  const [playbackPositionMillis, setPlaybackPositionMillis] = useState(0);
  const [playbackDurationMillis, setPlaybackDurationMillis] = useState(0);
  const [downloadStates, setDownloadStates] = useState({});

  const soundRef = useRef(null);

  /* ---------------- HELPERS ---------------- */
  const shuffleList = (list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor((millis || 0) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getDownloadTarget = (item) => {
    const base = String(item.id || item.title || "track")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const directory = new Directory(Paths.document, "all-music");
    return new File(directory, `${base}.mp3`);
  };

  /* ---------------- AUDIO CONTROL ---------------- */
  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setCurrentTrackId(null);
    setIsPlaying(false);
    setPlaybackPositionMillis(0);
    setPlaybackDurationMillis(0);
  }, []);

  const playPause = useCallback(
    async (item) => {
      setIsLoadingSound(true);
      setErrorMessage("");

      try {
        if (currentTrackId === item.id && soundRef.current) {
          if (isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
          setIsLoadingSound(false);
          return;
        }

        await unloadSound();

        const { sound } = await Audio.Sound.createAsync(
          { uri: item.uri },
          { shouldPlay: true },
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          setPlaybackPositionMillis(status.positionMillis || 0);
          setPlaybackDurationMillis(status.durationMillis || 0);
        });

        soundRef.current = sound;
        setCurrentTrackId(item.id);
        setIsPlaying(true);

        // ✅ Recently played (optional)
        setRecentlyPlayed((prev) => {
          const filtered = prev.filter((i) => i.id !== item.id);
          return [item, ...filtered].slice(0, 8);
        });
      } catch (error) {
        console.log("❌ Audio error:", error);
        setErrorMessage("Audio failed to load. Please try again.");
      } finally {
        setIsLoadingSound(false);
      }
    },
    [currentTrackId, isPlaying, unloadSound],
  );

  /* ---------------- DOWNLOAD ---------------- */
  const handleDownload = async (item) => {
    if (!item?.uri) return;
    const state = downloadStates[item.id] || "idle";
    if (state === "downloading") return;

    setDownloadStates((prev) => ({ ...prev, [item.id]: "downloading" }));

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage("Storage permission is required to save downloads.");
        setDownloadStates((prev) => ({ ...prev, [item.id]: "error" }));
        return;
      }

      const destination = getDownloadTarget(item);
      destination.parentDirectory.create({
        intermediates: true,
        idempotent: true,
      });
      await File.downloadFileAsync(item.uri, destination, { idempotent: true });

      const asset = await MediaLibrary.createAssetAsync(destination.uri);
      await MediaLibrary.createAlbumAsync("Download", asset, false);
      setDownloadStates((prev) => ({ ...prev, [item.id]: "downloaded" }));
    } catch (error) {
      console.log("❌ Download error:", error);
      const msg = String(error?.message || "");
      if (
        msg.includes("requestPermissionsAsync") &&
        (msg.includes("not declared in AndroidManifest") ||
          msg.includes("has been rejected"))
      ) {
        setErrorMessage(
          "Downloads need media permissions. Expo Go can’t fully test this—please use a development build or rebuild the app after updating permissions.",
        );
      } else {
        setErrorMessage("Unable to download right now. Please try again.");
      }
      setDownloadStates((prev) => ({ ...prev, [item.id]: "error" }));
    }
  };

  /* ---------------- DATA FETCH (ALL + SHUFFLE) ---------------- */
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        setIsLoadingData(true);
        setErrorMessage("");
        try {
          const data = await apiService.fetchFormattedAudio();
          if (!isActive) return;
          const shuffled = shuffleList(data);
          setMusicList(shuffled);
        } catch (error) {
          console.log("❌ Fetch error:", error);
          if (isActive) {
            setErrorMessage("Unable to load music. Please try again.");
            setMusicList([]);
          }
        } finally {
          if (isActive) setIsLoadingData(false);
        }
      };

      load();

      return () => {
        isActive = false;
        unloadSound();
      };
    }, [unloadSound]),
  );

  /* ---------------- RENDER ---------------- */
  const renderRecentItem = ({ item }) => (
    <Pressable style={styles.recentCard} onPress={() => playPause(item)}>
      <Ionicons name="play-circle" size={26} color="#6366f1" />
      <Text style={styles.recentTitle} numberOfLines={1}>
        {item.title}
      </Text>
    </Pressable>
  );

  const renderItem = ({ item, index }) => {
    const active = currentTrackId === item.id;
    const durationMillis = active
      ? playbackDurationMillis
      : (item.durationSeconds || 0) * 1000;
    const positionMillis = active ? playbackPositionMillis : 0;
    const progress = durationMillis ? positionMillis / durationMillis : 0;
    const favorite = isFavorite(item.id);
    const downloadState = downloadStates[item.id] || "idle";

    return (
      <>
        {/* Optional inline ad placeholder */}
        {/* {index !== 0 && index % 6 === 0 && (
          <View style={styles.adInlinePlaceholder}>
            <Text style={styles.adInlineText}>Ad Slot</Text>
          </View>
        )} */}

        <View style={[styles.card, active && styles.cardActive]}>
          <View style={styles.cardLeft}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.category}
            </Text>

            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(progress * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.timeLabel}>
                {formatTime(positionMillis)} / {formatTime(durationMillis)}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <Pressable onPress={() => toggleFavorite(item)}>
              <Ionicons
                name={favorite ? "heart" : "heart-outline"}
                size={20}
                color={favorite ? "#ec4899" : "#9ca3af"}
              />
            </Pressable>

            <Pressable
              style={styles.downloadBtn}
              onPress={() => handleDownload(item)}
            >
              {downloadState === "downloading" ? (
                <ActivityIndicator size="small" color="#6b7280" />
              ) : downloadState === "downloaded" ? (
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              ) : downloadState === "error" ? (
                <Ionicons name="refresh" size={20} color="#ef4444" />
              ) : (
                <Ionicons name="download-outline" size={20} color="#6b7280" />
              )}
            </Pressable>

            <Pressable
              style={[styles.playBtn, active && styles.playBtnActive]}
              onPress={() => playPause(item)}
            >
              {isLoadingSound && active ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons
                  name={active && isPlaying ? "pause" : "play"}
                  size={18}
                  color="#fff"
                />
              )}
            </Pressable>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Recommended for You</Text>
      <Text style={styles.header}>All Music • Random</Text>

      {!!recentlyPlayed.length && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <FlatList
            horizontal
            data={recentlyPlayed}
            keyExtractor={(item) => item.id}
            renderItem={renderRecentItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentList}
          />
        </View>
      )}

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {isLoadingData ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading music...</Text>
        </View>
      ) : musicList.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>No tracks yet</Text>
          <Text style={styles.emptyText}>
            Add a few songs to get your soundtrack started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={musicList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  label: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  header: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  recentSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  recentList: {
    paddingVertical: 6,
  },
  recentCard: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginRight: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  recentTitle: {
    color: "#111827",
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardActive: {
    borderColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardLeft: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  progressRow: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: "#6366f1",
  },
  timeLabel: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 6,
  },
  cardActions: {
    alignItems: "center",
    gap: 10,
  },
  downloadBtn: {
    padding: 4,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnActive: {
    backgroundColor: "#4338ca",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 8,
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 6,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  adInlinePlaceholder: {
    alignItems: "center",
    padding: 10,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  adInlineText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
});
