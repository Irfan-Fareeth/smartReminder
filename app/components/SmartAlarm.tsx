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
  StyleSheet
} from 'react-native';
import { SetStateAction, useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';
import PuzzleComponent from './puzzleComponent'; // ✅ Import
import Header from './Header';
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
  const isPuzzleSolved = puzzleAnswer.trim() === '7';

  const audioOptions = ['default', 'beep', 'chime', 'ringtone'];

  const audioFiles: Record<string, any> = {
    default: require('../../assets/vizhiye.mp3'),
    beep: require('../../assets/saachitale.mp3'),
    chime: require('../../assets/avesham.mp3'),
    ringtone: require('../../assets/avesham.mp3'),
  };

  const handleWebTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (newTime) setTempTime(newTime);
  };

  const handleSetAlarm = () => {
    if (tempTime) {
      const alarmId = `${tempTime}-${selectedAudio}`;
      const exists = alarms.some((a) => a.id === alarmId);
      if (exists) {
        Alert.alert('Alarm already exists!');
        return;
      }
      setAlarms((prev) => [...prev, { time: tempTime, audio: selectedAudio, id: alarmId }]);
      setSelectedAudio('default');
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
      <Header/>
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
            <Text>• {alarm.time} - Audio: {alarm.audio}</Text>
            <Button title="Delete" color="red" onPress={() => deleteAlarm(alarm.id)} />
          </View>
        ))}

        <Text style={[styles.alarmsHeader, { marginTop: 20 }]}>Past Alarms:</Text>
        {past.map((alarm) => (
          <View key={alarm.id} style={styles.alarmItem}>
            <Text>• {alarm.time} - Audio: {alarm.audio}</Text>
            <Button title="Delete" color="red" onPress={() => deleteAlarm(alarm.id)} />
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={[styles.fullScreenModal, mode === 'puzzle' && { backgroundColor: '#0f172a' }]}>
          <Text style={[styles.modalTitle, mode === 'puzzle' && { color: '#fbbf24' }]}>
            Alarm Ringing! 🔔
          </Text>
          <Text style={[styles.modalSubtitle, mode === 'puzzle' && { color: '#e2e8f0' }]}>
            Mode: {mode === 'puzzle' ? 'Solve Puzzle' : 'To-Do List'}
          </Text>

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

// ✅ Keep your existing styles object

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  currentTimeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    padding: 15,
    fontSize: 18,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderColor: '#3b82f6',
    borderWidth: 1,
    marginBottom: 20,
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  select: {
    width: '100%',
    padding: 14,
    fontSize: 16,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderColor: '#3b82f6',
    borderWidth: 1,
  },
  picker: {
    color: '#f8fafc',
  },
  setButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 14,
    marginBottom: 30,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  setButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  alarmsList: {
    flex: 1,
  },
  alarmsHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e2e8f0',
    marginVertical: 10,
  },
  alarmItem: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  fullScreenModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 30,
  },
  modalTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#facc15',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#cbd5e1',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputBox: {
    fontSize: 24,
    color: '#fef9c3',
    borderBottomWidth: 2,
    borderBottomColor: '#facc15',
    textAlign: 'center',
    marginVertical: 20,
    width: 100,
  },
  checkButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#64748b',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  snoozeButton: {
    backgroundColor: '#facc15',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginRight: 10,
    shadowColor: '#fde68a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#f87171',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  todoItem: {
    fontSize: 20,
    color: '#10b981',
    padding: 10,
    backgroundColor: '#064e3b',
    marginVertical: 6,
    borderRadius: 8,
    textAlign: 'center',
    width: 260,
  },
  modeSwitchText: {
    marginTop: 30,
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
