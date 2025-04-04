import React from "react";
import { View } from "react-native";
import SmartAlarm from "./components/SmartAlarm"; // Ensure the correct path

export default function Index() {
  return (
    <View style={{ flex: 1 }}>
      <SmartAlarm />
    </View>
  );
}
