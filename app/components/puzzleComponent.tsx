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
const colorList = ['Red', 'Blue', 'Green', 'Purple', 'Orange', 'Gray'];

const scrambleWord = (word: string) => {
  return word.split('').sort(() => 0.5 - Math.random()).join('');
};

const getRandomColorSequence = (length: number) => {
  return Array.from({ length }, () => colorList[Math.floor(Math.random() * colorList.length)]);
};

const logicQuestions = [
  {
    question: 'Which is the largest number?',
    options: ['7', '3', '9', '5'],
    answer: '9',
  },
  {
    question: 'Which one does not belong?',
    options: ['Dog', 'Cat', 'Car', 'Rabbit'],
    answer: 'Car',
  },
  {
    question: 'Which number is odd?',
    options: ['2', '6', '4', '5'],
    answer: '5',
  },
];

const generateRandomString = (length = 10) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const PuzzleComponent: React.FC<Props> = ({
  puzzleAnswer,
  setPuzzleAnswer,
  isPuzzleSolved,
  onSnooze,
  onStop,
}) => {
  const [puzzleType, setPuzzleType] = useState<'math' | 'scramble' | 'logic' | 'memory' | 'displayword'>('math');
  const [correctWord, setCorrectWord] = useState('cat');
  const [scrambledWord, setScrambledWord] = useState(scrambleWord('cat'));
  const [logicQ, setLogicQ] = useState(logicQuestions[0]);
  const [colorSequence, setColorSequence] = useState<string[]>([]);
  const [showColors, setShowColors] = useState(false);
  const [isPuzzleStarted, setIsPuzzleStarted] = useState(false);
  const [displayWord, setDisplayWord] = useState(generateRandomString());
  const fadeAnim = useState(new Animated.Value(0))[0];

  const setupPuzzle = () => {
    const types = ['math', 'scramble', 'logic', 'memory', 'displayword'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];
    setPuzzleType(randomType);
    setPuzzleAnswer('');
    setIsPuzzleStarted(false);

    if (randomType === 'scramble') {
      const newWord = wordList[Math.floor(Math.random() * wordList.length)];
      setCorrectWord(newWord);
      setScrambledWord(scrambleWord(newWord));
    } else if (randomType === 'logic') {
      const newQ = logicQuestions[Math.floor(Math.random() * logicQuestions.length)];
      setLogicQ(newQ);
    } else if (randomType === 'memory') {
      const sequence = getRandomColorSequence(4);
      setColorSequence(sequence);
      setShowColors(true);
      setTimeout(() => setShowColors(false), 5000);
    } else if (randomType === 'displayword') {
      const randomString = generateRandomString();
      setDisplayWord(randomString);
    }

    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  useEffect(setupPuzzle, []);

  const isScrambleCorrect = puzzleAnswer.trim().toLowerCase() === correctWord;
  const isMathCorrect = puzzleAnswer.trim() === '7';
  const isLogicCorrect = puzzleAnswer.trim().toLowerCase() === logicQ.answer.toLowerCase();
  const isMemoryCorrect =
    puzzleAnswer.trim().toLowerCase().replace(/\s+/g, '') ===
    colorSequence.join('').toLowerCase();
  const isDisplayWordCorrect = puzzleAnswer.trim().toLowerCase() === displayWord.toLowerCase();

  const solved =
    puzzleType === 'math'
      ? isMathCorrect
      : puzzleType === 'scramble'
      ? isScrambleCorrect
      : puzzleType === 'logic'
      ? isLogicCorrect
      : puzzleType === 'memory'
      ? isMemoryCorrect
      : isDisplayWordCorrect;

  const handlePuzzleAction = (action: 'snooze' | 'stop') => {
    if (!isPuzzleStarted) return;
    if (solved) {
      action === 'snooze' ? onSnooze() : onStop();
    }
  };

  const handleLogicOptionPress = (option: string) => {
    if (isPuzzleStarted) setPuzzleAnswer(option);
  };

  return (
    <View style={{ position: 'relative', width: '100%' }}>
      {!isPuzzleStarted && (
        <TouchableOpacity style={styles.blurOverlay} onPress={() => setIsPuzzleStarted(true)}>
          <Text style={styles.blurText}>Tap anywhere to begin puzzle to snooze or stop</Text>
        </TouchableOpacity>
      )}
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        

        {puzzleType === 'math' && <Text style={styles.puzzleText}>What is 3 + 4?</Text>}

        {puzzleType === 'scramble' && (
          <Text style={styles.puzzleText}>
            Unscramble this: <Text style={styles.scrambledWord}>{scrambledWord.toUpperCase()}</Text>
          </Text>
        )}

        {puzzleType === 'logic' && (
          <>
            <Text style={styles.puzzleText}>{logicQ.question}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {logicQ.options.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleLogicOptionPress(opt)}
                  style={styles.optionButton}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {puzzleType === 'memory' && (
          <Text style={styles.puzzleText}>
            {showColors
              ? `Memorize: ${colorSequence.join(' - ')}`
              : 'Enter the color sequence (no spaces)'}
          </Text>
        )}

        {puzzleType === 'displayword' && (
          <Text style={styles.puzzleText}>
            Type this word exactly: <Text style={styles.scrambledWord}>{displayWord}</Text>
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
          editable={isPuzzleStarted}
        />

        {!solved && isPuzzleStarted && (
          <Text style={styles.hint}>Solve the puzzle to snooze/stop</Text>
        )}

        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.snoozeButton, { opacity: solved ? 1 : 0.5 }]}
            onPress={() => handlePuzzleAction('snooze')}
          >
            <Text style={styles.controlButtonText}>Snooze</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stopButton, { opacity: solved ? 1 : 0.5 }]}
            onPress={() => handlePuzzleAction('stop')}
          >
            <Text style={styles.controlButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={setupPuzzle} style={styles.refreshButton}>
          <Text style={styles.refreshText}>🔁 Refresh Puzzle</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default PuzzleComponent;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    marginHorizontal: 10,
    elevation: 6,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 20,
  },
  puzzleText: {
    fontSize: 20,
    color: '#f8fafc',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  logicOptions: {
    fontSize: 18,
    color: '#94a3b8',
    marginBottom: 12,
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
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginRight: 10,
    shadowColor: '#93c5fd',
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
  refreshButton: {
    marginTop: 20,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
    borderColor: '#38bdf8',
    borderWidth: 1,
  },
  refreshText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '600',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  blurText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  optionButton: {
    backgroundColor: '#1e293b',
    padding: 10,
    margin: 5,
    borderRadius: 10,
    borderColor: '#38bdf8',
    borderWidth: 1,
  },
  optionText: {
    color: '#38bdf8',
    fontWeight: '600',
    fontSize: 16,
  },
});
