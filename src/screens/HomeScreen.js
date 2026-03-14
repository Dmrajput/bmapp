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
    <LinearGradient
      colors={["#080A12", "#0F1322", "#181C2E"]}
      style={styles.screen}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.heroGlow} />

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ReelSound</Text>
          <Text style={styles.headerSubtitle}>
            Pick your vibe and jump straight into neon sound pads.
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* PRIMARY ACTIONS */}
          <View style={styles.primaryGrid}>
            <DashboardCard
              title="Sounds"
              subtitle="Meme & effects"
              colors={["#34D399", "#16A34A"]}
              onPress={() => router.push("/music-list")}
            />

            <DashboardCard
              title="Background Music"
              subtitle="For videos"
              colors={["#FB923C", "#EA580C"]}
              onPress={() => router.push("/songs")}
            />
            <DashboardCard
              title="Music"
              subtitle="Songs & tracks"
              colors={["#7C83FF", "#4338CA"]}
              onPress={() => router.push("/music")}
            />
          </View>

          {/* TRENDING SECTION */}
          <Section title="Trending Now">
            <HorizontalCard
              title="Viral Reels Music"
              onPress={() =>
                router.push({ pathname: "/music", params: { tag: "viral" } })
              }
            />
          </Section>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  heroGlow: {
    position: "absolute",
    top: -140,
    left: -24,
    right: -24,
    height: 260,
    borderRadius: 240,
    backgroundColor: "rgba(255,77,173,0.15)",
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 29,
    fontWeight: "800",
    color: "#F4F7FF",
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#A3AED0",
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

  /* PRIMARY GRID */
  primaryGrid: {
    marginTop: 8,
    gap: 14,
  },

  bigCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9,
  },
  bigCardGradient: {
    padding: 20,
    height: 114,
    justifyContent: "space-between",
    borderRadius: 24,
  },
  bigCardTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bigCardSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },

  /* SECTIONS */
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    color: "#F3F4FF",
  },

  /* HORIZONTAL */
  horizontalCard: {
    backgroundColor: "rgba(17,21,33,0.92)",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  horizontalText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E8ECFF",
  },

  /* MINI GRID */
  useCaseGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  miniCard: {
    width: "48%",
    backgroundColor: "rgba(17,21,33,0.92)",
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  miniText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E8ECFF",
  },
});
