import UploadAudioScreen from "@/src/screens/UploadAudioScreen";
import { Stack } from "expo-router";
import React from "react";

export default function UploadAudioRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <UploadAudioScreen />
    </>
  );
}
