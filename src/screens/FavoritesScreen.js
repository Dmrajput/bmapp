import { useFavorites } from "@/context/favorites-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FavoritesScreen() {
  const { favorites, removeFavorite } = useFavorites();

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>{item.category}</Text>
      </View>

      <Pressable
        style={styles.removeBtn}
        onPress={() => removeFavorite(item.id)}
      >
        <Ionicons name="heart" size={18} color="#f472b6" />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Favorites</Text>

      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={36} color="#8b93a5" />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart on any track to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0c0c" },
  header: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtitle: {
    color: "#9aa0a6",
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151515",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardLeft: { flex: 1, paddingRight: 12 },
  title: { color: "#fff", fontSize: 16, fontWeight: "600" },
  meta: { color: "#9aa0a6", fontSize: 12, marginTop: 4 },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#2a1b2a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f472b6",
  },
});
