import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function CategoryScreen({ route, navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category</Text>
      <Text style={styles.subtitle}>Placeholder for category: {route?.params?.category || 'All'}</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation?.navigate?.('Player')}>
        <Text style={styles.buttonText}>Open Player</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#444', marginBottom: 12 },
  button: { backgroundColor: '#1E90FF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
