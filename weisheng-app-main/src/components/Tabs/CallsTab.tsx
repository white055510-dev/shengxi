import React from 'react';
import { motion } from 'framer-motion';
import { PhoneOutgoing, PhoneIncoming, PhoneMissed, MoreHorizontal, Plus, Grid } from 'lucide-react';

interface CallsTabProps {
  onAddContact: () => void;
  onOpenDialPad: () => void;
  t: any;
}

const MOCK_CALLS = [
  { id: 1, name: 'Alisa Wang', duration: '12:45', time: '14:20', type: 'outgoing', quality: 'VoiceLock Active' },
  { id: 2, name: 'David Chen', duration: '08:12', time: 'Yesterday', type: 'incoming', quality: 'VoiceLock Active' },
  { id: 3, name: 'Sarah Miller', duration: '00:00', time: '2 Days ago', type: 'missed', quality: '-' },
];

export default function CallsTab({ onAddContact, onOpenDialPad, t }: CallsTabProps) {
  return (
    <div className="relative min-h-[calc(100vh-180px)]">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">{t.dashboard.recentCalls}</h2>

        <div className="space-y-3">
          {MOCK_CALLS.map((call, idx) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center space-x-4 p-4 grayscale-[0.2]"
            >
              <div className={`p-3 rounded-2xl ${call.type === 'missed' ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-white/40'}`}>
                {call.type === 'incoming' && <PhoneIncoming className="w-5 h-5" />}
                {call.type === 'outgoing' && <PhoneOutgoing className="w-5 h-5" />}
                {call.type === 'missed' && <PhoneMissed className="w-5 h-5" />}
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${call.type === 'missed' ? 'text-red-400' : 'text-white/90'}`}>{call.name}</h3>
                  <span className="text-xs text-white/30">{call.time}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    {call.quality === 'VoiceLock Active' ? t.dashboard.voiceLock : '-'}
                  </span>
                  <span className="text-xs text-white/40">{call.duration}</span>
                </div>
              </div>
              
              <button className="p-2 text-white/20 hover:text-white/50 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-28 right-8 flex flex-col space-y-4 items-end z-30">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOpenDialPad}
          className="w-14 h-14 rounded-full bg-white/10 text-white shadow-xl flex items-center justify-center backdrop-blur-md border border-white/10"
        >
          <Grid className="w-6 h-6" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddContact}
          className="w-14 h-14 rounded-full bg-brand-bronze text-white shadow-2xl shadow-brand-bronze/40 flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full bg-brand-bronze animate-ping opacity-20" />
          <Plus className="w-7 h-7 relative z-10" strokeWidth={3} />
        </motion.button>
      </div>
    </div>
  );
}
