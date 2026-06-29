import React from 'react';
import { Users, Phone, User } from 'lucide-react';
import { AppState } from '../types';

interface BottomNavProps {
  activeTab: AppState['activeTab'];
  onTabChange: (tab: AppState['activeTab']) => void;
  t: any;
}

export default function BottomNav({ activeTab, onTabChange, t }: BottomNavProps) {
  const tabs = [
    { id: 'calls', icon: Phone, label: t.dashboard.tabs.calls },
    { id: 'contacts', icon: Users, label: t.dashboard.tabs.contacts },
    { id: 'me', icon: User, label: t.dashboard.tabs.me },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[84px] bg-[#1A1A1A]/90 backdrop-blur-xl border-t border-white/5 px-6 pb-2 z-40">
      <div className="flex items-center justify-around h-full max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as any)}
            className="flex flex-col items-center justify-center space-y-1.5 transition-all group relative"
          >
            <div className={`p-2 rounded-xl transition-all ${
              activeTab === tab.id ? 'text-brand-bronze' : 'text-white/30 group-hover:text-white/50'
            }`}>
              <tab.icon className="w-6 h-6" strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-bold tracking-wider uppercase transition-all ${
              activeTab === tab.id ? 'text-brand-bronze' : 'text-white/30'
            }`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div className="absolute -top-1 w-1 h-1 bg-brand-bronze rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
