import { AD_UNIT_IDS } from "@/config/admob.config";
import { useFavorites } from "@/context/favorites-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Audio } from "expo-av";
import Constants from "expo-constants";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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

/* ================= CONFIG ================= */
const PAGE_SIZE = 20;
const AD_PLAY_INTERVAL = 7; // every 7 plays
const AD_TIME_COOLDOWN = 90_000; // 90 seconds

/* ================= ADMOB ================= */
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

/* ================= SKELETON ================= */
function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  const bg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E5E7EB", "#F1F5F9"],
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.skelTitle, { backgroundColor: bg }]} />
      <Animated.View style={[styles.skelSub, { backgroundColor: bg }]} />
      <View style={styles.skelActions}>
        <Animated.View style={[styles.skelBtn, { backgroundColor: bg }]} />
        <Animated.View style={[styles.skelBtn, { backgroundColor: bg }]} />
        <Animated.View style={[styles.skelBtn, { backgroundColor: bg }]} />
      </View>
    </View>
  );
}

const EMOJIS = ["😂", "🔥", "💥", "🤣", "😆", "🤯", "😜"];

function EmojiPop({ trigger }) {
  const scale = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const emoji = useMemo(
    () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    [trigger],
  );

  useEffect(() => {
    scale.setValue(0);
    translateY.setValue(0);
    opacity.setValue(1);

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1.4,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -26,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [trigger]);

  return (
    <Animated.Text
      style={[
        styles.emojiPop,
        { opacity, transform: [{ scale }, { translateY }] },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

/* ================= PLAY BUTTON ================= */
function PlayWaveButton({ playing, onPress, disabled }) {
  const [popKey, setPopKey] = useState(0);

  const scale = useRef(new Animated.Value(1)).current;

  const bars = [
    useRef(new Animated.Value(6)).current,
    useRef(new Animated.Value(10)).current,
    useRef(new Animated.Value(8)).current,
  ];

  useEffect(() => {
    let loop;
    if (playing) {
      loop = Animated.loop(
        Animated.stagger(
          150,
          bars.map((bar, i) =>
            Animated.sequence([
              Animated.timing(bar, {
                toValue: 20 - i * 2,
                duration: 280,
                useNativeDriver: false,
              }),
              Animated.timing(bar, {
                toValue: i === 1 ? 10 : 6,
                duration: 280,
                useNativeDriver: false,
              }),
            ]),
          ),
        ),
      );
      loop.start();
    } else {
      bars.forEach((b, i) => b.setValue(i === 1 ? 10 : 6));
    }
    return () => loop?.stop();
  }, [playing]);

  const handlePress = () => {
    setPopKey((k) => k + 1); // 🤪 emoji trigger

    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.85,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    onPress?.();
  };

  return (
    <Pressable disabled={disabled} onPress={handlePress}>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <EmojiPop trigger={popKey} />

        <Animated.View
          style={[
            styles.waveBtn,
            playing && styles.waveBtnActive,
            { transform: [{ scale }] },
          ]}
        >
          {playing ? (
            <View style={styles.waveContainer}>
              {bars.map((b, i) => (
                <Animated.View
                  key={i}
                  style={[styles.waveBar, { height: b }]}
                />
              ))}
            </View>
          ) : (
            <Ionicons name="play" size={18} color="#fff" />
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
}

/* ================= ACTION BUTTON ================= */
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

/* ================= MAIN SCREEN ================= */
export default function MemeSoundsScreen() {
  const { toggleFavorite, isFavorite } = useFavorites();

  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [type] = useState("sound");
  const [sortBy, setSortBy] = useState("latest"); // latest | trending
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);

  const [currentId, setCurrentId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [loadingSound, setLoadingSound] = useState(false);

  const [playCounts, setPlayCounts] = useState({});

  const soundRef = useRef(null);
  const interstitialRef = useRef(null);
  const lastAdTimeRef = useRef(0);
  const totalPlaysRef = useRef(0);

  /* ================= ADMOB INIT ================= */
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

  const maybeShowAd = () => {
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
  };

  /* ================= AUDIO ================= */
  const stopSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setCurrentId(null);
    setPlaying(false);
  }, []);

  const playPause = async (item) => {
    if (loadingSound) return;
    setLoadingSound(true);

    try {
      if (currentId === item.id && soundRef.current) {
        playing
          ? await soundRef.current.pauseAsync()
          : await soundRef.current.playAsync();
        setPlaying(!playing);
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
      setCurrentId(item.id);
      setPlaying(true);

      setPlayCounts((p) => ({
        ...p,
        [item.id]: (p[item.id] || 0) + 1,
      }));

      maybeShowAd();
    } finally {
      setLoadingSound(false);
    }
  };

  useFocusEffect(useCallback(() => () => stopSound(), [stopSound]));

  /* ================= FETCH ================= */
  const loadPage = useCallback(
    async ({ pageToLoad, replace }) => {
      replace ? setLoading(true) : setLoadingPage(true);

      try {
        const res = await apiService.fetchFormattedAudioPaged({
          page: pageToLoad,
          limit: PAGE_SIZE,
          query: search,
          type,
        });

        setList((prev) => (replace ? res.data : [...prev, ...res.data]));
        setHasMore(res.meta?.hasMore ?? res.data.length === PAGE_SIZE);
        setPage(pageToLoad);
      } finally {
        setLoading(false);
        setLoadingPage(false);
      }
    },
    [search, type],
  );

  useEffect(() => {
    const t = setTimeout(() => loadPage({ pageToLoad: 1, replace: true }), 300);
    return () => clearTimeout(t);
  }, [search, loadPage]);

  /* ================= SORT ================= */
  const sortedList = useMemo(() => {
    if (sortBy === "trending") {
      return [...list].sort(
        (a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0),
      );
    }
    return list;
  }, [list, sortBy, playCounts]);

  /* ================= RENDER ITEM ================= */
  const renderItem = ({ item }) => {
    const active = currentId === item.id;
    const fav = isFavorite(item.id);

    return (
      <View style={[styles.card, active && styles.cardActive]}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.meta}>
          {item.duration || 5}s · 🔥 {playCounts[item.id] || 0}
        </Text>

        <View style={styles.actions}>
          <PlayWaveButton
            playing={active && playing}
            disabled={loadingSound}
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

  /* ================= UI ================= */
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Meme Sounds</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          placeholder="Search sounds..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.sortRow}>
        {["latest", "trending"].map((k) => (
          <Pressable
            key={k}
            onPress={() => setSortBy(k)}
            style={[styles.sortChip, sortBy === k && styles.sortChipActive]}
          >
            <Text
              style={[styles.sortText, sortBy === k && styles.sortTextActive]}
            >
              {k === "latest" ? "Latest" : "Trending 🔥"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <FlatList
          data={Array.from({ length: 6 })}
          renderItem={() => <SkeletonCard />}
          numColumns={2}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ padding: 12 }}
        />
      ) : (
        <FlatList
          data={sortedList}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
          onEndReached={() =>
            !loadingPage &&
            hasMore &&
            loadPage({ pageToLoad: page + 1, replace: false })
          }
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            loadingPage ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : null
          }
        />
      )}

      {!isExpoGo && BannerAd && (
        <View style={{ alignItems: "center", paddingBottom: 6 }}>
          <BannerAd unitId={AD_UNIT_IDS.BANNER} size={BannerAdSize.BANNER} />
        </View>
      )}
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { fontSize: 22, fontWeight: "800", padding: 16 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8 },

  sortRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  sortChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  sortChipActive: { backgroundColor: "#6366F1" },
  sortText: { fontSize: 12, color: "#374151" },
  sortTextActive: { color: "#FFF", fontWeight: "700" },

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
  meta: { fontSize: 11, color: "#6B7280", marginTop: 4 },

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

  waveContainer: { flexDirection: "row", gap: 3 },
  waveBar: { width: 4, borderRadius: 2, backgroundColor: "#FFF" },

  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  btnPressed: { transform: [{ scale: 0.92 }], opacity: 0.85 },

  skelTitle: {
    height: 14,
    width: "80%",
    borderRadius: 6,
    marginBottom: 10,
  },
  skelSub: {
    height: 10,
    width: "40%",
    borderRadius: 6,
  },
  skelActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  skelBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
  },
  emojiPop: {
    position: "absolute",
    top: -16,
    fontSize: 22,
    zIndex: 10,
  },
});
