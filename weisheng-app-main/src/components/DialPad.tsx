import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, Delete as Backspace } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Contact } from '../types';
import UserAvatar from './UserAvatar';

interface DialPadProps {
  isOpen: boolean;
  onClose: () => void;
  onCall: (number: string) => void;
  t: any;
}

export default function DialPad({ isOpen, onClose, onCall, t }: DialPadProps) {
  const [number, setNumber] = useState('');
  const [suggestion, setSuggestion] = useState<Contact | null>(null);
  const backspaceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const contacts = useLiveQuery(() => db.contacts.toArray()) || [];

  useEffect(() => {
    if (number.length > 1) {
      const cleanedNum = number.replace(/\D/g, '');
      const match = contacts.find(c => 
        c.id.replace(/\D/g, '').includes(cleanedNum) || 
        c.name.toLowerCase().includes(number.toLowerCase())
      );
      setSuggestion(match || null);
    } else {
      setSuggestion(null);
    }
  }, [number, contacts]);

  const keys = [
    { main: '1', sub: ' ' }, { main: '2', sub: 'ABC' }, { main: '3', sub: 'DEF' },
    { main: '4', sub: 'GHI' }, { main: '5', sub: 'JKL' }, { main: '6', sub: 'MNO' },
    { main: '7', sub: 'PQRS' }, { main: '8', sub: 'TUV' }, { main: '9', sub: 'WXYZ' },
    { main: '*', sub: ' ' }, { main: '0', sub: '+' }, { main: '#', sub: ' ' }
  ];

  const formatDisplay = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7, 11)}`;
  };

  const addDigit = (digit: string) => {
    if (number.length < 11) setNumber(prev => prev + digit);
  };

  const removeDigit = () => {
    setNumber(prev => prev.slice(0, -1));
  };

  const handleBackspaceStart = () => {
    removeDigit();
    backspaceTimerRef.current = setTimeout(() => {
      setNumber('');
    }, 600);
  };

  const handleBackspaceEnd = () => {
    if (backspaceTimerRef.current) {
      clearTimeout(backspaceTimerRef.current);
    }
  };

  // Calculate font size based on number length
  const getFontSize = () => {
    if (number.length > 8) return 'text-3xl';
    return 'text-4xl md:text-5xl';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-[#0A0A0A]/95 backdrop-blur-xl"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[70] flex flex-col pt-4 pb-8 overflow-hidden touch-none"
          >
            {/* 1. Top Area (20%) - Close X + input display */}
            <div className="h-[20%] flex flex-col shrink-0 px-8 relative">
              <div className="flex justify-end pt-2">
                <div className="flex flex-col items-center">
                  <button 
                    onClick={onClose} 
                    className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">
                    关闭
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center -mt-4">
                <div className="flex items-center space-x-2 w-full justify-center relative">
                  <div className="flex-1 text-center overflow-hidden">
                    {number ? (
                      <motion.span 
                        key={number}
                        initial={{ scale: 1.05, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`${getFontSize()} font-mono text-white tracking-widest block whitespace-nowrap`}
                      >
                        {formatDisplay(number)}
                      </motion.span>
                    ) : (
                      <span className="text-xl font-medium text-white/10 tracking-widest uppercase">
                        输入号码
                      </span>
                    )}
                  </div>
                  
                  {number && (
                    <button 
                      onMouseDown={handleBackspaceStart}
                      onMouseUp={handleBackspaceEnd}
                      onTouchStart={handleBackspaceStart}
                      onTouchEnd={handleBackspaceEnd}
                      className="absolute right-0 p-2 text-white/40 hover:text-white transition-colors"
                    >
                      <Backspace className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Suggestion (Small height, centered) */}
            <div className="h-8 flex items-center justify-center shrink-0">
              <AnimatePresence mode="wait">
                {suggestion && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => {
                      const suggestedNum = suggestion.id.includes('dialed_') 
                        ? suggestion.id.replace('dialed_', '') 
                        : suggestion.id;
                      if (suggestedNum.length <= 11) setNumber(suggestedNum);
                    }}
                    className="flex items-center space-x-1.5 bg-brand-bronze/10 border border-brand-bronze/20 px-2 py-0.5 rounded-full hover:bg-brand-bronze/20 transition-all group"
                  >
                    <UserAvatar person={suggestion} size={16} showBorder={false} />
                    <span className="text-[10px] font-bold text-white group-hover:text-brand-bronze transition-colors leading-none">{suggestion.name}</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Keypad Area (55%) */}
            <div className="h-[52%] flex items-center justify-center shrink-0">
              <div className="grid grid-cols-3 gap-y-4 gap-x-5 w-full max-w-[280px] px-6">
                {keys.map((key) => (
                  <div key={key.main} className="flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => addDigit(key.main)}
                      className="w-14 h-14 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex flex-col items-center justify-center transition-all active:bg-brand-bronze/30 active:border-brand-bronze/50 group"
                    >
                      <span className="text-2xl text-white font-medium">{key.main}</span>
                      <span className="text-[7px] text-white/20 font-bold uppercase tracking-widest group-active:text-brand-bronze/60 -mt-0.5">
                        {key.sub}
                      </span>
                    </motion.button>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Bottom Call Area (25%) */}
            <div className="h-[28%] min-h-[120px] shrink-0 flex flex-col items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCall(number)}
                disabled={!number}
                className="relative w-16 h-16 rounded-full bg-[#00d4ff] flex items-center justify-center shadow-xl shadow-[#00d4ff]/20 disabled:opacity-20 disabled:grayscale transition-all"
              >
                {number && (
                  <motion.div 
                    animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-full border-2 border-[#00d4ff]"
                  />
                )}
                <Phone className="w-7 h-7 fill-[#121212] text-[#121212]" />
              </motion.button>
              <span className={`text-[10px] font-bold uppercase tracking-[0.3em] mt-4 transition-colors ${number ? 'text-[#00d4ff]' : 'text-white/10'}`}>
                {t.dashboard.callBtn}
              </span>
              <span className="text-[10px] text-[#7B876D] font-bold uppercase tracking-widest mt-1 opacity-60">
                Secure Voice Authenticated
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
