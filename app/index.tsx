import React from 'react';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import MainApp from './components/MainApp'; // Ensure correct path to MainApp.tsx

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Index() {
  return (
    <View style={{ flex: 1 }}>
      <MainApp />
    </View>
  );
}
