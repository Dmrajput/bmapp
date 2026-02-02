import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* =======================
   DASHBOARD SCREEN
======================= */

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎧 ReelSound</Text>
        <Text style={styles.headerSubtitle}>
          Music & sounds for Reels, Shorts & Videos
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PRIMARY ACTIONS */}
        <View style={styles.primaryGrid}>
          <DashboardCard
            title="🔊 Sounds"
            subtitle="Meme & effects"
            colors={["#22C55E", "#16A34A"]}
            onPress={() => router.push("/music-list")}
          />

          <DashboardCard
            title="🎬 Background Music"
            subtitle="For videos"
            colors={["#F97316", "#EA580C"]}
            onPress={() => router.push("/songs")}
          />
          <DashboardCard
            title="🎵 Music"
            subtitle="Songs & tracks"
            colors={["#6366F1", "#4F46E5"]}
            onPress={() => router.push("/music")}
          />
        </View>

        {/* TRENDING SECTION */}
        <Section title="🔥 Trending Now">
          <HorizontalCard
            title="Viral Reels Music"
            onPress={() =>
              router.push({ pathname: "/music", params: { tag: "viral" } })
            }
          />
          <HorizontalCard
            title="Top Meme Sounds"
            onPress={() => router.push("/songs")}
          />
        </Section>

        {/* USE CASES */}
        <Section title="🎥 Use Cases">
          <View style={styles.useCaseGrid}>
            <MiniCard
              title="Reels & Shorts"
              onPress={() =>
                router.push({ pathname: "/music", params: { tag: "reels" } })
              }
            />
            <MiniCard
              title="Vlogs"
              onPress={() =>
                router.push({
                  pathname: "/meme-sound",
                  params: { tag: "vlog" },
                })
              }
            />
            <MiniCard title="Gaming" onPress={() => router.push("/songs")} />
            <MiniCard title="Comedy" onPress={() => router.push("/songs")} />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =======================
   COMPONENTS
======================= */

function DashboardCard({ title, subtitle, colors, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.bigCard}
      onPress={onPress}
    >
      <LinearGradient colors={colors} style={styles.bigCardGradient}>
        <Text style={styles.bigCardTitle}>{title}</Text>
        <Text style={styles.bigCardSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function HorizontalCard({ title, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.horizontalCard}
    >
      <Text style={styles.horizontalText}>{title}</Text>
    </TouchableOpacity>
  );
}

function MiniCard({ title, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.miniCard}
      onPress={onPress}
    >
      <Text style={styles.miniText}>{title}</Text>
    </TouchableOpacity>
  );
}

/* =======================
   STYLES
======================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  /* PRIMARY GRID */
  primaryGrid: {
    marginTop: 10,
    gap: 16,
  },

  bigCard: {
    borderRadius: 22,
    overflow: "hidden",
    elevation: 4,
  },
  bigCardGradient: {
    padding: 22,
    height: 110,
    justifyContent: "space-between",
    borderRadius: 22,
  },
  bigCardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bigCardSubtitle: {
    fontSize: 14,
    color: "#E5E7EB",
  },

  /* SECTIONS */
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#111827",
  },

  /* HORIZONTAL */
  horizontalCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  horizontalText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  /* MINI GRID */
  useCaseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  miniCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  miniText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
});
