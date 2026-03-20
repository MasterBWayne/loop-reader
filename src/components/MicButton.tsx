'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface MicButtonProps {
  currentText: string;
  onTextChange: (newText: string) => void;
  className?: string;
}

export function MicButton({ currentText, onTextChange, className = '' }: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  
  const currentTextRef = useRef(currentText);
  const onTextChangeRef = useRef(onTextChange);
  const startTextRef = useRef<string>('');

  useEffect(() => {
    currentTextRef.current = currentText;
  }, [currentText]);

  useEffect(() => {
    onTextChangeRef.current = onTextChange;
  }, [onTextChange]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      startTextRef.current = currentTextRef.current;
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const transcript = finalTranscript || interimTranscript;
      if (transcript) {
        const baseText = startTextRef.current;
        const prefix = baseText ? baseText + (baseText.endsWith(' ') ? '' : ' ') : '';
        onTextChangeRef.current(prefix + transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []); // Run once on mount

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recording', e);
      }
    }
  }, [isRecording]);

  if (!isSupported) return null;

  return (
    <div className={`group flex flex-col items-center relative ${className}`}>
      <button
        type="button"
        onClick={toggleRecording}
        className={`p-2 rounded-full transition-colors flex items-center justify-center ${
          isRecording 
            ? 'bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
            : 'text-gold hover:bg-gold/10'
        }`}
        title={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording && (
          <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>
      
      {isRecording ? (
        <span className="text-[10px] text-red-500/80 mt-1 absolute top-full right-0 whitespace-nowrap pointer-events-none">
          Speak clearly, tap to stop
        </span>
      ) : (
        <span className="text-[10px] text-gold/60 mt-1 absolute top-full right-0 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Tap to speak
        </span>
      )}
    </div>
  );
}
