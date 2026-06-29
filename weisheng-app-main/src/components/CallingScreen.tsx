import React from 'react';
import { PhoneOff, MicOff, Volume2, Shield, MoreHorizontal, Settings2, MicOff as MicOffIcon, SignalHigh } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact, NoiseLevel } from '../types';
import WaveformVisualizer from './WaveformVisualizer';
import { audioEngine } from '../services/audioEngine';
import UserAvatar from './UserAvatar';
import { webrtcService, CallStatus } from '../services/webrtcService';

interface CallingScreenProps {
  contact: Contact;
  isFilterOn: boolean;
  onToggleFilter: () => void;
  onEndCall: () => void;
  noiseReduction: number;
  onNoiseChange: (val: number) => void;
  noiseSensitivity: NoiseLevel;
  onSetSensitivity: (lvl: NoiseLevel) => void;
  t: any;
  roomId?: string;
  isLoopback?: boolean;
}

export default function CallingScreen({ 
  contact, isFilterOn, onToggleFilter, onEndCall, 
  noiseReduction, onNoiseChange, noiseSensitivity, onSetSensitivity, t,
  roomId = "123456", isLoopback = true
}: CallingScreenProps) {
  
  const [realTimeSimilarity, setRealTimeSimilarity] = React.useState(1.0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [callStatus, setCallStatus] = React.useState<CallStatus>('idle');
  const [timer, setTimer] = React.useState(0);
  const [remoteStream, setRemoteStream] = React.useState<MediaStream | null>(null);
  const remoteAudioRef = React.useRef<HTMLAudioElement>(null);
  
  React.useEffect(() => {
    // WebRTC Setup
    webrtcService.setHandlers(
      (status) => setCallStatus(status),
      (stream) => setRemoteStream(stream)
    );

    webrtcService.startCall(roomId, isLoopback);

    return () => {
      webrtcService.endCall();
    };
  }, [roomId, isLoopback]);

  React.useEffect(() => {
    if (callStatus === 'connected') {
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [callStatus]);

  React.useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  React.useEffect(() => {
    // Initialize audio engine for this call
    if (contact.voiceprintFeature) {
      audioEngine.setVoiceprintTemplate(contact.voiceprintFeature);
    }
    
    // Set sensitivity based on level
    const thresholds = { 'Relaxed': 0.65, 'Standard': 0.75, 'Strict': 0.85 };
    audioEngine.setThreshold(thresholds[noiseSensitivity]);
    audioEngine.setNoiseReduction(noiseReduction / 100);

    if (isFilterOn) {
      audioEngine.startMicrophone().then(() => {
        audioEngine.startRealTimeProcessing((similarity, muted) => {
          setRealTimeSimilarity(similarity);
          setIsMuted(muted);
        });
      });
    }

    return () => {
      audioEngine.stopRealTimeProcessing();
    };
  }, [contact, isFilterOn, noiseSensitivity]);

  React.useEffect(() => {
    audioEngine.setNoiseReduction(noiseReduction / 100);
  }, [noiseReduction]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col pt-16 pb-20 px-8">
      {/* Header */}
      <div className="text-center space-y-2 mb-12 relative">
        <div className="absolute left-0 top-1">
          <SignalHigh className="w-4 h-4 text-brand-bronze opacity-50" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{contact.name}</h1>
        <div className="flex flex-col items-center">
            <p className="text-brand-bronze text-sm font-medium animate-pulse">
                {callStatus === 'connected' 
                    ? new Date(timer * 1000).toISOString().substr(14, 5) 
                    : t.calling[callStatus] || callStatus}
            </p>
            {isLoopback && (
                <span className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Loopback Test Mode</span>
            )}
        </div>
      </div>

      {/* Hidden Remote Audio */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Center Avatar & Soundwave */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Pulsing Aura */}
          <AnimatePresence>
            {isFilterOn && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0.3 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-brand-bronze rounded-full blur-3xl"
              />
            )}
          </AnimatePresence>

          <div className={`relative z-10 w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden ${
            isFilterOn ? (isMuted ? 'ring-2 ring-red-500 scale-95 opacity-50' : 'ring-2 ring-brand-bronze ring-offset-4 ring-offset-black scale-100') : 'ring-2 ring-white/5 ring-offset-4 ring-offset-black'
          }`}>
            <UserAvatar 
              person={contact} 
              size={180} 
              showBorder={false}
              className={`grayscale-[0.5] ${isFilterOn && !isMuted ? 'grayscale-0' : ''}`} 
            />
            {isFilterOn && isMuted && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                <MicOff className="w-12 h-12 text-red-500" />
              </div>
            )}
          </div>

          <div className="absolute top-0 right-0 z-20">
            <button
              onClick={onToggleFilter}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all relative ${
                isFilterOn ? 'bg-brand-bronze text-white shadow-lg shadow-brand-bronze/40' : 'bg-white/10 text-white/40'
              }`}
            >
              <Shield className={`w-6 h-6 ${isFilterOn ? 'animate-pulse' : ''}`} />
              {isFilterOn && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className={`text-[10px] font-bold font-mono ${isMuted ? 'text-red-500' : 'text-brand-bronze'}`}>
                    {Math.round(realTimeSimilarity * 100)}%
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="w-full max-w-xs mt-12 h-16 opacity-50">
          <WaveformVisualizer active={isFilterOn} type="clean" />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-8">
        {/* Slider */}
        {isFilterOn && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-3xl p-6 border border-white/5"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t.calling.noiseLevel}</span>
              <span className="text-brand-bronze font-mono text-sm">{noiseReduction}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="100"
              value={noiseReduction}
              onChange={(e) => onNoiseChange(parseInt(e.target.value))}
              className="w-full accent-brand-bronze h-1 bg-white/10 rounded-full appearance-none"
            />
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-6">
          <button className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 transition-all border border-white/10">
            <MicOff className="w-6 h-6" />
          </button>

          <button 
            onClick={onEndCall}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all"
          >
            <PhoneOff className="w-8 h-8" strokeWidth={2.5} />
          </button>

          <button className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 transition-all border border-white/10">
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
