import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import Constants from "expo-constants";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
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
let TestIds = null;
let InterstitialAd = null;
let mobileAds = null;
let AdEventType = null;

if (!isExpoGo) {
  try {
    const ads = require("react-native-google-mobile-ads");
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds = ads.TestIds;
    InterstitialAd = ads.InterstitialAd;
    mobileAds = ads.mobileAds;
    AdEventType = ads.AdEventType;
  } catch {}
}

const AD_UNIT_IDS = {
  BANNER:
    __DEV__ && TestIds
      ? TestIds.BANNER
      : "ca-app-pub-2136043836079463/6534214524",
  INTERSTITIAL:
    __DEV__ && TestIds
      ? TestIds.INTERSTITIAL
      : "ca-app-pub-2136043836079463/1855112220",
};
/* ======================================================== */

const ACCENT = "#1DB954";
const BG = "#F5F6F8";
const CARD = "#FFFFFF";
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
  const [playbackDurationMillis, setPlaybackDurationMillis] = useState(0);

  const soundRef = useRef(null);
  const interstitialRef = useRef(null);
  const playCountRef = useRef(0);

  /* -------- ADMOB INIT -------- */
  useEffect(() => {
    if (!mobileAds || isExpoGo) return;
    mobileAds().initialize();
  }, []);

  /* -------- INTERSTITIAL SETUP -------- */
  useEffect(() => {
    if (!InterstitialAd || isExpoGo || !AdEventType) return;

    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });

    ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialRef.current = ad;
    });

    ad.load();
  }, []);

  const showInterstitial = useCallback(() => {
    if (!interstitialRef.current || isExpoGo) return;

    playCountRef.current += 1;

    if (playCountRef.current % 10 === 0) {
      interstitialRef.current.show();
      interstitialRef.current = null;
    }
  }, []);

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

        sound.setOnPlaybackStatusUpdate((s) => {
          if (s.durationMillis) setPlaybackDurationMillis(s.durationMillis);
        });

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
      const title = item.title ? `"${item.title}"` : "this track";
      const url = item.uri;
      const message = url ? `Listen to ${title}\n${url}` : `Listen to ${title}`;

      await Share.share(url ? { message, url } : { message });
    } catch (error) {
      console.warn("Share failed", error);
    }
  }, []);

  const loadPage = useCallback(async ({ pageToLoad, query, replace }) => {
    if (replace) {
      setIsLoading(true);
    } else {
      setIsLoadingPage(true);
    }

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
          : (result.data || []).length === PAGE_SIZE,
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

  /* -------- RENDER -------- */
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
          <Pressable style={styles.shareBtn} onPress={() => shareTrack(item)}>
            <Ionicons name="share-social" size={18} color="#0F172A" />
          </Pressable>
          <Pressable
            style={[styles.playBtn, active && styles.playBtnActive]}
            onPress={() => playPause(item)}
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
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Music</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search music..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color={ACCENT} />
      ) : (
        <FlatList
          data={musicList}
          renderItem={renderItem}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 140 }}
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
              <ActivityIndicator size="small" color={ACCENT} />
            ) : null
          }
        />
      )}

      {/* -------- BANNER AD (POLICY SAFE) -------- */}
      {BannerAd && BannerAdSize && (
        <View style={{ alignItems: "center", paddingBottom: 6 }}>
          <BannerAd
            unitId={AD_UNIT_IDS.BANNER}
            size={BannerAdSize.BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  headerTitle: { fontSize: 28, fontWeight: "800", margin: 16 },
  searchInput: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 14,
  },
  card: {
    backgroundColor: CARD,
    margin: 12,
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardActive: { borderColor: ACCENT, borderWidth: 2 },
  title: { fontWeight: "700" },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  shareBtn: {
    backgroundColor: "#E2E8F0",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    backgroundColor: "#0F172A",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtnActive: { backgroundColor: ACCENT },
  eqContainer: { flexDirection: "row", gap: 3 },
  eqBar: { width: 3, backgroundColor: ACCENT, borderRadius: 2 },
});
