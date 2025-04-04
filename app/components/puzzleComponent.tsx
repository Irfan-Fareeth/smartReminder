import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

type Props = {
  puzzleAnswer: string;
  setPuzzleAnswer: (text: string) => void;
  isPuzzleSolved: boolean;
  onSnooze: () => void;
  onStop: () => void;
};

const wordList = ['cat', 'plant', 'alarm', 'react', 'clock', 'night', 'smart', 'brain'];
const colorList = ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple'];

const scrambleWord = (word: string) => {
  return word.split('').sort(() => 0.5 - Math.random()).join('');
};

const getRandomColorSequence = (length: number) => {
  return Array.from({ length }, () => colorList[Math.floor(Math.random() * colorList.length)]);
};

const PuzzleComponent: React.FC<Props> = ({
  puzzleAnswer,
  setPuzzleAnswer,
  isPuzzleSolved,
  onSnooze,
  onStop,
}) => {
  const [puzzleType, setPuzzleType] = useState<'math' | 'scramble' | 'memory'>('math');
  const [correctWord, setCorrectWord] = useState('cat');
  const [scrambledWord, setScrambledWord] = useState(scrambleWord('cat'));
  const [colorSequence, setColorSequence] = useState<string[]>([]);
  const [showColors, setShowColors] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const types = ['math', 'scramble', 'memory'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];
    setPuzzleType(randomType);
    setPuzzleAnswer('');

    if (randomType === 'scramble') {
      const newWord = wordList[Math.floor(Math.random() * wordList.length)];
      setCorrectWord(newWord);
      setScrambledWord(scrambleWord(newWord));
    } else if (randomType === 'memory') {
      const sequence = getRandomColorSequence(4);
      setColorSequence(sequence);
      setShowColors(true);
      setTimeout(() => setShowColors(false), 5000);
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const isScrambleCorrect = puzzleAnswer.trim().toLowerCase() === correctWord;
  const isMathCorrect = puzzleAnswer.trim() === '7';
  const isMemoryCorrect =
    puzzleAnswer.trim().toLowerCase().replace(/\s+/g, '') ===
    colorSequence.join('').toLowerCase();

  const solved =
    puzzleType === 'math'
      ? isMathCorrect
      : puzzleType === 'scramble'
      ? isScrambleCorrect
      : isMemoryCorrect;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.header}>🔔 Solve to Dismiss</Text>

      {puzzleType === 'math' && (
        <Text style={styles.puzzleText}>🧩 What is 3 + 4?</Text>
      )}

      {puzzleType === 'scramble' && (
        <Text style={styles.puzzleText}>
          🔤 Unscramble this: <Text style={styles.scrambledWord}>{scrambledWord.toUpperCase()}</Text>
        </Text>
      )}

      {puzzleType === 'memory' && (
        <Text style={styles.puzzleText}>
          {showColors
            ? `🧠 Memorize: ${colorSequence.join(' - ')}`
            : '🧠 Enter the color sequence (no spaces)'}
        </Text>
      )}

      <TextInput
        value={puzzleAnswer}
        onChangeText={setPuzzleAnswer}
        placeholder="Type your answer"
        placeholderTextColor="#94a3b8"
        keyboardType={puzzleType === 'math' ? 'numeric' : 'default'}
        autoCapitalize="none"
        style={styles.input}
      />
      {!solved && <Text style={styles.hint}>🛑 Solve the puzzle to snooze/stop</Text>}

      <View style={styles.controlButtons}>
        <TouchableOpacity
          style={[styles.snoozeButton, { opacity: !solved ? 0.5 : 1 }]}
          onPress={onSnooze}
          disabled={!solved}
        >
          <Text style={styles.controlButtonText}>Snooze</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stopButton, { opacity: !solved ? 0.5 : 1 }]}
          onPress={onStop}
          disabled={!solved}
        >
          <Text style={styles.controlButtonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default PuzzleComponent;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    marginHorizontal: 10,
    elevation: 6,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fcd34d',
    marginBottom: 20,
  },
  puzzleText: {
    fontSize: 20,
    color: '#f8fafc',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrambledWord: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  input: {
    width: 220,
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderColor: '#38bdf8',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 18,
    marginTop: 5,
    textAlign: 'center',
  },
  hint: {
    color: '#f87171',
    marginTop: 12,
    fontWeight: '500',
  },
  controlButtons: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-between',
  },
  snoozeButton: {
    backgroundColor: '#facc15',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginRight: 10,
    shadowColor: '#fef08a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  stopButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    shadowColor: '#f87171',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
