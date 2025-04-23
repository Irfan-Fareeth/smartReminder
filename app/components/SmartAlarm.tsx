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
import { SetStateAction, useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PuzzleComponent from './puzzleComponent';


// Notification configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


export default function SmartAlarm() {
  // State variables
  const [alarms, setAlarms] = useState<{ time: string; audio: string; id: string; notificationId?: string }[]>([]);
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
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [selectedHour, setSelectedHour] = useState('');
const [selectedMinute, setSelectedMinute] = useState('');
const [selectedAMPM, setSelectedAMPM] = useState<'AM' | 'PM'>('AM');

  const [selectedTime, setSelectedTime] = useState(() => {
    if (tempTime) {
      const [hours, minutes] = tempTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      return date;
    }
    return new Date();
  });

  // Constants
  const isPuzzleSolved = puzzleAnswer.trim() === '7';
  const audioOptions = ['default', 'Saachitaley', 'Avesham', 'Puli','Govindha','SrinivasaGovindha','VadivelSleep1','VadivelSleep2' ];
  const audioFiles: Record<string, any> = {
    default: require('../../assets/vizhiye.mp3'),
    Saachitaley: require('../../assets/saachitale.mp3'),
    Avesham: require('../../assets/avesham.mp3'),
    Puli: require('../../assets/Puli-Urumudhu.mp3'),
    Govindha: require('../../assets/HGovinda.mp3'),
    SrinivasaGovindha: require('../../assets/GovindhaAkka.mp3'),
    VadivelSleep1: require('../../assets/Vadivel Sleep.mp3'),
    VadivelSleep2: require('../../assets/SleepVadivel.mp3'),
  };

  // Load alarms from storage on component mount
  useEffect(() => {
    const loadAlarms = async () => {
      try {
        const storedAlarms = await AsyncStorage.getItem('alarms');
        if (storedAlarms) {
          setAlarms(JSON.parse(storedAlarms));
        }
      } catch (error) {
        console.error('Error loading alarms:', error);
      }
    };
    
    loadAlarms();
  }, []);

  // Save alarms to storage whenever they change
  useEffect(() => {
    const saveAlarms = async () => {
      try {
        await AsyncStorage.setItem('alarms', JSON.stringify(alarms));
      } catch (error) {
        console.error('Error saving alarms:', error);
      }
    };
    
    saveAlarms();
  }, [alarms]);

  // Time picker handler
  const handleTimePickerChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (date) {
        setSelectedTime(date);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        setTempTime(`${hours}:${minutes}`);
      }
      return;
    }

    if (date) {
      setSelectedTime(date);
    }
    
    if (event.type === 'set' && date) {
      setShowTimePicker(false);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setTempTime(`${hours}:${minutes}`);
    }
  };

  const handleConfirmTime = () => {
    const hours = selectedTime.getHours().toString().padStart(2, '0');
    const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
    setTempTime(`${hours}:${minutes}`);
    setShowTimePicker(false);
  };

  // Notification setup
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

  // Set alarm function
  const handleSetAlarm = async () => {
    if (selectedHour && selectedMinute) {
      let hour = parseInt(selectedHour);
      const minute = parseInt(selectedMinute);
  
      if (selectedAMPM === 'PM' && hour !== 12) hour += 12;
      if (selectedAMPM === 'AM' && hour === 12) hour = 0;
  
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      const timeStr = `${formattedHour}:${formattedMinute}`;
  
      const alarmId = `${timeStr}-${selectedAudio}`;
      const exists = alarms.some((a) => a.id === alarmId);
      if (exists) {
        Alert.alert('Alarm already exists!');
        return;
      }
  
      const now = new Date();
      const alarmDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
      if (alarmDate <= now) alarmDate.setDate(alarmDate.getDate() + 1);
  
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Alarm Alert',
          body: `Alarm set for ${formattedHour}:${formattedMinute}`,
          sound: true,
        },
        trigger: alarmDate,
      });
  
      const newAlarm = {
        time: timeStr,
        audio: selectedAudio,
        id: alarmId,
        notificationId,
      };
  
      setAlarms((prev) => [...prev, newAlarm]);
      setSelectedAudio('default');
      setSelectedHour('');
      setSelectedMinute('');
      setSelectedAMPM('AM');
    }
  };
  

  // Time tracking effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const rawHours = now.getHours();
      const hours = (rawHours % 12 || 12).toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const ampm = rawHours >= 12 ? 'PM' : 'AM';
      
      const timeString = `${hours}:${minutes} ${ampm}`;
      const timeWithSeconds = `${hours}:${minutes}:${seconds} ${ampm}`;
  
      setCurrentTime(timeWithSeconds);
  
      alarms.forEach((alarm) => {
        const alarmTimeWithAMPM = (() => {
          const [alarmHour, alarmMinute] = alarm.time.split(':');
          let alarmHourNum = parseInt(alarmHour, 10);
          const alarmAMPM = alarmHourNum >= 12 ? 'PM' : 'AM';
          alarmHourNum = alarmHourNum % 12 || 12;
          return `${alarmHourNum.toString().padStart(2, '0')}:${alarmMinute} ${alarmAMPM}`;
        })();
  
        const key = `${alarm.time}-${alarm.audio}`;
        if (alarmTimeWithAMPM === timeString && seconds === '00' && !triggeredAlarms.has(key)) {
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
  
  // Audio functions
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

  // Alarm list functions
  const deleteAlarm = async (id: string) => {
    const alarmToDelete = alarms.find(a => a.id === id);
    if (alarmToDelete?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(alarmToDelete.notificationId);
    }
    setAlarms((prev) => prev.filter((a) => a.id !== id));
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

      <View style={styles.timeInputRow}>
  <TextInput
    style={styles.timeInputBox}
    placeholder="HH"
    placeholderTextColor="#94a3b8"
    value={selectedHour}
    onChangeText={(text) => {
      const hour = text.replace(/[^0-9]/g, '');
      setSelectedHour(hour);
      if(hour<0 || hour>12) 
        { alert('enter valid time');
          setSelectedHour('');
        }
    }}
    keyboardType="number-pad"
    maxLength={2}
  />
  <Text style={{ color: '#f8fafc', fontSize: 20, marginHorizontal: 4 }}>:</Text>
  <TextInput
    style={styles.timeInputBox}
    placeholder="MM"
    placeholderTextColor="#94a3b8"
    value={selectedMinute}
    onChangeText={(text) => {
      const min = text.replace(/[^0-9]/g, '');
      setSelectedMinute(min);
    }}
    keyboardType="number-pad"
    maxLength={2}
  />
   <Text style={styles.ampm}>{selectedAMPM}</Text>
   <Picker
    selectedValue="AM"
    onValueChange={(value) => setSelectedAMPM(value)}
    style={styles.ampmPicker}
  >
    <Picker.Item label="AM" value="AM" />
    <Picker.Item label="PM" value="PM" />
  </Picker>

</View>



      {/* Audio Picker Section */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedAudio}
          onValueChange={(itemValue: SetStateAction<string>) => setSelectedAudio(itemValue)}
          style={styles.picker}
        >
          {audioOptions.map((audio) => (
            <Picker.Item key={audio} label={audio} value={audio} />
          ))}
        </Picker>
      </View>

      {/* Set Alarm Button */}
      <TouchableOpacity style={styles.setButton} onPress={handleSetAlarm}>
        <Text style={styles.setButtonText}>Set Alarm</Text>
      </TouchableOpacity>

      {/* Alarms List */}
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

      {/* Alarm Ringing Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={[styles.fullScreenModal, { backgroundColor: '#0f172a' }]}>
          <Text style={styles.modalTitle}>Alarm Ringing! </Text>
          

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



// Styles
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
  timeInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#1e293b',
  },
  timeInputText: {
    color: '#f8fafc',
    marginLeft: 10,
    fontSize: 16,
  },
  selectedTimeText: {
    marginLeft: 'auto',
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  timePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 12,
  },
  timePicker: {
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  picker: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  setButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  ampm: {
    color:'white',
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
  manualTimeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#1e293b',
    height: 50,
  },
  manualTimeInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    marginLeft: 10,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeInputBox: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    width: 60,
    height: 50,
    textAlign: 'center',
  },
  ampmPicker: {
    width: 100,
    height: 50,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    marginLeft: 8,
  },
  
});