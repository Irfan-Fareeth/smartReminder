import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SmartAlarm from './SmartAlarm';
import ToDoList from './ToDoList';
import Header from './Header';

const MainApp = () => {
  const [isTodoVisible, setIsTodoVisible] = useState(false);

  const toggleView = () => {
    setIsTodoVisible(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <Header isTodoVisible={isTodoVisible} onToggleView={toggleView} />

      <View style={[styles.pageContainer, !isTodoVisible && styles.show]}>
        <SmartAlarm />
      </View>

      <View style={[styles.pageContainer, isTodoVisible && styles.show]}>
        <ToDoList />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    display: 'none', // default: hidden
  },
  show: {
    display: 'flex', // visible one
  },
});

export default MainApp;
