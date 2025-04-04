import React, { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

type Task = {
  id: string;
  description: string;
  done: boolean;
  category: string;
  date: string; // format: YYYY-MM-DD
};

const CATEGORIES = ['Work', 'Study', 'Personal', 'Fitness', 'Other'];

const ToDoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const dateKey = date.toLocaleDateString('en-CA'); // "YYYY-MM-DD"

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    saveTasks();
  }, [tasks]);

  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
    } catch {
      Alert.alert('Error saving tasks');
    }
  };

  const loadTasks = async () => {
    try {
      const stored = await AsyncStorage.getItem('tasks');
      if (stored) {
        const loadedTasks: Task[] = JSON.parse(stored).map((t: Task) => ({
          ...t,
          date: new Date(t.date).toLocaleDateString('en-CA'),
        }));
        setTasks(loadedTasks);
      }
    } catch {
      Alert.alert('Error loading tasks');
    }
  };

  const addOrUpdateTask = () => {
    if (!input.trim()) return;

    const formattedDate = date.toLocaleDateString('en-CA');

    if (editTaskId) {
      setTasks(prev =>
        prev.map(t =>
          t.id === editTaskId
            ? { ...t, description: input, category, date: formattedDate }
            : t
        )
      );
      setEditTaskId(null);
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        description: input,
        done: false,
        category,
        date: formattedDate,
      };
      setTasks(prev => [...prev, newTask]);
    }

    setInput('');
    setCategory(CATEGORIES[0]);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const editTask = (task: Task) => {
    setInput(task.description);
    setCategory(task.category);
    setEditTaskId(task.id);
    setDate(new Date(task.date));
  };

  const tasksForDate = tasks.filter(t => t.date === dateKey);
  const completed = tasksForDate.filter(t => t.done).length;
  const progress = tasksForDate.length
    ? Math.round((completed / tasksForDate.length) * 100)
    : 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString('en-CA');
  }).reverse();

  const weeklyStats = last7Days.map(d => {
    const dayTasks = tasks.filter(t => t.date === d);
    const done = dayTasks.filter(t => t.done).length;
    const percent = dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0;
    return { date: d, percent };
  });

  const friendlyDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.heading}>📝 To-Do List for {friendlyDate}</Text>

      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateButton}>📅 Change Date</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, selected) => {
            setShowDatePicker(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      <TextInput
        placeholder="Enter task"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={input}
        onChangeText={setInput}
      />

      <View style={styles.dropdown}>
        <Picker
          selectedValue={category}
          onValueChange={setCategory}
          style={{ color: 'white' }}
        >
          {CATEGORIES.map(cat => (
            <Picker.Item label={cat} value={cat} key={cat} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity onPress={addOrUpdateTask} style={styles.addButton}>
        <Text style={styles.addText}>
          {editTaskId ? '✏ Update Task' : '➕ Add Task'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={tasksForDate}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.taskRow, item.done && styles.taskDone]}>
            <TouchableOpacity
              style={styles.taskContent}
              onPress={() => toggleTask(item.id)}
              onLongPress={() => editTask(item)}
            >
              <Text style={styles.taskText}>
                {item.done ? '✅' : '🔲'} {item.description}{' '}
                <Text style={styles.category}>[{item.category}]</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text style={styles.deleteText}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No tasks for this day.</Text>}
      />

      <Text style={styles.progress}>Progress: {progress}%</Text>

      <TouchableOpacity
        style={styles.summaryButton}
        onPress={() => setShowSummary(true)}
      >
        <Text style={styles.addText}>📊 Show Summary</Text>
      </TouchableOpacity>

      {/* Summary Modal */}
      <Modal visible={showSummary} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.summaryHeading}>📈 Weekly Summary</Text>
            {weeklyStats.map(stat => (
              <View key={stat.date} style={{ marginVertical: 4 }}>
                <Text style={styles.summaryText}>
                  {stat.date} - {stat.percent}% Complete
                </Text>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[styles.progressBarFill, { width: `${stat.percent}%` }]}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.addButton, { marginTop: 12 }]}
              onPress={() => setShowSummary(false)}
            >
              <Text style={styles.addText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 60,
  },
  heading: {
    fontSize: 22,
    color: '#f1f5f9',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    padding: 10,
    borderRadius: 10,
    marginVertical: 6,
  },
  dropdown: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    marginVertical: 6,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
  },
  addText: {
    color: '#fff',
    fontSize: 16,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  taskDone: {
    backgroundColor: '#475569',
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  category: {
    fontSize: 12,
    color: '#94a3b8',
  },
  deleteText: {
    fontSize: 20,
    color: '#f87171',
    marginLeft: 12,
  },
  progress: {
    marginTop: 10,
    color: '#f1f5f9',
    textAlign: 'center',
    fontSize: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 20,
  },
  dateButton: {
    textAlign: 'center',
    color: '#38bdf8',
    marginBottom: 10,
    textDecorationLine: 'underline',
  },
  summaryButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 6,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 20,
    width: '85%',
  },
  summaryHeading: {
    fontSize: 20,
    color: '#f1f5f9',
    marginBottom: 10,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  progressBarBackground: {
    height: 8,
    width: '100%',
    backgroundColor: '#334155',
    borderRadius: 5,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 5,
  },
});

export default ToDoList;
