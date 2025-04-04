import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

const Header = ({ isTodoVisible, onToggleView }) => {
  const drawerAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => {
    const toValue = drawerOpen ? -SCREEN_WIDTH : 0;
    Animated.timing(drawerAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setDrawerOpen(!drawerOpen);
    });
  };

  return (
    <>
      {/* Overlay */}
      {drawerOpen && (
        <Pressable style={styles.overlay} onPress={toggleDrawer} />
      )}

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.drawerItem}>🏠 Home</Text>
        <Text style={styles.drawerItem}>🕑 Alarms</Text>
        <Text style={styles.drawerItem}>⚙️ Settings</Text>
        <Text style={styles.drawerItem}>📞 Contact</Text>
      </Animated.View>

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>SmartReminder</Text>
        <TouchableOpacity onPress={onToggleView} style={styles.toggleButton}>
          <Ionicons
            name={isTodoVisible ? 'alarm-outline' : 'checkmark-done-outline'}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  menuButton: {
    padding: 8,
  },
  toggleButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: '#1e293b',
    padding: 20,
    zIndex: 1000,
  },
  drawerItem: {
    color: '#f1f5f9',
    fontSize: 18,
    marginVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backText: {
    color: '#f1f5f9',
    fontSize: 18,
    marginLeft: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
});

export default Header;
