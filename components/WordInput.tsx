
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, MicOff } from 'lucide-react';
import { Button } from './Button';

interface WordInputProps {
  onSubmit: (word: string) => void;
  isLoading: boolean;
  disabled: boolean;
  requiredLetter: string | null;
}

export const WordInput: React.FC<WordInputProps> = ({ onSubmit, isLoading, disabled, requiredLetter }) => {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'id-ID';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const word = transcript.trim().split(' ')[0]; // Take the first word only
        setInputValue(word);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Browser kamu tidak mendukung fitur suara.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInputValue('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-slate-800 rounded-2xl shadow-xl border border-slate-700">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={disabled || isLoading}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder={requiredLetter ? `Ketik kata berawalan '${requiredLetter.toUpperCase()}'...` : "Ketik kata pertama..."}
            autoFocus
          />
        </div>
        
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled || isLoading}
          className={`p-3 rounded-xl transition-all border ${
            isListening 
              ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' 
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600'
          }`}
          title="Gunakan Suara"
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <Button 
          type="submit" 
          disabled={!inputValue.trim() || disabled || isLoading}
          isLoading={isLoading}
          className="!px-4"
        >
          <Send size={24} />
        </Button>
      </form>
    </div>
  );
};
