import {
  Platform,
  View,
  Button,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SetStateAction, useEffect, useState, useRef } from 'react';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import PuzzleComponent from './puzzleComponent';
import Header from './Header';

// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function SmartAlarm() {
  const [alarms, setAlarms] = useState<{ time: string; audio: string; id: string }[]>([]);
  const [tempTime, setTempTime] = useState('');
  const [selectedAudio, setSelectedAudio] = useState('default');
  const [currentTime, setCurrentTime] = useState('');
  const [triggeredAlarms, setTriggeredAlarms] = useState<Set<string>>(new Set());
  const [currentlyRinging, setCurrentlyRinging] = useState<string | null>(null);
  const [snoozeTimeout, setSnoozeTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<'puzzle' | 'todo'>('puzzle');
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const isPuzzleSolved = puzzleAnswer.trim() === '7';
  const audioOptions = ['default', 'beep', 'chime', 'ringtone'];
  const audioFiles: Record<string, any> = {
    default: require('../../assets/vizhiye.mp3'),
    beep: require('../../assets/saachitale.mp3'),
    chime: require('../../assets/avesham.mp3'),
    ringtone: require('../../assets/avesham.mp3'),
  };

  // Register for push notifications
  useEffect(() => {
    const registerForPushNotifications = async () => {
      if (Constants.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          Alert.alert('Failed to get push token for notifications!');
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();
        setExpoPushToken(tokenData.data);
      } else {
        console.log('Must use physical device for push notifications');
      }
    };
    registerForPushNotifications();
  }, []);

  const handleWebTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (newTime) setTempTime(newTime);
  };

  const handleSetAlarm = async () => {
    if (tempTime) {
      const alarmId = `${tempTime}-${selectedAudio}`;
      const exists = alarms.some((a) => a.id === alarmId);
      if (exists) {
        Alert.alert('Alarm already exists!');
        return;
      }

      setAlarms((prev) => [...prev, { time: tempTime, audio: selectedAudio, id: alarmId }]);
      setSelectedAudio('default');

      const [h, m] = tempTime.split(':').map(Number);
      const now = new Date();
      const alarmDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
      if (alarmDate <= now) alarmDate.setDate(alarmDate.getDate() + 1);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Alarm Alert',
          body: `Alarm set for ${tempTime}`,
          sound: true,
        },
        trigger: alarmDate,
      });
    }
  };

  const deleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      const timeWithSeconds = `${hours}:${minutes}:${seconds}`;

      setCurrentTime(timeWithSeconds);

      alarms.forEach((alarm) => {
        const key = `${alarm.time}-${alarm.audio}`;
        if (alarm.time === timeString && seconds === '00' && !triggeredAlarms.has(key)) {
          if (currentlyRinging === null) {
            setCurrentlyRinging(key);
            playAudio(alarm.audio, key);
            setTriggeredAlarms((prev) => new Set(prev).add(key));
            setModalVisible(true);
            setPuzzleAnswer('');
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms, triggeredAlarms, currentlyRinging]);

  const playAudio = async (audio: string, key: string) => {
    try {
      if (currentSound) {
        await currentSound.stopAsync();
        setCurrentSound(null);
      }

      const { sound } = await Audio.Sound.createAsync(audioFiles[audio]);
      await sound.playAsync();
      await sound.setIsLoopingAsync(true);
      setCurrentSound(sound);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didFinish) {
          if (currentlyRinging === key) {
            setCurrentlyRinging(null);
            sound.stopAsync();
            setCurrentSound(null);
          }
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const stopAlarm = () => {
    if (currentSound) {
      currentSound.stopAsync();
      setCurrentSound(null);
    }
    if (snoozeTimeout) {
      clearTimeout(snoozeTimeout);
      setSnoozeTimeout(null);
    }
    setCurrentlyRinging(null);
    setModalVisible(false);
  };

  const snoozeAlarm = () => {
    if (snoozeTimeout) clearTimeout(snoozeTimeout);
    if (currentSound) {
      currentSound.stopAsync();
      setCurrentSound(null);
    }

    const key = currentlyRinging;
    setCurrentlyRinging(null);
    setModalVisible(false);

    const newSnoozeTimeout = setTimeout(() => {
      if (key) {
        const alarmToReschedule = alarms.find((alarm) => alarm.id === key);
        if (alarmToReschedule) {
          setCurrentlyRinging(key);
          playAudio(alarmToReschedule.audio, key);
          setModalVisible(true);
          setPuzzleAnswer('');
        }
      }
    }, 5 * 1000);

    setSnoozeTimeout(newSnoozeTimeout);
  };

  const getUpcomingAndPast = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const upcoming = alarms.filter((a) => {
      const [h, m] = a.time.split(':').map(Number);
      return h * 60 + m >= currentMinutes;
    });
    const past = alarms.filter((a) => !upcoming.includes(a));
    return { upcoming, past };
  };

  const { upcoming, past } = getUpcomingAndPast();

  return (
    <View style={styles.container}>
      <Text style={styles.currentTimeText}>Current Time: {currentTime}</Text>

      {Platform.OS === 'web' ? (
        <input
          type="time"
          value={tempTime}
          onChange={handleWebTimeChange}
          style={styles.input}
        />
      ) : (
        <TextInput
          value={tempTime}
          onChangeText={(text) => setTempTime(text)}
          placeholder="HH:MM"
          style={styles.input}
        />
      )}

      <View style={styles.pickerContainer}>
        {Platform.OS === 'web' ? (
          <select
            value={selectedAudio}
            onChange={(e) => setSelectedAudio(e.target.value)}
            style={styles.select}
          >
            {audioOptions.map((audio) => (
              <option key={audio} value={audio}>
                {audio}
              </option>
            ))}
          </select>
        ) : (
          <Picker
            selectedValue={selectedAudio}
            onValueChange={(itemValue: SetStateAction<string>) => setSelectedAudio(itemValue)}
            style={styles.picker}
          >
            {audioOptions.map((audio) => (
              <Picker.Item key={audio} label={audio} value={audio} />
            ))}
          </Picker>
        )}
      </View>

      <TouchableOpacity style={styles.setButton} onPress={handleSetAlarm}>
        <Text style={styles.setButtonText}>Set Alarm</Text>
      </TouchableOpacity>

      <ScrollView style={styles.alarmsList}>
        <Text style={styles.alarmsHeader}>Upcoming Alarms:</Text>
        {upcoming.map((alarm) => (
          <View key={alarm.id} style={styles.alarmItem}>
            <Text style={{ color: '#f8fafc' }}>• {alarm.time} - Audio: {alarm.audio}</Text>
            <Button title="Delete" color="red" onPress={() => deleteAlarm(alarm.id)} />
          </View>
        ))}

        <Text style={[styles.alarmsHeader, { marginTop: 20 }]}>Past Alarms:</Text>
        {past.map((alarm) => (
          <View key={alarm.id} style={styles.alarmItem}>
            <Text style={{ color: '#f8fafc' }}>• {alarm.time} - Audio: {alarm.audio}</Text>
            <Button title="Delete" color="red" onPress={() => deleteAlarm(alarm.id)} />
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={[styles.fullScreenModal, { backgroundColor: '#0f172a' }]}>
          <Text style={styles.modalTitle}>Alarm Ringing! 🔔</Text>
          <Text style={styles.modalSubtitle}>Mode: {mode === 'puzzle' ? 'Solve Puzzle' : 'To-Do List'}</Text>

          {mode === 'puzzle' ? (
            <PuzzleComponent
              puzzleAnswer={puzzleAnswer}
              setPuzzleAnswer={setPuzzleAnswer}
              isPuzzleSolved={isPuzzleSolved}
              onSnooze={snoozeAlarm}
              onStop={stopAlarm}
            />
          ) : (
            <View>
              <Text style={styles.todoItem}>☑ Drink water</Text>
              <Text style={styles.todoItem}>☑ Review task list</Text>
              <Text style={styles.todoItem}>☑ Start coding</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => setMode(mode === 'puzzle' ? 'todo' : 'puzzle')}>
            <Text style={{ marginTop: 20, color: '#3b82f6' }}>
              Switch to {mode === 'puzzle' ? 'To-Do' : 'Puzzle'} Mode
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 10,
    backgroundColor: '#0f172a',
  },
  currentTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  input: {
    height: 40,
    borderColor: '#94a3b8',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  picker: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  select: {
    height: 40,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
  },
  setButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  setButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  alarmsList: {
    flex: 1,
    marginTop: 10,
  },
  alarmsHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#facc15',
  },
  alarmItem: {
    backgroundColor: '#1e293b',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullScreenModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fbbf24',
  },
  modalSubtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#e2e8f0',
  },
  todoItem: {
    fontSize: 18,
    color: '#f8fafc',
    marginBottom: 10,
    backgroundColor: '#475569',
    padding: 12,
    borderRadius: 6,
    width: 240,
    textAlign: 'center',
  },
});
