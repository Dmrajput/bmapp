import { useAuth } from "@/context/auth-context";
import { useFavorites } from "@/context/favorites-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import { router } from "expo-router";
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

export default function FavoritesScreen() {
  const { favorites, removeFavorite } = useFavorites();
  const { accessToken } = useAuth();

  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);
  const [playbackPositionMillis, setPlaybackPositionMillis] = useState(0);
  const [playbackDurationMillis, setPlaybackDurationMillis] = useState(0);
  const [downloadStates, setDownloadStates] = useState({});

  const soundRef = useRef(null);
  const barWidthsRef = useRef({});

  /* ---------------- AUDIO ---------------- */
  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setCurrentTrackId(null);
    setIsPlaying(false);
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
      } catch (e) {
        console.log("Audio error:", e);
      } finally {
        setIsLoadingSound(false);
      }
    },
    [currentTrackId, isPlaying, unloadSound],
  );

  useFocusEffect(useCallback(() => () => unloadSound(), [unloadSound]));

  const formatTime = (ms) => {
    const s = Math.floor((ms || 0) / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  /* ---------------- UI ---------------- */
  const renderItem = ({ item }) => {
    const active = currentTrackId === item.id;
    const duration = active
      ? playbackDurationMillis
      : (item.durationSeconds || 0) * 1000;
    const position = active ? playbackPositionMillis : 0;
    const progress = duration ? position / duration : 0;

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
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>

          <Text style={styles.time}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => removeFavorite(item.id)}>
            <Ionicons name="heart" size={18} color="#ec4899" />
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
      <Text style={styles.header}>Favorites</Text>

      {!accessToken ? (
        <View style={styles.empty}>
          <Ionicons name="lock-closed-outline" size={36} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Login required</Text>
          <Text style={styles.emptyText}>
            Sign in to access your favorite tracks
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.primaryText}>Login</Text>
          </Pressable>
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={36} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>Tap ❤️ on any track to save it</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    padding: 16,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardActive: {
    borderWidth: 1,
    borderColor: "#6366f1",
  },

  cardLeft: { flex: 1, paddingRight: 10 },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  meta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366f1",
  },
  time: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },

  actions: {
    alignItems: "center",
    justifyContent: "space-between",
  },

  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  playBtnActive: {
    backgroundColor: "#4f46e5",
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
  },
});
