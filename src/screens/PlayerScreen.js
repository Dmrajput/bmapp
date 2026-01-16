import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PlayerControls from '../components/PlayerControls';

export default function PlayerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Player</Text>
      <PlayerControls />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
});
