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
  reminderTask?: string;
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
    options: ['71213', '71312', '72563', '72932'],
    answer: '72932',
  },
  {
    question: 'Which one does not belong?',
    options: ['Dog', 'Cat', 'Car', 'Rabbit'],
    answer: 'Car',
  },
  {
    question: 'Which number is odd?',
    options: ['231', '646', '0', '512'],
    answer: '231',
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
  reminderTask,
}) => {
  const [puzzleType, setPuzzleType] = useState<'math' | 'scramble' | 'logic' | 'memory' | 'displayword'>('math');
  const [correctWord, setCorrectWord] = useState('cat');
  const [scrambledWord, setScrambledWord] = useState(scrambleWord('cat'));
  const [logicQ, setLogicQ] = useState(logicQuestions[0]);
  const [colorSequence, setColorSequence] = useState<string[]>([]);
  const [showColors, setShowColors] = useState(false);
  const [isPuzzleStarted, setIsPuzzleStarted] = useState(false);
  const [displayWord, setDisplayWord] = useState(generateRandomString());
  const [memoryStarted, setMemoryStarted] = useState(false); // Tracks if user started memory puzzle
  const fadeAnim = useState(new Animated.Value(0))[0];

  const setupPuzzle = () => {
    const types = ['math', 'scramble', 'logic', 'memory', 'displayword'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];
    setPuzzleType(randomType);
    setPuzzleAnswer('');
    setIsPuzzleStarted(false);
    setShowColors(false);
    setMemoryStarted(false); // Reset memory start flag

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

  const handleStartPuzzle = () => {
    setIsPuzzleStarted(true);
    if (puzzleType === 'memory') {
      setMemoryStarted(true); // Mark that user started memory puzzle
      setShowColors(true); // Now show the colors
      setTimeout(() => setShowColors(false), 5000); // Hide after 5 seconds
    }
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
        <TouchableOpacity style={styles.blurOverlay} onPress={handleStartPuzzle}>
<View style={styles.blurText}>
  {reminderTask && <Text style={styles.blurLine}>Reminder: {reminderTask}</Text>}
  <Text style={styles.tapanywhere}>Tap anywhere to begin puzzle to snooze or stop</Text>
</View>

        </TouchableOpacity>
      )}
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {reminderTask && (
          <View style={styles.reminderContainer}>
            <Text style={{color:'#38bdf8'}}>REMINDER: </Text>
            <Text style={styles.reminderText}>{reminderTask}</Text>
          </View>
        )}
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
            {showColors && memoryStarted
              ? `Memorize: ${colorSequence.join(' - ')}`
              : isPuzzleStarted
              ? 'Enter the color sequence (no spaces)'
              : 'Memory sequence will appear after you start'}
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
    padding: 24,
    paddingTop: 10,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    marginHorizontal: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#38bdf8',
    marginBottom: 16,
  },
  puzzleText: {
    fontSize: 18,
    color: '#e2e8f0',
    fontWeight: '500',
    marginBottom: 14,
    textAlign: 'center',
  },
  scrambledWord: {
    fontSize: 22,
    fontWeight: '700',
    color: '#38bdf8',
  },
  input: {
    width: 240,
    backgroundColor: '#1e293b',
    color: '#f1f5f9',
    borderColor: '#38bdf8',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    marginTop: 8,
    textAlign: 'center',
  },
  hint: {
    color: '#f87171',
    marginTop: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  controlButtons: {
    flexDirection: 'row',
    marginTop: 32,
    justifyContent: 'space-evenly',
    width: '100%',
  },
  snoozeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  stopButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    shadowColor: '#f87171',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  controlButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  refreshButton: {
    marginTop: 22,
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    borderColor: '#38bdf8',
    borderWidth: 1.2,
  },
  refreshText: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '600',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgb(11, 32, 77)',
    zIndex: 10,
    
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  blurText: {
    paddingHorizontal: 24,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20, // optional: adds spacing between lines (requires RN >= 0.71)
  },
  
  blurLine: {
    color: 'aqua',
    fontSize: 27,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 32,
  },
  tapanywhere: {
      color: 'white',
      fontSize: 17,
      fontWeight: '200',
      textAlign: 'center',
      lineHeight: 32,

  },
  
  optionButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    margin: 6,
    borderRadius: 8,
    borderColor: '#38bdf8',
    borderWidth: 1.2,
    minWidth: 80,
    alignItems: 'center',
  },
  optionText: {
    color: '#38bdf8',
    fontWeight: '600',
    fontSize: 15,
  },
  reminderContainer: {

    padding: 12,

    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  borderColor: '#38bdf8',
   borderWidth: 1.5,
    borderRadius: 10,
  },
  reminderText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

