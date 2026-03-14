import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import MusicListScreen from "../src/screens/MusicListScreen";

export default function MusicListRoute() {
  const params = useLocalSearchParams();
  // Bridge expo-router params to a React Navigation-like route prop
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MusicListScreen route={{ params }} />
    </>
  );
}
