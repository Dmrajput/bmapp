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
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiService from "../services/apiService";

/* ---------------- ADMOB CONFIGURATION ---------------- */
const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  (Constants.appOwnership === "expo" && !Constants.executionEnvironment);

let BannerAd = null;
let BannerAdSize = null;
let TestIds = null;
let InterstitialAd = null;
let RewardedAd = null;
let mobileAds = null;
let AdEventType = null;

if (!isExpoGo) {
  try {
    const ads = require("react-native-google-mobile-ads");
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds = ads.TestIds;
    InterstitialAd = ads.InterstitialAd;
    RewardedAd = ads.RewardedAd;
    mobileAds = ads.mobileAds;
    AdEventType = ads.AdEventType;
  } catch (error) {
    console.log("⚠️ AdMob not available:", error.message);
  }
}

/* ---------------- AD UNIT IDS ---------------- */
const AD_UNIT_IDS = {
  BANNER:
    __DEV__ && TestIds
      ? TestIds.BANNER
      : "ca-app-pub-2136043836079463/6534214524",
  INTERSTITIAL:
    __DEV__ && TestIds
      ? TestIds.INTERSTITIAL
      : "ca-app-pub-2136043836079463/1855112220",
  REWARDED:
    __DEV__ && TestIds
      ? TestIds.REWARDED
      : "ca-app-pub-2136043836079463/3908051186",
};

/* ================================================= */

export default function MusicListScreen({ route }) {
  const categoryParam = route?.params?.category || "All";

  const [musicList, setMusicList] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);
  const [playbackPositionMillis, setPlaybackPositionMillis] = useState(0);
  const [playbackDurationMillis, setPlaybackDurationMillis] = useState(0);

  const { toggleFavorite, isFavorite } = useFavorites();

  const soundRef = useRef(null);
  const interstitialAdRef = useRef(null);
  const playCountRef = useRef(0);

  /* ---------------- ADMOB SAFE INIT ---------------- */
  useEffect(() => {
    if (!mobileAds || isExpoGo) return;

    mobileAds()
      .initialize()
      .then(() => console.log("✅ AdMob initialized"))
      .catch((e) => console.log("❌ AdMob init error:", e));
  }, []);

  /* ---------------- INTERSTITIAL SETUP (SAFE) ---------------- */
  useEffect(() => {
    if (!InterstitialAd || isExpoGo || !AdEventType) return;

    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialAdRef.current = ad;
      console.log("✅ Interstitial loaded");
    });

    const unsubscribeError = ad.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log("❌ Interstitial failed:", error);
      },
    );

    ad.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeError();
    };
  }, []);

  const showInterstitialAd = useCallback(() => {
    if (!interstitialAdRef.current || isExpoGo) return;

    playCountRef.current += 1;

    if (playCountRef.current % 5 === 0) {
      try {
        interstitialAdRef.current.show();
        interstitialAdRef.current = null; // force reload next
      } catch (e) {
        console.log("❌ Interstitial show error:", e);
      }
    }
  }, []);

  /* ---------------- FETCH AUDIO ---------------- */
  const loadMusic = useCallback(
    async (showRefresh = false) => {
      showRefresh ? setRefreshing(true) : setIsLoadingData(true);

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
        setRefreshing(false);
      }
    },
    [categoryParam],
  );

  useEffect(() => {
    loadMusic();
  }, [loadMusic]);

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

        showInterstitialAd();
      } catch (e) {
        console.log("❌ Audio error:", e);
      } finally {
        setIsLoadingSound(false);
      }
    },
    [currentTrackId, isPlaying, unloadSound, showInterstitialAd],
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
        {/* Inline Banner Ads - Show every 5 items */}
        {BannerAd && BannerAdSize && index !== 0 && index % 5 === 0 && (
          <View style={styles.adInlineContainer}>
            <View style={styles.adLabel}>
              <Text style={styles.adLabelText}>Advertisement</Text>
            </View>
            <View style={styles.adInline}>
              <BannerAd
                unitId={AD_UNIT_IDS.BANNER}
                size={BannerAdSize.BANNER}
                requestOptions={{
                  requestNonPersonalizedAdsOnly: true,
                }}
                onAdLoaded={() => console.log("✅ Banner ad loaded")}
                onAdFailedToLoad={(error) =>
                  console.log("❌ Banner ad failed:", error.message)
                }
              />
            </View>
          </View>
        )}

        <View style={[styles.card, active && styles.cardActive]}>
          <View style={styles.cardLeft}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              {active && (
                <View style={styles.playingIndicator}>
                  <View style={styles.playingDot} />
                </View>
              )}
            </View>

            <Text style={styles.meta}>
              {item.category} • {formatTime(durationMillis)}
            </Text>

            {/* Badges */}
            <View style={styles.badgesRow}>
              {item.is_redistribution_allowed && (
                <View style={styles.badgeGreen}>
                  <Ionicons name="checkmark-circle" size={12} color="#166534" />
                  <Text style={styles.badgeTextGreen}>Free to Use</Text>
                </View>
              )}
              {!item.attribution_required && (
                <View style={styles.badgeBlue}>
                  <Ionicons name="shield-checkmark" size={12} color="#3730A3" />
                  <Text style={styles.badgeTextBlue}>No Credit</Text>
                </View>
              )}
              {item.source === "ai_generated" && (
                <View style={styles.badgeGray}>
                  <Ionicons name="sparkles" size={12} color="#374151" />
                  <Text style={styles.badgeTextGray}>AI Generated</Text>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            {active && (
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
            )}
          </View>

          <View style={styles.cardActions}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => toggleFavorite(item)}
            >
              <Ionicons
                name={favorite ? "heart" : "heart-outline"}
                size={22}
                color={favorite ? "#ec4899" : "#9ca3af"}
              />
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => openDetails(item)}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#64748b"
              />
            </Pressable>

            <Pressable
              style={[styles.playBtn, active && styles.playBtnActive]}
              onPress={() => playPause(item)}
            >
              {isLoadingSound && active ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons
                  name={active && isPlaying ? "pause" : "play"}
                  size={20}
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header with Category */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {categoryParam === "All" ? "All Music" : categoryParam}
        </Text>
        <Text style={styles.headerSubtitle}>
          {musicList.length} {musicList.length === 1 ? "track" : "tracks"}
        </Text>
      </View>

      {/* Top Banner Ad */}
      {BannerAd && BannerAdSize && (
        <View style={styles.adTopContainer}>
          <View style={styles.adLabel}>
            <Text style={styles.adLabelText}>Advertisement</Text>
          </View>
          <View style={styles.adTop}>
            <BannerAd
              unitId={AD_UNIT_IDS.BANNER}
              size={BannerAdSize.BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
              onAdLoaded={() => console.log("✅ Top banner ad loaded")}
              onAdFailedToLoad={(error) =>
                console.log("❌ Top banner ad failed:", error.message)
              }
            />
          </View>
        </View>
      )}

      {isLoadingData && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading music...</Text>
        </View>
      ) : musicList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No music found</Text>
          <Text style={styles.emptyText}>
            Try a different category or check your connection
          </Text>
        </View>
      ) : (
        <FlatList
          data={musicList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadMusic(true)}
              tintColor="#6366f1"
              colors={["#6366f1"]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  adTopContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  adTop: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  adInlineContainer: {
    marginVertical: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  adInline: {
    alignItems: "center",
    marginTop: 4,
  },
  adLabel: {
    alignItems: "center",
    marginBottom: 4,
  },
  adLabelText: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  listContent: {
    padding: 16,
    paddingBottom: 32,
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardActive: {
    borderWidth: 2,
    borderColor: "#6366f1",
    shadowColor: "#6366f1",
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  cardLeft: {
    flex: 1,
    paddingRight: 12,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  playingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
  },
  playingDot: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#6366f1",
  },
  meta: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    fontWeight: "500",
  },

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  badgeGreen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextGreen: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "600",
  },
  badgeBlue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextBlue: {
    color: "#3730A3",
    fontSize: 11,
    fontWeight: "600",
  },
  badgeGray: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextGray: {
    color: "#374151",
    fontSize: 11,
    fontWeight: "600",
  },

  progressRow: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366f1",
    borderRadius: 2,
  },
  timeLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 6,
    fontWeight: "500",
  },

  cardActions: {
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 10,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  playBtnActive: {
    backgroundColor: "#4f46e5",
    transform: [{ scale: 1.05 }],
  },
});
