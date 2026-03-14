import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import MusicListScreen from '../../src/screens/MusicListScreen';

export default function MusicCategoryRoute() {
  const params = useLocalSearchParams();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MusicListScreen
        route={{
          params: {
            ...params,
            type: params.type || "background music",
          },
        }}
      />
    </>
  );
}
