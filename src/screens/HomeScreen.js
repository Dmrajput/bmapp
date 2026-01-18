import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* =======================
   CATEGORY SECTIONS
======================= */

const CATEGORY_SECTIONS = [
  {
    title: "Mood & Feelings",
    data: [
      {
        id: "funny_comedy",
        name: "😂 Funny / Comedy",
        colors: ["#FDE68A", "#F59E0B"],
      },
      {
        id: "sad_emotional",
        name: "😢 Sad / Emotional",
        colors: ["#93C5FD", "#3B82F6"],
      },
      {
        id: "romantic_love",
        name: "❤️ Romantic / Love",
        colors: ["#F9A8D4", "#EC4899"],
      },
      {
        id: "happy_feel_good",
        name: "😊 Happy / Feel Good",
        colors: ["#BBF7D0", "#22C55E"],
      },
      {
        id: "motivational_inspiring",
        name: "🔥 Motivational / Inspiring",
        colors: ["#FED7AA", "#F97316"],
      },
      {
        id: "suspense_tension",
        name: "😱 Suspense / Tension",
        colors: ["#C4B5FD", "#7C3AED"],
      },
      {
        id: "cool_chill",
        name: "😎 Cool / Chill",
        colors: ["#A5F3FC", "#06B6D4"],
      },
      {
        id: "cute_aesthetic",
        name: "😍 Cute / Aesthetic",
        colors: ["#FBCFE8", "#F472B6"],
      },
      {
        id: "angry_intense",
        name: "😡 Angry / Intense",
        colors: ["#FCA5A5", "#EF4444"],
      },
      {
        id: "calm_peaceful",
        name: "😴 Calm / Peaceful",
        colors: ["#DDD6FE", "#8B5CF6"],
      },
    ],
  },
  {
    title: "Content Type",
    data: [
      {
        id: "vlog_music",
        name: "🎥 Vlog Music",
        colors: ["#BAE6FD", "#0284C7"],
      },
      { id: "cinematic", name: "🎞️ Cinematic", colors: ["#E5E7EB", "#6B7280"] },
      { id: "travel", name: "✈️ Travel", colors: ["#99F6E4", "#14B8A6"] },
      {
        id: "food_cooking",
        name: "🍔 Food / Cooking",
        colors: ["#FED7AA", "#FB923C"],
      },
      {
        id: "storytelling",
        name: "📖 Storytelling",
        colors: ["#DDD6FE", "#6366F1"],
      },
      {
        id: "fitness_workout",
        name: "🏋️ Fitness / Workout",
        colors: ["#FCA5A5", "#DC2626"],
      },
      {
        id: "business_startup",
        name: "💼 Business / Startup",
        colors: ["#E5E7EB", "#374151"],
      },
      { id: "gaming", name: "🎮 Gaming", colors: ["#A7F3D0", "#10B981"] },
      {
        id: "kids_content",
        name: "👶 Kids Content",
        colors: ["#FDE68A", "#FACC15"],
      },
      {
        id: "short_film_skit",
        name: "🎭 Short Film / Skit",
        colors: ["#C7D2FE", "#4F46E5"],
      },
    ],
  },
  {
    title: "Music Style / Genre",
    data: [
      { id: "piano", name: "🎹 Piano", colors: ["#E5E7EB", "#9CA3AF"] },
      {
        id: "acoustic_guitar",
        name: "🎸 Acoustic / Guitar",
        colors: ["#FED7AA", "#EA580C"],
      },
      { id: "lofi", name: "🎧 Lo-Fi", colors: ["#A5B4FC", "#6366F1"] },
      {
        id: "hiphop_rap_beat",
        name: "🥁 Hip-Hop / Rap Beat",
        colors: ["#FCA5A5", "#B91C1C"],
      },
      {
        id: "orchestral",
        name: "🎼 Orchestral",
        colors: ["#DDD6FE", "#7C3AED"],
      },
      { id: "jazz", name: "🎷 Jazz", colors: ["#FBCFE8", "#DB2777"] },
      {
        id: "electronic_edm",
        name: "⚡ Electronic / EDM",
        colors: ["#67E8F9", "#0891B2"],
      },
      {
        id: "indian_desi_beats",
        name: "🎻 Indian / Desi Beats",
        colors: ["#FDE68A", "#CA8A04"],
      },
      { id: "rock", name: "🎸 Rock", colors: ["#D1D5DB", "#111827"] },
      {
        id: "spiritual_devotional",
        name: "🕉️ Spiritual / Devotional",
        colors: ["#FEF3C7", "#D97706"],
      },
    ],
  },
  {
    title: "Trending & Discovery",
    data: [
      {
        id: "trending_now",
        name: "🔥 Trending Now",
        colors: ["#F97316", "#EA580C"],
      },
      {
        id: "viral_reels",
        name: "🚀 Viral Reels",
        colors: ["#22D3EE", "#0EA5E9"],
      },
      { id: "top_rated", name: "⭐ Top Rated", colors: ["#FACC15", "#EAB308"] },
      {
        id: "new_uploads",
        name: "🆕 New Uploads",
        colors: ["#86EFAC", "#22C55E"],
      },
      {
        id: "intro_music",
        name: "🎬 Intro Music",
        colors: ["#C7D2FE", "#6366F1"],
      },
      {
        id: "outro_music",
        name: "🎬 Outro Music",
        colors: ["#DDD6FE", "#8B5CF6"],
      },
    ],
  },
];

/* =======================
   HOME SCREEN
======================= */

export default function HomeScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Music</Text>
        <Text style={styles.headerSubtitle}>
          Find the perfect sound for your video
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search mood, reels, genre..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Category Sections */}
        {CATEGORY_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.gridContainer}>
              {section.data.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  activeOpacity={0.85}
                  style={styles.categoryCard}
                  onPress={() =>
                    router.push({
                      pathname: "/music/[category]",
                      params: { category: category.id },
                    })
                  }
                >
                  <LinearGradient
                    colors={category.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBox}
                  >
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  /* Header */
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#9CA3AF",
  },

  /* Scroll */
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  /* Search */
  searchContainer: {
    marginVertical: 20,
  },
  searchInput: {
    backgroundColor: "#111827",
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 15,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#1F2937",
  },

  /* Section */
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 14,
  },

  /* Grid */
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  /* Cards */
  categoryCard: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0F172A",
  },
  gradientBox: {
    height: 140,
    padding: 14,
    justifyContent: "flex-end",
    borderRadius: 16,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
