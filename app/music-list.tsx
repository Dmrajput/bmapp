import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import MusicListScreen from "../src/screens/MusicListScreen";

const firstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function MusicListRoute() {
  const params = useLocalSearchParams();
  const normalizedParams = {
    ...params,
    type: firstParam(params.type),
    category: firstParam(params.category),
  };
  // Bridge expo-router params to a React Navigation-like route prop
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MusicListScreen route={{ params: normalizedParams }} />
    </>
  );
}
