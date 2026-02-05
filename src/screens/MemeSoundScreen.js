import { useFavorites } from "@/context/favorites-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiService from "../services/apiService";

const PAGE_SIZE = 20;

/* ---------------- SOUND WAVE BUTTON ---------------- */
function PlayWaveButton({ playing, onPress }) {
  const bar1 = useRef(new Animated.Value(6)).current;
  const bar2 = useRef(new Animated.Value(10)).current;
  const bar3 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let loop;
    if (playing) {
      loop = Animated.loop(
        Animated.stagger(150, [
          Animated.sequence([
            Animated.timing(bar1, {
              toValue: 18,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(bar1, {
              toValue: 6,
              duration: 300,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(bar2, {
              toValue: 22,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(bar2, {
              toValue: 10,
              duration: 300,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(bar3, {
              toValue: 16,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(bar3, {
              toValue: 8,
              duration: 300,
              useNativeDriver: false,
            }),
          ]),
        ]),
      );
      loop.start();
    } else {
      bar1.setValue(6);
      bar2.setValue(10);
      bar3.setValue(8);
    }
    return () => loop?.stop();
  }, [playing]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.waveBtn,
        playing && styles.waveBtnActive,
        pressed && styles.waveBtnPressed,
      ]}
    >
      {playing ? (
        <View style={styles.waveContainer}>
          <Animated.View style={[styles.waveBar, { height: bar1 }]} />
          <Animated.View style={[styles.waveBar, { height: bar2 }]} />
          <Animated.View style={[styles.waveBar, { height: bar3 }]} />
        </View>
      ) : (
        <Ionicons name="play" size={18} color="#fff" />
      )}
    </Pressable>
  );
}

/* ---------------- ACTION BUTTON ---------------- */
function ActionButton({ icon, color, bg, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        { backgroundColor: bg },
        pressed && styles.actionBtnPressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
    </Pressable>
  );
}

export default function MemeSoundScreen() {
  const { toggleFavorite, isFavorite } = useFavorites();

  const [soundList, setSoundList] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);

  const soundRef = useRef(null);
  const playLockRef = useRef(false); // Prevent double click

  /* ---------------- SHARE ---------------- */
  const useSound = async (item) => {
    try {
      await Share.share({
        message: item.uri,
        title: "Use this meme sound",
      });
    } catch {
      Alert.alert("Failed", "Unable to share sound");
    }
  };

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
      if (isLoadingSound) return; // Prevent double click
      playLockRef.current = true;
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
          { shouldPlay: true, isLooping: false },
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            // Stop and reset after finish
            unloadSound();
          }
        });

        soundRef.current = sound;
        setCurrentTrackId(item.id);
        setIsPlaying(true);
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoadingSound(false);
        playLockRef.current = false;
      }
    },
    [currentTrackId, isPlaying, unloadSound],
  );

  const loadPage = useCallback(async ({ pageToLoad, query, replace }) => {
    if (replace) {
      setIsLoadingData(true);
    } else {
      setIsLoadingPage(true);
    }

    try {
      const result = await apiService.fetchFormattedAudioPaged({
        page: pageToLoad,
        limit: PAGE_SIZE,
        query: query?.trim() || "",
        type: "sound",
      });

      setSoundList((prev) =>
        replace ? result.data : [...prev, ...result.data],
      );
      setHasMore(
        typeof result.meta?.hasMore === "boolean"
          ? result.meta.hasMore
          : (result.data || []).length === PAGE_SIZE,
      );
      setPage(pageToLoad);
    } finally {
      setIsLoadingData(false);
      setIsLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPage({ pageToLoad: 1, query: searchQuery, replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadPage]);

  useFocusEffect(useCallback(() => () => unloadSound(), [unloadSound]));

  /* ---------------- RENDER ITEM ---------------- */
  const renderItem = ({ item }) => {
    const active = currentTrackId === item.id;
    const playing = active && isPlaying;
    const favorite = isFavorite(item.id);

    return (
      <Pressable
        style={[styles.card, active && styles.cardActive]}
        onPress={() => {
          if (!isLoadingSound) playPause(item);
        }}
        disabled={isLoadingSound}
      >
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={styles.duration}>{item.duration || 5}s</Text>

        <View style={styles.actions}>
          <PlayWaveButton
            playing={playing}
            onPress={() => {
              if (!isLoadingSound) playPause(item);
            }}
          />

          <ActionButton
            icon="share-social-outline"
            color="#6366F1"
            bg="#EEF2FF"
            onPress={() => useSound(item)}
          />

          <ActionButton
            icon={favorite ? "heart" : "heart-outline"}
            color={favorite ? "#EC4899" : "#6B7280"}
            bg={favorite ? "#FCE7F3" : "#F1F5F9"}
            onPress={() => toggleFavorite(item)}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Meme Sound</Text>

      {/* SEARCH BAR */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          placeholder="Search meme sounds..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* GRID */}
      {isLoadingData ? (
        <ActivityIndicator size="large" color="#6366F1" />
      ) : (
        <FlatList
          data={soundList}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (!isLoadingPage && hasMore) {
              loadPage({
                pageToLoad: page + 1,
                query: searchQuery,
                replace: false,
              });
            }
          }}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            isLoadingPage ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { fontSize: 22, fontWeight: "800", padding: 16 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
  },

  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    margin: 6,
  },
  cardActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },

  title: { fontSize: 14, fontWeight: "700" },
  duration: { fontSize: 12, color: "#6B7280", marginTop: 4 },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  waveBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  waveBtnActive: { backgroundColor: "#6366F1" },
  waveBtnPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },

  waveContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },

  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.85,
  },
});
