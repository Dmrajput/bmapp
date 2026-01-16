import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MusicCard({ title = 'Track Title', artist = 'Artist', onPress = () => {} }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.artist}>{artist}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', padding: 12, backgroundColor: '#f7f7f7', borderRadius: 8, marginVertical: 6 },
  title: { fontSize: 16, fontWeight: '600' },
  artist: { fontSize: 12, color: '#666' },
});
