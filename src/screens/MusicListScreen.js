import { AD_UNIT_IDS } from "@/config/admob.config";
import { useFavorites } from "@/context/favorites-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import Constants from "expo-constants";
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

const PAGE_SIZE = 20;

/* ================= ADMOB CONFIG ================= */
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

/* ---------------- WAVE BUTTON ---------------- */
function PlayWaveButton({ playing, onPress, disabled }) {
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
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.waveBtn,
        playing && styles.waveBtnActive,
        pressed && styles.btnPressed,
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
        pressed && styles.btnPressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
    </Pressable>
  );
}

export default function MemeSoundsScreen() {
  const { toggleFavorite, isFavorite } = useFavorites();

  const [soundList, setSoundList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [type, setType] = useState("sound"); // 👈 type filter
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);

  const [currentTrackId, setCurrentTrackId] = useState(null);
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

  const loadInterstitial = useCallback(() => {
    if (!InterstitialAd || isExpoGo) return;
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL);
    ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialRef.current = ad;
    });
    ad.load();
  }, []);

  useEffect(() => loadInterstitial(), [loadInterstitial]);

  const showInterstitial = () => {
    playCountRef.current += 1;
    if (playCountRef.current % 10 === 0 && interstitialRef.current) {
      interstitialRef.current.show();
      interstitialRef.current = null;
      loadInterstitial();
    }
  };

  /* -------- FETCH PAGE -------- */
  const loadPage = useCallback(
    async ({ pageToLoad, replace }) => {
      replace ? setLoading(true) : setLoadingPage(true);

      try {
        const res = await apiService.fetchFormattedAudioPaged({
          page: pageToLoad,
          limit: PAGE_SIZE,
          query: searchQuery,
          type,
        });

        setSoundList((prev) => (replace ? res.data : [...prev, ...res.data]));
        setHasMore(res.meta?.hasMore ?? res.data.length === PAGE_SIZE);
        setPage(pageToLoad);
      } finally {
        setLoading(false);
        setLoadingPage(false);
      }
    },
    [searchQuery, type],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      loadPage({ pageToLoad: 1, replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, type, loadPage]);

  /* -------- AUDIO -------- */
  const stopSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setCurrentTrackId(null);
    setIsPlaying(false);
  }, []);

  const playPause = async (item) => {
    if (isLoadingSound) return;
    setIsLoadingSound(true);

    try {
      if (currentTrackId === item.id && soundRef.current) {
        isPlaying
          ? await soundRef.current.pauseAsync()
          : await soundRef.current.playAsync();
        setIsPlaying(!isPlaying);
        return;
      }

      await stopSound();
      const { sound } = await Audio.Sound.createAsync(
        { uri: item.uri },
        { shouldPlay: true },
      );

      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.didJustFinish) stopSound();
      });

      soundRef.current = sound;
      setCurrentTrackId(item.id);
      setIsPlaying(true);
      showInterstitial();
    } finally {
      setIsLoadingSound(false);
    }
  };

  useFocusEffect(useCallback(() => () => stopSound(), [stopSound]));

  /* -------- RENDER ITEM -------- */
  const renderItem = ({ item }) => {
    const active = currentTrackId === item.id;
    const fav = isFavorite(item.id);

    return (
      <View style={[styles.card, active && styles.cardActive]}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.duration}>{item.duration || 5}s</Text>

        <View style={styles.actions}>
          <PlayWaveButton
            playing={active && isPlaying}
            disabled={isLoadingSound}
            onPress={() => playPause(item)}
          />

          <ActionButton
            icon="share-social-outline"
            color="#6366F1"
            bg="#EEF2FF"
            onPress={() => Share.share({ message: item.uri })}
          />

          <ActionButton
            icon={fav ? "heart" : "heart-outline"}
            color={fav ? "#EC4899" : "#6B7280"}
            bg={fav ? "#FCE7F3" : "#F1F5F9"}
            onPress={() => toggleFavorite(item)}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Meme Sounds</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          placeholder="Search sounds..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" />
      ) : (
        <FlatList
          data={soundList}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
          onEndReached={() => {
            if (!loadingPage && hasMore) {
              loadPage({ pageToLoad: page + 1, replace: false });
            }
          }}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            loadingPage ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : null
          }
        />
      )}

      {/* -------- BANNER AD -------- */}
      {BannerAd && !isExpoGo && (
        <View style={{ alignItems: "center", paddingBottom: 6 }}>
          <BannerAd unitId={AD_UNIT_IDS.BANNER} size={BannerAdSize.BANNER} />
        </View>
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
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8 },

  card: {
    flex: 1,
    backgroundColor: "#FFF",
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
    alignItems: "center",
    justifyContent: "center",
  },
  waveBtnActive: { backgroundColor: "#6366F1" },

  waveContainer: { flexDirection: "row", gap: 3 },
  waveBar: { width: 4, borderRadius: 2, backgroundColor: "#FFF" },

  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: { transform: [{ scale: 0.92 }], opacity: 0.85 },
});
