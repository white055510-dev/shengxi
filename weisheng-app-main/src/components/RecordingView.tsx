import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, RotateCcw, Save, Activity, Mic } from 'lucide-react';
import { AppState, NoiseLevel } from '../types';
import { audioEngine } from '../services/audioEngine';
import { db } from '../db/database';

interface RecordingViewProps {
  state: AppState;
  t: any;
  onFinish: (success: boolean) => void;
  onSetSensitivity: (lvl: NoiseLevel) => void;
}

export default function RecordingView({ state, t, onFinish, onSetSensitivity }: RecordingViewProps) {
  const [recordingLanguage, setRecordingLanguage] = useState<'zh' | 'en'>(state.language);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [recorded, setRecorded] = useState(false);
  const [circles, setCircles] = useState<{ id: number; scale: number; opacity: number }[]>([]);
  const [voiceprintData, setVoiceprintData] = useState<Float32Array | null>(null);

  useEffect(() => {
    if (isRecording && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isRecording && countdown === 0) {
      setIsRecording(false);
      setRecorded(true);
    }
  }, [isRecording, countdown]);

  // Particle/Circle Animation for Siri-like effect
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setCircles(prev => [
          ...prev.slice(-15),
          { id: Date.now(), scale: 0.5, opacity: 0.8 }
        ]);
      }, 200);
      return () => clearInterval(interval);
    } else {
      setCircles([]);
    }
  }, [isRecording]);

  const handleStart = async () => {
    try {
      setIsRecording(true);
      setCountdown(5);
      setRecorded(false);
      
      // Start real recording
      const template = await audioEngine.recordVoiceprint(5000);
      setVoiceprintData(template);
      audioEngine.stopMicrophone();
    } catch (err) {
      console.error('Failed to record:', err);
      setIsRecording(false);
    }
  };

  const handleSave = async () => {
    if (voiceprintData && state.selectedContact) {
      const now = new Date();
      // Save voiceprint to dedicated table (raw data)
      await db.voiceprints.add({
        contactId: state.selectedContact.id,
        data: voiceprintData,
        noiseLevel: state.noiseSensitivity,
        createdAt: now
      });

      // Update contact status and recorded time + feature vector
      await db.contacts.update(state.selectedContact.id, {
        voiceprintStatus: 'trained',
        recordedAt: now.toISOString(),
        voiceprintFeature: voiceprintData
      });

      onFinish(true);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center w-full h-full p-8 bg-brand-bg-dark">
      <div className="paper-texture opacity-20" />
      <div className="absolute top-8 left-8 z-20">
        <button 
          onClick={() => {
            audioEngine.stopMicrophone();
            onFinish(false);
          }}
          className="flex items-center text-sm font-medium text-white/40 hover:text-white transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
          {t.login.back}
        </button>
      </div>

      <div className="absolute top-8 right-8 z-20">
        <h1 className="text-sm font-bold text-white uppercase tracking-widest opacity-40">{t.recording.title}</h1>
      </div>

      <div className="flex-1 w-full max-w-lg flex flex-col items-center justify-between py-6 h-full overflow-hidden">
        {/* Language Selection */}
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 z-10 shrink-0">
          {(['zh', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setRecordingLanguage(lang)}
              disabled={isRecording}
              className={`px-8 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-widest ${
                recordingLanguage === lang ? 'bg-brand-bronze text-white shadow-lg' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {lang === 'zh' ? '中文' : 'English'}
            </button>
          ))}
        </div>

        {/* Siri Style Waveform / Animation Area */}
        <div className="relative w-60 h-60 flex items-center justify-center shrink-0 my-4">
           {/* Pulsing background layers */}
           <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                animate={isRecording ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1]
                } : {}}
                transition={{ repeat: Infinity, duration: 4 }}
                className="w-full h-full rounded-full bg-brand-bronze/10 blur-3xl"
              />
           </div>

           <AnimatePresence>
             {isRecording && circles.map((circle) => (
               <motion.div
                 key={circle.id}
                 initial={{ scale: 0.5, opacity: 0, border: '2px solid rgba(166, 137, 102, 0.3)' }}
                 animate={{ scale: 2.5, opacity: 0 }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
                 className="absolute w-40 h-40 rounded-full"
               />
             ))}
           </AnimatePresence>

           <div className={`relative z-10 w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 ${
             isRecording ? 'scale-110' : ''
           }`}>
             {/* Progress Circle for Countdown */}
             {isRecording && (
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle
                   cx="96"
                   cy="96"
                   r="92"
                   fill="none"
                   stroke="rgba(166, 137, 102, 0.1)"
                   strokeWidth="4"
                 />
                 <motion.circle
                   cx="96"
                   cy="96"
                   r="92"
                   fill="none"
                   stroke="#A68966"
                   strokeWidth="4"
                   strokeDasharray="578"
                   initial={{ strokeDashoffset: 578 }}
                   animate={{ strokeDashoffset: (countdown / 5) * 578 }}
                   transition={{ duration: 1, ease: 'linear' }}
                   strokeLinecap="round"
                 />
               </svg>
             )}

             <div className={`w-40 h-40 rounded-full shadow-2xl flex items-center justify-center transition-all ${
               isRecording ? 'bg-brand-bronze shadow-brand-bronze/40' : 'bg-white/5 border border-white/10'
             }`}>
               {isRecording ? (
                  <div className="flex flex-col items-center">
                    <span className="text-6xl font-bold text-white mb-1 font-mono">{countdown}</span>
                    <Activity className="w-5 h-5 text-white/50 animate-pulse" />
                  </div>
               ) : (
                  <button
                    onClick={handleStart}
                    disabled={recorded}
                    className="w-full h-full rounded-full flex flex-col items-center justify-center group"
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-500 shadow-xl ${
                      recorded ? 'bg-cyan-500/20 text-cyan-500' : 'bg-white/10 text-white group-hover:scale-110'
                    }`}>
                      {recorded ? <Activity className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                      {recorded ? t.recording.analyzed : t.recording.startBtn}
                    </span>
                  </button>
               )}
             </div>
           </div>
        </div>

        {/* Text Area */}
        <div className="w-full space-y-4 text-center z-10 shrink-0">
          <div className="glass-card px-8 py-6 rounded-[24px] border border-white/10 bg-white/[0.02] shadow-2xl max-h-[160px] overflow-y-auto no-scrollbar">
            <motion.p 
              key={recordingLanguage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-medium text-white leading-relaxed"
            >
              "{t.recording.readingTexts[recordingLanguage]}"
            </motion.p>
          </div>
          <p className="text-[10px] text-[#7B876D] uppercase tracking-[0.3em] font-bold">{t.recording.instruction}</p>
        </div>

        {/* Controls and sensitivity */}
        <div className="w-full space-y-4 pt-2 shrink-0 flex flex-col items-center">
          <AnimatePresence>
            {recorded && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center space-x-3 w-full"
              >
                <button 
                  onClick={handleStart}
                  className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.recording.rerecord}</span>
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 h-14 rounded-2xl bg-[#00d4ff] text-black font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-[#00d4ff]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.recording.save}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full flex flex-col items-center space-y-3">
             <div className="w-8 h-0.5 bg-white/10 rounded-full" />
             <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">{t.recording.noiseSensitivity}</p>
             <div className="flex w-full space-x-1.5 bg-white/5 p-1 rounded-2xl border border-white/5">
                {(['Relaxed', 'Standard', 'Strict'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => onSetSensitivity(lvl)}
                    disabled={isRecording}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                      state.noiseSensitivity === lvl ? 'bg-brand-bronze text-white shadow-lg' : 'text-white/20'
                    }`}
                  >
                    {t.recording.sensitivityLevels[lvl]}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
