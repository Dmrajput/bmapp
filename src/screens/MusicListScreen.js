import { useFavorites } from "@/context/favorites-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import Constants from "expo-constants";
import { router } from "expo-router";
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

/* ---------------- ADS SAFE LOADING ---------------- */
const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  (Constants.appOwnership === "expo" && !Constants.executionEnvironment);

let BannerAd = null;
let BannerAdSize = null;
let TestIds = null;

if (!isExpoGo) {
  try {
    const ads = require("react-native-google-mobile-ads");
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds = ads.TestIds;
  } catch {}
}

const AD_UNIT_ID =
  __DEV__ && TestIds ? TestIds.BANNER : "ca-app-pub-xxxxxxxx/yyyyyyyy";

/* ================================================= */

export default function MusicListScreen({ route }) {
  const categoryParam = route?.params?.category || "All";

  const [musicList, setMusicList] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);
  const [playbackPositionMillis, setPlaybackPositionMillis] = useState(0);
  const [playbackDurationMillis, setPlaybackDurationMillis] = useState(0);

  const { toggleFavorite, isFavorite } = useFavorites();

  const soundRef = useRef(null);

  /* ---------------- FETCH AUDIO ---------------- */
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

  /* ---------------- AUDIO CONTROL ---------------- */
  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setCurrentTrackId(null);
    setIsPlaying(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => unloadSound();
    }, [unloadSound]),
  );

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

  const openDetails = useCallback((item) => {
    router.push({
      pathname: "/track-details",
      params: { track: JSON.stringify(item) },
    });
  }, []);

  /* ---------------- UI ---------------- */
  const renderItem = ({ item, index }) => {
    const active = currentTrackId === item.id;
    const durationMillis = active
      ? playbackDurationMillis
      : (item.duration || 0) * 1000;
    const positionMillis = active ? playbackPositionMillis : 0;
    const progress = durationMillis ? positionMillis / durationMillis : 0;
    const favorite = isFavorite(item.id);

    return (
      <>
        {/* Inline Ads */}
        {BannerAd && BannerAdSize && index !== 0 && index % 5 === 0 && (
          <View style={styles.adInline}>
            <BannerAd unitId={AD_UNIT_ID} size={BannerAdSize.BANNER} />
          </View>
        )}

        <View style={[styles.card, active && styles.cardActive]}>
          <View style={styles.cardLeft}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>

            <Text style={styles.meta}>
              {item.category} • {item.duration}s
            </Text>

            {/* 🔒 NO COPYRIGHT INFO */}
            <View style={styles.badgesRow}>
              {item.is_redistribution_allowed && (
                <Text style={styles.badgeGreen}>Free to Use</Text>
              )}
              {!item.attribution_required && (
                <Text style={styles.badgeBlue}>No Credit</Text>
              )}
              {item.source === "ai_generated" && (
                <Text style={styles.badgeGray}>AI Generated</Text>
              )}
            </View>

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

            <Pressable onPress={() => openDetails(item)}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#64748b"
              />
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
      {/* Top Banner */}
      {BannerAd && BannerAdSize && (
        <View style={styles.adTop}>
          <BannerAd unitId={AD_UNIT_ID} size={BannerAdSize.BANNER} />
        </View>
      )}

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
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  adTop: { alignItems: "center", marginBottom: 8 },
  adInline: { alignItems: "center", marginVertical: 12 },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardActive: {
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  cardLeft: { flex: 1, paddingRight: 12 },

  title: { fontSize: 15, fontWeight: "700", color: "#111827" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 4 },

  badgesRow: { flexDirection: "row", gap: 6, marginTop: 6 },

  badgeGreen: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontWeight: "600",
  },
  badgeBlue: {
    backgroundColor: "#E0E7FF",
    color: "#3730A3",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontWeight: "600",
  },
  badgeGray: {
    backgroundColor: "#E5E7EB",
    color: "#374151",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontWeight: "600",
  },

  progressRow: { marginTop: 10 },
  progressBar: {
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#6366f1" },
  timeLabel: { fontSize: 11, color: "#6B7280", marginTop: 6 },

  cardActions: { justifyContent: "space-between", alignItems: "center" },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  playBtnActive: { backgroundColor: "#4f46e5" },
});
