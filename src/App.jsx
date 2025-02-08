import React, { useState, useEffect, useRef } from 'react';

function Key({ note, isSharp, playSound, stopSound, keyboardKey }) {
  const keyRef = useRef(null);
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = () => {
    setIsPressed(true);
    playSound(note);
  };

  const handlePointerUp = () => {
    setIsPressed(false);
    stopSound(note);
  };

  const handlePointerLeave = () => {
    setIsPressed(false);
    stopSound(note);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === keyboardKey) {
        if (!isPressed) {
          setIsPressed(true);
          playSound(note);
        }
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === keyboardKey) {
        setIsPressed(false);
        stopSound(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playSound, stopSound, note, isPressed, keyboardKey]);

  return (
    <div
      ref={keyRef}
      className={`key ${isSharp ? 'sharp-key' : 'white-key'} ${isPressed ? 'pressed' : ''} ${isSharp ? 'ml-[-10px] z-10' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {!isSharp && <div className="note-label">{note.toUpperCase()}</div>}
      <div className="keyboard-label">{keyboardKey.toUpperCase()}</div>
    </div>
  );
}

function SynthKeyboard() {
  const audioContextRef = useRef(null);
  const oscillatorsRef = useRef({});
  const gainNodesRef = useRef({}); // Ref to store gain nodes

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    oscillatorsRef.current = {};
    gainNodesRef.current = {}; // Initialize gainNodesRef
  }, []);

  const playSound = (note) => {
    if (!audioContextRef.current) return;

    const freqMap = {
      'C4': 261.63,
      'D4': 293.66,
      'E4': 329.63,
      'F4': 349.23,
      'G4': 392.00,
      'A4': 440.00,
      'B4': 493.88,
      'C#4': 277.18,
      'D#4': 311.13,
      'F#4': 369.99,
      'G#4': 415.30,
      'A#4': 466.16,
    };

    if (oscillatorsRef.current[note]) {
      return; // Already playing
    }

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain(); // Create gain node

    oscillator.type = 'sawtooth'; // Changed to sawtooth for a richer sound
    oscillator.frequency.setValueAtTime(freqMap[note] || 440, audioContextRef.current.currentTime);

    // ADSR Envelope (Attack-Decay-Sustain-Release) - simplified
    const attackTime = 0.05;  // Short attack
    const decayTime = 0.1;   // Short decay
    const sustainLevel = 0.7; // Sustain volume level (0 to 1)
    const releaseTime = 0.3; // Release time

    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime); // Start at zero volume
    gainNode.gain.linearRampToValueAtTime(0.8, audioContextRef.current.currentTime + attackTime); // Attack to full volume
    gainNode.gain.exponentialRampToValueAtTime(sustainLevel * 0.8, audioContextRef.current.currentTime + attackTime + decayTime); // Decay to sustain level


    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.start();

    oscillatorsRef.current[note] = oscillator;
    gainNodesRef.current[note] = gainNode; // Store gain node
  };

  const stopSound = (note) => {
    if (oscillatorsRef.current[note]) {
      const gainNode = gainNodesRef.current[note];
      const releaseTime = 0.3;
      gainNode.gain.cancelScheduledValues(audioContextRef.current.currentTime); // Cancel any ongoing volume changes
      gainNode.gain.setValueAtTime(gainNode.gain.value, audioContextRef.current.currentTime); // Start release from current volume
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + releaseTime); // Exponential release

      setTimeout(() => {
        oscillatorsRef.current[note].stop(audioContextRef.current.currentTime);
        delete oscillatorsRef.current[note];
        delete gainNodesRef.current[note]; // Remove gain node from ref
      }, releaseTime * 1000); // Stop and cleanup after release
    }
  };


  const keys = [
    { note: "C4", keyboardKey: "z", isSharp: false },
    { note: "C#4", keyboardKey: "s", isSharp: true },
    { note: "D4", keyboardKey: "x", isSharp: false },
    { note: "D#4", keyboardKey: "d", isSharp: true },
    { note: "E4", keyboardKey: "c", isSharp: false },
    { note: "F4", keyboardKey: "v", isSharp: false },
    { note: "F#4", keyboardKey: "g", isSharp: true },
    { note: "G4", keyboardKey: "b", isSharp: false },
    { note: "G#4", keyboardKey: "h", isSharp: true },
    { note: "A4", keyboardKey: "n", isSharp: false },
    { note: "A#4", keyboardKey: "j", isSharp: true },
    { note: "B4", keyboardKey: "m", isSharp: false },
    { note: "C5", keyboardKey: ",", isSharp: false },
  ];


  return (
    <div className="synth-container bg-gradient-to-br from-purple-400 to-blue-500 p-8 rounded-lg shadow-xl flex justify-center items-center h-screen">
      <div className="keyboard">
        {keys.map((key, index) => (
          <Key
            key={index}
            note={key.note}
            isSharp={key.isSharp}
            playSound={playSound}
            stopSound={stopSound}
            keyboardKey={key.keyboardKey}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <SynthKeyboard />
  );
}

export default App;
