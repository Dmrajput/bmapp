import { useFavorites } from "@/context/favorites-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  const [downloadingId, setDownloadingId] = useState(null);

  const soundRef = useRef(null);

  /* ---------------- HELPERS ---------------- */
  const shuffleList = (list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
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

  /* ---------------- DOWNLOAD AUDIO ---------------- */
  const downloadAudio = async (item) => {
    try {
      setDownloadingId(item.id);

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please allow storage permission");
        return;
      }

      const safeName = item.title.replace(/[^a-zA-Z0-9]/g, "_");
      const tempUri = FileSystem.cacheDirectory + `${safeName}.mp3`;

      const download = FileSystem.createDownloadResumable(item.uri, tempUri);

      const { uri } = await download.downloadAsync();

      const asset = await MediaLibrary.createAssetAsync(uri);

      let album = await MediaLibrary.getAlbumAsync("Download");
      if (!album) {
        await MediaLibrary.createAlbumAsync("Download", asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert("Downloaded ✅", "Saved to Downloads folder");
    } catch (err) {
      console.log("❌ Download error:", err);
      Alert.alert("Download Failed", "Please try again");
    } finally {
      setDownloadingId(null);
    }
  };

  /* ---------------- AUDIO CONTROL ---------------- */
  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
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
      try {
        if (currentTrackId === item.id && soundRef.current) {
          if (isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
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

        setRecentlyPlayed((prev) => {
          const filtered = prev.filter((i) => i.id !== item.id);
          return [item, ...filtered].slice(0, 8);
        });
      } catch (err) {
        setErrorMessage("Audio failed to load");
      } finally {
        setIsLoadingSound(false);
      }
    },
    [currentTrackId, isPlaying, unloadSound],
  );

  /* ---------------- DATA FETCH ---------------- */
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setIsLoadingData(true);
        try {
          const data = await apiService.fetchFormattedAudio();
          if (active) setMusicList(shuffleList(data));
        } catch {
          if (active) setErrorMessage("Unable to load music");
        } finally {
          if (active) setIsLoadingData(false);
        }
      };
      load();
      return () => {
        active = false;
        unloadSound();
      };
    }, [unloadSound]),
  );

  /* ---------------- RENDER ITEM ---------------- */
  const renderItem = ({ item }) => {
    const active = currentTrackId === item.id;
    const favorite = isFavorite(item.id);

    return (
      <View style={[styles.card, active && styles.cardActive]}>
        <View style={styles.cardLeft}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.meta}>{item.category}</Text>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    active && playbackDurationMillis
                      ? (playbackPositionMillis / playbackDurationMillis) * 100
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.cardActions}>
          {/* DOWNLOAD */}
          <Pressable onPress={() => downloadAudio(item)}>
            {downloadingId === item.id ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#6b7280" />
            )}
          </Pressable>

          {/* FAVORITE */}
          <Pressable onPress={() => toggleFavorite(item)}>
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={20}
              color={favorite ? "#ec4899" : "#9ca3af"}
            />
          </Pressable>

          {/* PLAY */}
          <Pressable style={styles.playBtn} onPress={() => playPause(item)}>
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
      <Text style={styles.header}>All Music</Text>

      {isLoadingData ? (
        <ActivityIndicator size="large" color="#6366f1" />
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

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { fontSize: 22, fontWeight: "800", padding: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardActive: { borderColor: "#6366f1" },
  cardLeft: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700" },
  meta: { fontSize: 12, color: "#6b7280" },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginTop: 8,
  },
  progressFill: { height: 4, backgroundColor: "#6366f1" },
  cardActions: { alignItems: "center", gap: 10 },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
});
