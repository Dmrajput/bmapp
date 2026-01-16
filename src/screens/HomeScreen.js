import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

/* =======================
   CATEGORY SECTIONS
======================= */

const CATEGORY_SECTIONS = [
  {
    title: 'Mood & Feelings',
    data: [
      { name: '😂 Funny / Comedy', colors: ['#FDE68A', '#F59E0B'] },
      { name: '😢 Sad / Emotional', colors: ['#93C5FD', '#3B82F6'] },
      { name: '❤️ Romantic / Love', colors: ['#F9A8D4', '#EC4899'] },
      { name: '😊 Happy / Feel Good', colors: ['#BBF7D0', '#22C55E'] },
      { name: '🔥 Motivational / Inspiring', colors: ['#FED7AA', '#F97316'] },
      { name: '😱 Suspense / Tension', colors: ['#C4B5FD', '#7C3AED'] },
      { name: '😎 Cool / Chill', colors: ['#A5F3FC', '#06B6D4'] },
      { name: '😍 Cute / Aesthetic', colors: ['#FBCFE8', '#F472B6'] },
      { name: '😡 Angry / Intense', colors: ['#FCA5A5', '#EF4444'] },
      { name: '😴 Calm / Peaceful', colors: ['#DDD6FE', '#8B5CF6'] },
    ],
  },
  {
    title: 'Content Type',
    data: [
      { name: '🎥 Vlog Music', colors: ['#BAE6FD', '#0284C7'] },
      { name: '🎞️ Cinematic', colors: ['#E5E7EB', '#6B7280'] },
      { name: '✈️ Travel', colors: ['#99F6E4', '#14B8A6'] },
      { name: '🍔 Food / Cooking', colors: ['#FED7AA', '#FB923C'] },
      { name: '📖 Storytelling', colors: ['#DDD6FE', '#6366F1'] },
      { name: '🏋️ Fitness / Workout', colors: ['#FCA5A5', '#DC2626'] },
      { name: '💼 Business / Startup', colors: ['#E5E7EB', '#374151'] },
      { name: '🎮 Gaming', colors: ['#A7F3D0', '#10B981'] },
      { name: '👶 Kids Content', colors: ['#FDE68A', '#FACC15'] },
      { name: '🎭 Short Film / Skit', colors: ['#C7D2FE', '#4F46E5'] },
    ],
  },
  {
    title: 'Music Style / Genre',
    data: [
      { name: '🎹 Piano', colors: ['#E5E7EB', '#9CA3AF'] },
      { name: '🎸 Acoustic / Guitar', colors: ['#FED7AA', '#EA580C'] },
      { name: '🎧 Lo-Fi', colors: ['#A5B4FC', '#6366F1'] },
      { name: '🥁 Hip-Hop / Rap Beat', colors: ['#FCA5A5', '#B91C1C'] },
      { name: '🎼 Orchestral', colors: ['#DDD6FE', '#7C3AED'] },
      { name: '🎷 Jazz', colors: ['#FBCFE8', '#DB2777'] },
      { name: '⚡ Electronic / EDM', colors: ['#67E8F9', '#0891B2'] },
      { name: '🎻 Indian / Desi Beats', colors: ['#FDE68A', '#CA8A04'] },
      { name: '🎸 Rock', colors: ['#D1D5DB', '#111827'] },
      { name: '🕉️ Spiritual / Devotional', colors: ['#FEF3C7', '#D97706'] },
    ],
  },
  {
    title: 'Trending & Discovery',
    data: [
      { name: '🔥 Trending Now', colors: ['#F97316', '#EA580C'] },
      { name: '🚀 Viral Reels', colors: ['#22D3EE', '#0EA5E9'] },
      { name: '⭐ Top Rated', colors: ['#FACC15', '#EAB308'] },
      { name: '🆕 New Uploads', colors: ['#86EFAC', '#22C55E'] },
      { name: '🎬 Intro Music', colors: ['#C7D2FE', '#6366F1'] },
      { name: '🎬 Outro Music', colors: ['#DDD6FE', '#8B5CF6'] },
    ],
  },
];

/* =======================
   HOME SCREEN
======================= */

export default function HomeScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Music</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search mood, reel type, music…"
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
                  key={category.name}
                  style={styles.categoryCard}
                  onPress={() =>
                    router.push({ pathname: '/music/[category]', params: { category: category.name } })
                  }
                >
                  <LinearGradient
                    colors={category.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBox}
                  >
                    <Text style={styles.categoryName}>
                      {category.name}
                    </Text>
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

/* =======================
   STYLES
======================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: '#111827',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#1F2933',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBox: {
    height: 130,
    padding: 12,
    justifyContent: 'flex-end',
    borderRadius: 14,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
