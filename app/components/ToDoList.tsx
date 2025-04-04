import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ToDoList = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📝 Here's your To-Do List!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    color: '#f8fafc',
  },
});

export default ToDoList;
