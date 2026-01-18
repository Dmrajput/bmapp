import { useFavorites } from "@/context/favorites-context";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

export default function MusicListScreen({ route }) {
  const categoryParam = route?.params?.category || "All";

  const [musicList, setMusicList] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);
  const [playbackPositionMillis, setPlaybackPositionMillis] = useState(0);
  const [playbackDurationMillis, setPlaybackDurationMillis] = useState(0);
  const [downloadStates, setDownloadStates] = useState({});

  const { toggleFavorite, isFavorite } = useFavorites();

  const soundRef = useRef(null);
  const barWidthsRef = useRef({});

  // ---------------- FETCH AUDIO ----------------
  useEffect(() => {
    const load = async () => {
      setIsLoadingData(true);
      try {
        const data =
          categoryParam === "All"
            ? await apiService.fetchFormattedAudio()
            : await apiService.fetchFormattedAudioByCategory(categoryParam);

        setMusicList(data);
      } catch (e) {
        console.log("❌ Fetch error:", e);
      } finally {
        setIsLoadingData(false);
      }
    };

    load();
  }, [categoryParam]);

  useEffect(() => {
    const hydrateDownloads = async () => {
      if (!musicList.length) return;
      const nextStates = {};
      await Promise.all(
        musicList.map(async (item) => {
          const fileUri = getDownloadPath(item);
          const info = await FileSystem.getInfoAsync(fileUri);
          nextStates[item.id] = info.exists ? "downloaded" : "idle";
        }),
      );
      setDownloadStates((prev) => ({ ...prev, ...nextStates }));
    };

    hydrateDownloads();
  }, [musicList]);

  // ---------------- AUDIO CONTROL ----------------
  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlaybackPositionMillis(0);
    setPlaybackDurationMillis(0);
    setCurrentTrackId(null);
    setIsPlaying(false);
  }, []);

  const playPause = useCallback(
    async (item) => {
      setIsLoadingSound(true);

      try {
        // Same track → toggle
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

        // New track
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
      } catch (e) {
        console.log("❌ Audio error:", e);
      } finally {
        setIsLoadingSound(false);
      }
    },
    [currentTrackId, isPlaying, unloadSound],
  );

  const formatTime = (millis) => {
    const totalSeconds = Math.floor((millis || 0) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getDownloadPath = (item) => {
    const base = String(item.id || item.title || "track")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `${FileSystem.documentDirectory}audio-${base}.mp3`;
  };

  const handleSeek = async (item, locationX) => {
    if (!soundRef.current || currentTrackId !== item.id) return;
    const width = barWidthsRef.current[item.id];
    if (!width || !playbackDurationMillis) return;
    const ratio = Math.max(0, Math.min(1, locationX / width));
    await soundRef.current.setPositionAsync(ratio * playbackDurationMillis);
  };

  const handleDownload = async (item) => {
    if (!item?.uri) return;
    const state = downloadStates[item.id] || "idle";
    if (state === "downloading") return;

    setDownloadStates((prev) => ({ ...prev, [item.id]: "downloading" }));

    const fileUri = getDownloadPath(item);
    const download = FileSystem.createDownloadResumable(
      item.uri,
      fileUri,
      {},
      () => {},
    );

    try {
      await download.downloadAsync();
      setDownloadStates((prev) => ({ ...prev, [item.id]: "downloaded" }));
    } catch (error) {
      console.log("❌ Download error:", error);
      setDownloadStates((prev) => ({ ...prev, [item.id]: "error" }));
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      unloadSound();
    };
  }, [unloadSound]);

  // ---------------- UI ----------------
  const renderItem = ({ item }) => {
    const active = currentTrackId === item.id;
    const durationMillis = active
      ? playbackDurationMillis
      : (item.durationSeconds || 0) * 1000;
    const positionMillis = active ? playbackPositionMillis : 0;
    const progress = durationMillis ? positionMillis / durationMillis : 0;
    const downloadState = downloadStates[item.id] || "idle";
    const favorite = isFavorite(item.id);

    return (
      <View style={[styles.card, active && styles.cardActive]}>
        <View style={styles.cardLeft}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.category}</Text>

          <View style={styles.progressRow}>
            <Pressable
              style={styles.progressBar}
              onLayout={(event) => {
                barWidthsRef.current[item.id] = event.nativeEvent.layout.width;
              }}
              onPress={(event) => handleSeek(item, event.nativeEvent.locationX)}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </Pressable>
            <Text style={styles.timeLabel}>
              {formatTime(positionMillis)} / {formatTime(durationMillis)}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Pressable
            style={[styles.favoriteBtn, favorite && styles.favoriteBtnActive]}
            onPress={() => toggleFavorite(item)}
          >
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={18}
              color={favorite ? "#f472b6" : "#e2e8f0"}
            />
          </Pressable>

          <Pressable
            style={styles.downloadBtn}
            onPress={() => handleDownload(item)}
          >
            {downloadState === "downloading" ? (
              <ActivityIndicator size="small" color="#cbd5f5" />
            ) : downloadState === "downloaded" ? (
              <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
            ) : downloadState === "error" ? (
              <Ionicons name="refresh" size={20} color="#f87171" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#e2e8f0" />
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
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{categoryParam}</Text>

      {isLoadingData ? (
        <ActivityIndicator size="large" color="#3949ab" />
      ) : (
        <FlatList
          data={musicList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  header: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    padding: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151515",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardActive: {
    borderColor: "#6366f1",
    backgroundColor: "#1b1b2e",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cardLeft: { flex: 1, paddingRight: 12 },
  title: { color: "#fff", fontSize: 16, fontWeight: "600" },
  meta: { color: "#9aa0a6", fontSize: 12, marginTop: 4 },
  progressRow: { marginTop: 12 },
  progressBar: {
    height: 4,
    backgroundColor: "#252525",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366f1",
  },
  timeLabel: {
    color: "#9aa0a6",
    fontSize: 11,
    marginTop: 6,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  favoriteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  favoriteBtnActive: {
    backgroundColor: "#2a1b2a",
    borderColor: "#f472b6",
  },
  playBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnActive: {
    backgroundColor: "#3949ab",
  },
  playText: { color: "#fff", fontWeight: "700" },
});
