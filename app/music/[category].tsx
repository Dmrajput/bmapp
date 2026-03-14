import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import MusicListScreen from '../../src/screens/MusicListScreen';

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function MusicCategoryRoute() {
  const params = useLocalSearchParams();
  const normalizedCategory = firstParam(params.category) || "";
  const normalizedType = firstParam(params.type) || "background music";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MusicListScreen
        route={{
          params: {
            ...params,
            category: normalizedCategory,
            type: normalizedType,
          },
        }}
      />
    </>
  );
}
