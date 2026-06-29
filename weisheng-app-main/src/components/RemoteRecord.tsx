import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, CheckCircle2, RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { io, Socket } from 'socket.io-client';
import WaveformVisualizer from './WaveformVisualizer';
import { API_BASE } from '../constants';

interface RemoteRecordProps {
  t: any;
  token: string;
  contactId: string;
}

export default function RemoteRecord({ t, token, contactId }: RemoteRecordProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to signaling server to send data back to the app
    socketRef.current = io(API_BASE);
    socketRef.current.emit('join-room', token);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  const startRecording = async () => {
    try {
      setStatus('recording');
      setError('');
      setProgress(0);

      // Simple progress timer
      const duration = 5000;
      const interval = 50;
      let elapsed = 0;
      const timer = setInterval(() => {
        elapsed += interval;
        setProgress(Math.min((elapsed / duration) * 100, 100));
        if (elapsed >= duration) clearInterval(timer);
      }, interval);

      // Record voiceprint (extracts MFCC)
      const feature = await audioEngine.recordVoiceprint(duration);
      
      setStatus('processing');
      
      // Convert Float32Array to regular array for socket transfer
      const dataArray = Array.from(feature);
      
      // Send data to the app through the room
      if (socketRef.current) {
        socketRef.current.emit('signal', {
          roomId: token,
          data: {
            type: 'voiceprint-upload',
            contactId,
            feature: dataArray
          }
        });
      }

      setStatus('done');
    } catch (err: any) {
      console.error('Recording failed:', err);
      setError(err.message || '录音失败，请检查麦克风权限');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-8 text-center">
      <div className="absolute top-12 left-1/2 -translate-x-1/2">
        <div className="flex items-center space-x-2 text-brand-bronze opacity-50">
          <Shield className="w-5 h-5 fill-current" />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Secure Voice Provision</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'error' || status === 'recording' || status === 'processing' ? (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 w-full flex flex-col items-center"
          >
            {/* Header section (only for idle/error) */}
            <AnimatePresence mode="wait">
              {(status === 'idle' || status === 'error') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 mb-4 overflow-hidden"
                >
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    {status === 'error' ? '出错了' : '验证您的身份'}
                  </h1>
                  <p className="text-white/40 leading-relaxed max-w-xs mx-auto">
                    {status === 'error' ? error : '请点击下方按钮并大声朗读指定文本以完成声纹绑定。'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reading Text Section - Always visible during recording */}
            <div className={`transition-all duration-500 w-full ${
              (status === 'recording' || status === 'processing') ? 'opacity-60 scale-95' : ''
            }`}>
              {(status === 'recording' || status === 'processing') && (
                <p className="text-[10px] font-bold text-brand-bronze uppercase tracking-[0.2em] mb-4">
                  请朗读以下文本
                </p>
              )}
              <div className="py-6 px-4 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-1 h-full bg-brand-bronze/40 group-hover:bg-brand-bronze transition-colors" />
                 <p className={`${(status === 'recording' || status === 'processing') ? 'text-sm' : 'text-lg'} text-white font-medium leading-loose`}>
                   「声隙 AI 为我提供最纯净的通话体验，让沟通无拘无束。」
                 </p>
              </div>
            </div>

            {/* Mic / Progress Section */}
            <div className="relative w-full flex flex-col items-center justify-center pt-4">
              <AnimatePresence mode="wait">
                {(status === 'idle' || status === 'error') ? (
                  <motion.div
                    key="idle-btn"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex justify-center items-center w-full"
                  >
                    <button
                      onClick={startRecording}
                      className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 relative group ${
                        status === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-brand-bronze text-white shadow-2xl shadow-brand-bronze/40'
                      }`}
                    >
                      <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 rounded-full border border-white/20 scale-150 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="active-progress"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="flex flex-col items-center space-y-8"
                  >
                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="90"
                          fill="none"
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="4"
                        />
                        <motion.circle
                          cx="96"
                          cy="96"
                          r="90"
                          fill="none"
                          stroke="#A68966"
                          strokeWidth="4"
                          strokeDasharray="565.48"
                          animate={{ strokeDashoffset: 565.48 - (565.48 * progress) / 100 }}
                          transition={{ ease: "linear" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          <Mic className="w-12 h-12 text-brand-bronze animate-pulse" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-white">
                        {status === 'recording' ? '正在采样...' : '正在分析特征...'}
                      </h2>
                      <div className="h-1 w-32 bg-white/5 rounded-full mx-auto overflow-hidden">
                        <motion.div 
                           className="h-full bg-brand-bronze"
                           animate={{ width: status === 'processing' ? '100%' : `${progress}%` }}
                        />
                      </div>
                      <p className="text-white/40 text-xs italic">
                        请保持朗读直到采样圆环闭合
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {(status === 'idle' || status === 'error') && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-bold text-white/20 uppercase tracking-widest"
                >
                  {status === 'error' ? '点击重试' : '点击开始录制'}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            key="done"
            initial={{ opacity: 0, zoom: 0.5 }}
            animate={{ opacity: 1, zoom: 1 }}
            className="space-y-8"
          >
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">声纹已发送</h1>
              <p className="text-white/40 leading-relaxed">
                感谢您的配合，声纹特征已安全传回邀请方。现在您可以关闭此页面。
              </p>
            </div>
            
            <div className="pt-12">
              <p className="text-[10px] text-white/10 uppercase font-bold tracking-[0.3em]">
                Verified by Shengxi AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
