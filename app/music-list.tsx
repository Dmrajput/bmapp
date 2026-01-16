import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import MusicListScreen from '../src/screens/MusicListScreen';

export default function MusicListRoute() {
  const params = useLocalSearchParams();
  // Bridge expo-router params to a React Navigation-like route prop
  return <MusicListScreen route={{ params }} />;
}
