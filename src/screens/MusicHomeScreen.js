import { AD_UNIT_IDS } from "@/config/admob.config";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

/* ===================== ADMOB CONFIG ===================== */
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
  } catch (e) {
    console.warn("AdMob not available", e);
  }
}

const ACCENT = "#7C83FF";
const BG = "#080A12";
const CARD = "rgba(20,24,36,0.92)";
const PAGE_SIZE = 20;

/* ---------------- EQUALIZER ---------------- */
function Equalizer({ active }) {
  const bar1 = useRef(new Animated.Value(6)).current;
  const bar2 = useRef(new Animated.Value(10)).current;
  const bar3 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let loop;
    if (active) {
      loop = Animated.loop(
        Animated.stagger(150, [
          Animated.sequence([
            Animated.timing(bar1, {
              toValue: 18,
              duration: 260,
              useNativeDriver: false,
            }),
            Animated.timing(bar1, {
              toValue: 6,
              duration: 260,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(bar2, {
              toValue: 22,
              duration: 260,
              useNativeDriver: false,
            }),
            Animated.timing(bar2, {
              toValue: 10,
              duration: 260,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(bar3, {
              toValue: 16,
              duration: 260,
              useNativeDriver: false,
            }),
            Animated.timing(bar3, {
              toValue: 8,
              duration: 260,
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
  }, [active]);

  return (
    <View style={styles.eqContainer}>
      <Animated.View style={[styles.eqBar, { height: bar1 }]} />
      <Animated.View style={[styles.eqBar, { height: bar2 }]} />
      <Animated.View style={[styles.eqBar, { height: bar3 }]} />
    </View>
  );
}

/* ===================== SCREEN ===================== */
export default function MusicListScreen() {
  const [musicList, setMusicList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [currentTrackTitle, setCurrentTrackTitle] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);

  const soundRef = useRef(null);
  const interstitialRef = useRef(null);
  const playCountRef = useRef(0);

  /* -------- ADMOB INIT -------- */
  useEffect(() => {
    if (!mobileAds || isExpoGo) return;
    mobileAds().initialize();
  }, []);

  /* -------- LOAD INTERSTITIAL -------- */
  const loadInterstitial = useCallback(() => {
    if (!InterstitialAd || isExpoGo || !AdEventType) return;

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

  const showInterstitial = useCallback(() => {
    if (!interstitialRef.current || isExpoGo) return;

    playCountRef.current += 1;

    if (playCountRef.current % 10 === 0) {
      interstitialRef.current.show();
      interstitialRef.current = null;
      loadInterstitial(); // reload next ad
    }
  }, [loadInterstitial]);

  /* -------- AUDIO -------- */
  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTrackId(null);
  }, []);

  useFocusEffect(useCallback(() => () => unloadSound(), [unloadSound]));

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

        soundRef.current = sound;
        setCurrentTrackId(item.id);
        setCurrentTrackTitle(item.title || "");
        setIsPlaying(true);

        showInterstitial();
      } finally {
        setIsLoadingSound(false);
      }
    },
    [currentTrackId, isPlaying, unloadSound, showInterstitial],
  );

  const shareTrack = useCallback(async (item) => {
    try {
      const message = item.uri
        ? `Listen to "${item.title}"\n${item.uri}`
        : `Listen to "${item.title}"`;
      await Share.share({ message });
    } catch (e) {
      console.warn("Share failed", e);
    }
  }, []);

  const loadPage = useCallback(async ({ pageToLoad, query, replace }) => {
    replace ? setIsLoading(true) : setIsLoadingPage(true);
    try {
      const result = await apiService.fetchFormattedAudioPaged({
        page: pageToLoad,
        limit: PAGE_SIZE,
        query: query?.trim() || "",
        type: "music",
      });

      setMusicList((prev) =>
        replace ? result.data : [...prev, ...result.data],
      );
      setHasMore(
        typeof result.meta?.hasMore === "boolean"
          ? result.meta.hasMore
          : result.data.length === PAGE_SIZE,
      );
      setPage(pageToLoad);
    } finally {
      setIsLoading(false);
      setIsLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPage({ pageToLoad: 1, query: searchQuery, replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadPage]);

  const renderItem = ({ item }) => {
    const active = currentTrackId === item.id;
    return (
      <View style={[styles.card, active && styles.cardActive]}>
        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          {active && isPlaying && <Equalizer active />}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => shareTrack(item)} style={styles.shareBtn}>
            <Ionicons name="share-social" size={18} color="#0F172A" />
          </Pressable>
          <Pressable
            onPress={() => playPause(item)}
            style={[styles.playBtn, active && styles.playBtnActive]}
          >
            <Ionicons
              name={active && isPlaying ? "pause" : "play"}
              size={18}
              color="#fff"
            />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#080A12", "#0E1222", "#15192C"]} style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <View style={styles.heroGlow} />

        <Text style={styles.headerTitle}>Music</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search music..."
          placeholderTextColor="#7C86A8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {isLoading ? (
          <ActivityIndicator size="large" color={ACCENT} style={styles.mainLoader} />
        ) : (
          <FlatList
            data={musicList}
            renderItem={renderItem}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.listContent}
            onEndReached={() =>
              !isLoadingPage &&
              hasMore &&
              loadPage({
                pageToLoad: page + 1,
                query: searchQuery,
                replace: false,
              })
            }
            onEndReachedThreshold={0.6}
            ListFooterComponent={
              isLoadingPage ? (
                <ActivityIndicator size="small" color={ACCENT} />
              ) : null
            }
          />
        )}

        {/* -------- BANNER AD -------- */}
        {BannerAd && BannerAdSize && !isExpoGo && (
          <View style={styles.bannerWrap}>
            <BannerAd
              unitId={AD_UNIT_IDS.BANNER}
              size={BannerAdSize.BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1, backgroundColor: "transparent" },
  heroGlow: {
    position: "absolute",
    top: -120,
    left: -20,
    right: -20,
    height: 240,
    borderRadius: 220,
    backgroundColor: "rgba(255,77,173,0.14)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    color: "#F4F7FF",
  },
  searchInput: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 14,
    color: "#F4F7FF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  listContent: { paddingBottom: 138, paddingTop: 8 },
  mainLoader: { marginTop: 24 },
  card: {
    backgroundColor: CARD,
    margin: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  cardActive: { borderColor: ACCENT, borderWidth: 2 },
  title: { fontWeight: "700", color: "#F3F4FF" },
  actions: { flexDirection: "row", gap: 10 },
  shareBtn: {
    backgroundColor: "rgba(172,196,255,0.18)",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    backgroundColor: "#111827",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnActive: { backgroundColor: ACCENT },
  eqContainer: { flexDirection: "row", gap: 3 },
  eqBar: { width: 3, backgroundColor: ACCENT, borderRadius: 2 },
  bannerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(148,163,184,0.25)",
  },
});
