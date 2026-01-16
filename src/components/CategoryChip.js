import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function CategoryChip({ label = 'Category', onPress = () => {} }) {
  return (
    <TouchableOpacity style={styles.chip} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#eee', borderRadius: 16 },
  label: { fontSize: 12, color: '#333' },
});
