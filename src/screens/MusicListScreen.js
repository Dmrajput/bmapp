import { AD_UNIT_IDS } from "@/config/admob.config";
import { useFavorites } from "@/context/favorites-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import Constants from "expo-constants";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import apiService from "../services/apiService";

const PAGE_SIZE = 24;
const GRID_GAP = 12;
const HORIZONTAL_PADDING = 18;
const AD_PLAY_INTERVAL = 7;
const AD_TIME_COOLDOWN = 90_000;
const SOUND_COLORS = [
  ["#7CFF35", "#22C55E"],
  ["#FF5151", "#EF4444"],
  ["#5A67FF", "#4338CA"],
  ["#FFD64D", "#F59E0B"],
  ["#FF52B7", "#DB2777"],
  ["#FF9A3D", "#F97316"],
];

const isExpoGo =
  Constants.executionEnvironment === "storeClient" ||
  (Constants.appOwnership === "expo" && !Constants.executionEnvironment);

let BannerAd = null;
let BannerAdSize = null;
let InterstitialAd = null;
let mobileAds = null;
let AdEventType = null;

if (!isExpoGo) {
  try {
    const ads = require("react-native-google-mobile-ads");
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    InterstitialAd = ads.InterstitialAd;
    mobileAds = ads.mobileAds;
    AdEventType = ads.AdEventType;
  } catch {}
}

function getColorPair(itemId, index) {
  const source = String(itemId || index || "0");
  const colorIndex = source
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return SOUND_COLORS[colorIndex % SOUND_COLORS.length];
}

function getWaveformHeights(seed) {
  return Array.from({ length: 10 }, (_, index) => 10 + ((seed + index * 11) % 18));
}

function formatDurationLabel(item) {
  if (typeof item.duration === "string" && item.duration.trim()) {
    return item.duration;
  }

  const seconds = Number(item.durationSeconds || item.duration || 0);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function SkeletonCard({ cardWidth }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [shimmer]);

  const backgroundColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.14)"],
  });

  return (
    <View style={[styles.cardShell, { width: cardWidth }]}>
      <View style={styles.card}>
        <Animated.View style={[styles.skeletonTitle, { backgroundColor }]} />
        <Animated.View style={[styles.skeletonOrb, { backgroundColor }]} />
        <Animated.View style={[styles.skeletonWave, { backgroundColor }]} />
      </View>
    </View>
  );
}

function WaveformPreview({ active, color, seed }) {
  const bars = useMemo(() => getWaveformHeights(seed), [seed]);

  return (
    <View style={styles.waveformRow}>
      {bars.map((height, index) => (
        <View
          key={`${seed}-${index}`}
          style={[
            styles.waveformBar,
            {
              height: active ? Math.max(8, height - (index % 3) * 2) : height - 6,
              backgroundColor: color,
              opacity: active ? 1 : 0.45,
            },
          ]}
        />
      ))}
    </View>
  );
}

function SoundOrb({ colors, playing, onPress, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!playing) {
      scale.setValue(1);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.06,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [playing, scale]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: playing ? 1.06 : 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled} style={styles.orbPressable}>
      <Animated.View style={[styles.orbShadow, { transform: [{ scale }] }]}> 
        <LinearGradient colors={colors} style={styles.orbOuter}>
          <LinearGradient
            colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.02)"]}
            style={styles.orbInnerGlow}
          >
            <View style={styles.orbCenter}>
              <Ionicons
                name={playing ? "pause" : "play"}
                size={18}
                color="#0A0B13"
                style={styles.orbIcon}
              />
            </View>
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export default function MusicListScreen({ route }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { width } = useWindowDimensions();
  const routeParams = route?.params || {};
  const requestedType = useMemo(() => {
    const routeType = String(routeParams.type || "").trim();
    return routeType || "sound";
  }, [routeParams.type]);
  const requestedCategory = useMemo(
    () => String(routeParams.category || "").trim(),
    [routeParams.category],
  );
  const isBackgroundMusic = requestedType.toLowerCase() === "background music";
  const cardWidth = useMemo(() => {
    const availableWidth = width - HORIZONTAL_PADDING * 2 - GRID_GAP * 2;
    return Math.floor(availableWidth / 3);
  }, [width]);

  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(requestedCategory || "");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [loadingSound, setLoadingSound] = useState(false);

  useEffect(() => {
    setSelectedCategory(requestedCategory || "");
  }, [requestedCategory]);

  const categoryOptions = useMemo(() => {
    const fromList = Array.from(
      new Set(
        list
          .map((item) => String(item.category || "").trim())
          .filter(Boolean),
      ),
    );

    const suggested = [
      requestedCategory,
      "General",
      "Vlog Music",
      "Cinematic",
      "Travel",
      "Gaming",
    ].filter(Boolean);

    const options = Array.from(new Set([...suggested, ...fromList]));
    return ["All", ...options];
  }, [list, requestedCategory]);

  const soundRef = useRef(null);
  const interstitialRef = useRef(null);
  const lastAdTimeRef = useRef(0);
  const totalPlaysRef = useRef(0);

  useEffect(() => {
    if (!mobileAds || isExpoGo) {
      return;
    }
    mobileAds().initialize();
  }, []);

  const loadInterstitial = useCallback(() => {
    if (!InterstitialAd || isExpoGo || !AdEventType) {
      return;
    }

    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });

    ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialRef.current = ad;
    });

    ad.load();
  }, []);

  useEffect(() => {
    loadInterstitial();
  }, [loadInterstitial]);

  const maybeShowAd = useCallback(() => {
    const now = Date.now();
    totalPlaysRef.current += 1;

    if (
      totalPlaysRef.current % AD_PLAY_INTERVAL === 0 &&
      now - lastAdTimeRef.current > AD_TIME_COOLDOWN &&
      interstitialRef.current
    ) {
      interstitialRef.current.show();
      interstitialRef.current = null;
      lastAdTimeRef.current = now;
      loadInterstitial();
    }
  }, [loadInterstitial]);

  const stopSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setCurrentId(null);
    setPlaying(false);
  }, []);

  const playPause = useCallback(
    async (item) => {
      if (loadingSound) {
        return;
      }

      setLoadingSound(true);
      try {
        if (currentId === item.id && soundRef.current) {
          if (playing) {
            await soundRef.current.pauseAsync();
            setPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setPlaying(true);
          }
          return;
        }

        await stopSound();
        const { sound } = await Audio.Sound.createAsync(
          { uri: item.uri },
          { shouldPlay: true },
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            stopSound();
          }
        });

        soundRef.current = sound;
        setCurrentId(item.id);
        setPlaying(true);
        maybeShowAd();
      } finally {
        setLoadingSound(false);
      }
    },
    [currentId, loadingSound, maybeShowAd, playing, stopSound],
  );

  useFocusEffect(useCallback(() => () => stopSound(), [stopSound]));

  const loadPage = useCallback(
    async ({ pageToLoad, replace }) => {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingPage(true);
      }

      try {
        const result = await apiService.fetchFormattedAudioPaged({
          page: pageToLoad,
          limit: PAGE_SIZE,
          query: search,
          type: requestedType,
          category: selectedCategory,
        });

        setList((previousList) =>
          replace ? result.data : [...previousList, ...result.data],
        );
        setHasMore(result.meta?.hasMore ?? result.data.length === PAGE_SIZE);
        setPage(pageToLoad);
      } finally {
        setLoading(false);
        setLoadingPage(false);
      }
    },
    [requestedType, search, selectedCategory],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPage({ pageToLoad: 1, replace: true });
    }, 220);

    return () => clearTimeout(timer);
  }, [loadPage, search]);

  const renderItem = ({ item, index }) => {
    const colorPair = getColorPair(item.id, index);
    const active = currentId === item.id;
    const favorite = isFavorite(item.id);
    const waveformColor = active ? colorPair[0] : "#7C86A8";
    const seed = String(item.id || item.title || index)
      .split("")
      .reduce((sum, character) => sum + character.charCodeAt(0), 0);

    const onShare = async () => {
      try {
        const message = item.uri
          ? `Listen to "${item.title || "Sound"}"\n${item.uri}`
          : `Listen to "${item.title || "Sound"}"`;
        await Share.share({ message });
      } catch {}
    };

    return (
      <View style={[styles.cardShell, { width: cardWidth }]}>
        <LinearGradient
          colors={
            active
              ? ["rgba(29,35,51,0.98)", "rgba(16,18,28,0.98)"]
              : ["rgba(19,22,34,0.95)", "rgba(12,14,23,0.95)"]
          }
          style={[styles.card, active && styles.cardActive]}
        >
          <View style={styles.cardTopRow}>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {item.title || "Untitled"}
            </Text>

            <View style={styles.cardActionRow}>
              <Pressable onPress={onShare} hitSlop={8} style={styles.shareButton}>
                <Ionicons name="share-social-outline" size={13} color="#AFC0F0" />
              </Pressable>

              <Pressable
                onPress={() => toggleFavorite(item)}
                hitSlop={8}
                style={[styles.favoriteButton, favorite && styles.favoriteButtonActive]}
              >
                <Ionicons
                  name={favorite ? "heart" : "heart-outline"}
                  size={14}
                  color={favorite ? "#FF719A" : "#BAC4E2"}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.cardCenter}>
            <SoundOrb
              colors={colorPair}
              playing={active && playing}
              disabled={loadingSound}
              onPress={() => playPause(item)}
            />
          </View>

          <WaveformPreview active={active && playing} color={waveformColor} seed={seed} />

          <View style={styles.cardFooter}>
            <Text style={styles.durationLabel}>{formatDurationLabel(item)}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#080A12", "#0E1020", "#15172B"]} style={styles.screen}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.heroGlow} />

        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Choose Your Favorite Sound</Text>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#98A2C3" />
          <TextInput
            placeholder={isBackgroundMusic ? "Search background sounds" : "Search sound pads"}
            placeholderTextColor="#7C86A8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          <Pressable
            onPress={() => setShowFilters((prev) => !prev)}
            style={[
              styles.filterButton,
              (showFilters || selectedCategory) && styles.filterButtonActive,
            ]}
          >
            <Ionicons
              name="options-outline"
              size={16}
              color={showFilters || selectedCategory ? "#FFFFFF" : "#9FB0D8"}
            />
          </Pressable>
        </View>

        {showFilters ? (
          <View style={styles.filterPanel}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              {categoryOptions.map((category) => {
                const value = category === "All" ? "" : category;
                const active = selectedCategory === value;
                return (
                  <Pressable
                    key={category}
                    onPress={() => setSelectedCategory(value)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {loading ? (
          <FlatList
            data={Array.from({ length: 12 })}
            renderItem={() => <SkeletonCard cardWidth={cardWidth} />}
            keyExtractor={(_, index) => `skeleton-${index}`}
            numColumns={3}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
          />
        ) : (
          <FlatList
            data={list}
            renderItem={renderItem}
            keyExtractor={(item, index) => String(item.id || index)}
            numColumns={3}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (!loadingPage && hasMore) {
                loadPage({ pageToLoad: page + 1, replace: false });
              }
            }}
            onEndReachedThreshold={0.45}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="disc-outline" size={28} color="#7C86A8" />
                <Text style={styles.emptyTitle}>No sounds found</Text>
                <Text style={styles.emptySubtitle}>Try another search or category.</Text>
              </View>
            }
            ListFooterComponent={
              loadingPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#FF4DAD" />
                </View>
              ) : (
                <View style={styles.footerSpacer} />
              )
            }
          />
        )}

        {!isExpoGo && BannerAd && BannerAdSize ? (
          <View style={styles.bannerWrap}>
            <BannerAd unitId={AD_UNIT_IDS.BANNER} size={BannerAdSize.BANNER} />
          </View>
        ) : null}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  heroGlow: {
    position: "absolute",
    top: -120,
    left: -30,
    right: -30,
    height: 240,
    borderRadius: 220,
    backgroundColor: "rgba(255,61,120,0.14)",
  },
  headerRow: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  headerTitle: {
    color: "#F8FAFF",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
  },
  searchWrap: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: "#F8FAFF",
    marginLeft: 8,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterButtonActive: {
    backgroundColor: "rgba(124,131,255,0.4)",
    borderColor: "rgba(124,131,255,0.75)",
  },
  filterPanel: {
    marginTop: -4,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterChipActive: {
    backgroundColor: "rgba(124,131,255,0.35)",
    borderColor: "rgba(124,131,255,0.85)",
  },
  filterChipText: {
    color: "#C8D1ED",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  gridContent: {
    paddingBottom: 92,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: GRID_GAP,
  },

  cardShell: {
    borderRadius: 24,
  },
  card: {
    minHeight: 176,
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    shadowColor: "#000",
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  cardActive: {
    borderColor: "rgba(255,77,173,0.48)",
    shadowColor: "#FF4DAD",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 34,
  },
  cardTitle: {
    flex: 1,
    color: "#F4F7FF",
    fontSize: 11,
    fontWeight: "700",
    paddingRight: 6,
  },
  favoriteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  favoriteButtonActive: {
    backgroundColor: "rgba(255,113,154,0.14)",
  },
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shareButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(172,196,255,0.12)",
  },
  cardCenter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  orbPressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  orbShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  orbOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 4,
  },
  orbInnerGlow: {
    flex: 1,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  orbCenter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  orbIcon: {
    marginLeft: 2,
  },
  waveformRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 30,
    marginHorizontal: 4,
  },
  waveformBar: {
    width: 4,
    borderRadius: 999,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 12,
  },
  durationLabel: {
    color: "#F3F4FF",
    fontSize: 10,
    fontWeight: "700",
  },
  skeletonTitle: {
    width: "72%",
    height: 12,
    borderRadius: 8,
    marginBottom: 18,
  },
  skeletonOrb: {
    alignSelf: "center",
    width: 66,
    height: 66,
    borderRadius: 33,
    marginBottom: 18,
  },
  skeletonWave: {
    height: 20,
    borderRadius: 10,
    marginHorizontal: 6,
  },
  emptyState: {
    marginTop: 64,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#F8FAFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  emptySubtitle: {
    color: "#7C86A8",
    fontSize: 13,
    marginTop: 4,
  },
  footerLoader: {
    paddingVertical: 18,
  },
  footerSpacer: {
    height: 20,
  },
  bannerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.25)",
  },
});
