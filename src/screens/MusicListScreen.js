import { Audio } from "expo-av";
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

  const soundRef = useRef(null);

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

  // ---------------- AUDIO CONTROL ----------------
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

  // Cleanup
  useEffect(() => {
    return () => {
      unloadSound();
    };
  }, [unloadSound]);

  // ---------------- UI ----------------
  const renderItem = ({ item }) => {
    const active = currentTrackId === item.id;

    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.category}</Text>
        </View>

        <Pressable
          style={[styles.playBtn, active && styles.playBtnActive]}
          onPress={() => playPause(item)}
        >
          {isLoadingSound && active ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.playText}>
              {active && isPlaying ? "Pause" : "Play"}
            </Text>
          )}
        </Pressable>
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "600" },
  meta: { color: "#9aa0a6", fontSize: 12, marginTop: 4 },
  playBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
  },
  playBtnActive: {
    backgroundColor: "#3949ab",
  },
  playText: { color: "#fff", fontWeight: "700" },
});
