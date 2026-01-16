import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import MusicListScreen from '../../src/screens/MusicListScreen';

export default function MusicCategoryRoute() {
  const params = useLocalSearchParams();
  return <MusicListScreen route={{ params }} />;
}
