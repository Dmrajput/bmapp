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

/* ---------------- ADMOB CONFIGURATION ---------------- */
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
  } catch (e) {
    console.log("⚠️ AdMob not available");
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
};

/* ---------------- SOUND WAVE BUTTON ---------------- */
function PlayWaveButton({ playing, onPress, disabled }) {
  const bar1 = useRef(new Animated.Value(6)).current;
  const bar2 = useRef(new Animated.Value(10)).current;
  const bar3 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    let loop;
    if (playing) {
      loop = Animated.loop(
        Animated.stagger(120, [
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
  }, [playing]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.playBtn,
        playing && styles.playBtnActive,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      {playing ? (
        <View style={styles.waveContainer}>
          <Animated.View style={[styles.waveBar, { height: bar1 }]} />
          <Animated.View style={[styles.waveBar, { height: bar2 }]} />
          <Animated.View style={[styles.waveBar, { height: bar3 }]} />
        </View>
      ) : (
        <Ionicons name="play" size={20} color="#fff" />
      )}
    </Pressable>
  );
}

/* ---------------- ACTION BUTTON ---------------- */
function ActionButton({ icon, liked, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconBtn,
        liked && styles.iconBtnLiked,
        pressed && styles.btnPressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={liked ? "#EF4444" : "#475569"} />
    </Pressable>
  );
}

export default function MemeSoundsScreen() {
  const { toggleFavorite, isFavorite } = useFavorites();

  const [soundList, setSoundList] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);

  const soundRef = useRef(null);
  const interstitialAdRef = useRef(null);
  const playCountRef = useRef(0);

  /* ---------------- ADMOB INIT ---------------- */
  useEffect(() => {
    if (!mobileAds || isExpoGo) return;

    mobileAds()
      .initialize()
      .then(() => console.log("✅ AdMob initialized"))
      .catch(() => {});
  }, []);

  /* ---------------- INTERSTITIAL SETUP ---------------- */
  useEffect(() => {
    if (!InterstitialAd || isExpoGo || !AdEventType) return;

    const ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: true,
    });

    ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialAdRef.current = ad;
    });

    ad.load();
  }, []);

  const showInterstitialAd = useCallback(() => {
    if (!interstitialAdRef.current || isExpoGo) return;

    playCountRef.current += 1;

    if (playCountRef.current % 10 === 0) {
      try {
        interstitialAdRef.current.show();
        interstitialAdRef.current = null;
      } catch {}
    }
  }, []);

  /* ---------------- FILTER ---------------- */
  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return soundList;
    return soundList.filter(
      (i) =>
        i.title?.toLowerCase().includes(q) ||
        i.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [soundList, searchQuery]);

  /* ---------------- SHARE ---------------- */
  const useSound = async (item) => {
    try {
      await Share.share({ message: item.uri });
    } catch {
      Alert.alert("Unable to share");
    }
  };

  /* ---------------- STOP AUDIO ---------------- */
  const stopSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setCurrentTrackId(null);
    setIsPlaying(false);
  }, []);

  /* ---------------- PLAY / PAUSE ---------------- */
  const playPause = useCallback(
    async (item) => {
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

        showInterstitialAd();
      } finally {
        setIsLoadingSound(false);
      }
    },
    [currentTrackId, isPlaying, isLoadingSound, stopSound, showInterstitialAd],
  );

  /* ---------------- FETCH ---------------- */
  useFocusEffect(
    useCallback(() => {
      let active = true;
      apiService.fetchFormattedAudio().then((data) => {
        if (active) {
          setSoundList(data);
          setIsLoadingData(false);
        }
      });
      return () => {
        active = false;
        stopSound();
      };
    }, [stopSound]),
  );

  /* ---------------- RENDER ITEM ---------------- */
  const renderItem = ({ item }) => {
    const active = currentTrackId === item.id;
    const playing = active && isPlaying;
    const liked = isFavorite(item.id);

    return (
      <View style={[styles.card, active && styles.cardActive]}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <PlayWaveButton
          playing={playing}
          disabled={isLoadingSound}
          onPress={() => playPause(item)}
        />

        <View style={styles.actions}>
          <ActionButton
            icon="share-social-outline"
            onPress={() => useSound(item)}
          />
          <ActionButton
            icon={liked ? "heart" : "heart-outline"}
            liked={liked}
            onPress={() => toggleFavorite(item)}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>🎧 Meme Sounds</Text>
      <Text style={styles.subHeader}>Tap. Listen. Laugh.</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748B" />
        <TextInput
          placeholder="Search funny sounds…"
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {isLoadingData ? (
        <ActivityIndicator size="large" color="#6366F1" />
      ) : (
        <FlatList
          data={filteredList}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        />
      )}

      {/* BOTTOM BANNER AD */}
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

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  header: { fontSize: 26, fontWeight: "800", padding: 16 },
  subHeader: { fontSize: 13, color: "#64748B", paddingHorizontal: 16 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    height: 46,
  },
  searchInput: { flex: 1, marginLeft: 10 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 22,
    margin: 8,
    alignItems: "center",
  },
  cardActive: { backgroundColor: "#EEF2FF" },
  title: { fontWeight: "700", marginBottom: 10 },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#174072",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  playBtnActive: { backgroundColor: "#6366F1" },
  waveContainer: { flexDirection: "row", gap: 4 },
  waveBar: { width: 4, backgroundColor: "#fff", borderRadius: 2 },
  actions: { flexDirection: "row", gap: 18 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnLiked: { backgroundColor: "#FEE2E2" },
  btnPressed: { transform: [{ scale: 0.92 }], opacity: 0.8 },
});
