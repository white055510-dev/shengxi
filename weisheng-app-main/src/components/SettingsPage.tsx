import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Globe, Bell, Database, Info, LogOut, Save, Trash2, Download, Upload } from 'lucide-react';
import { AppState, NoiseLevel } from '../types';
import UserAvatar from './UserAvatar';
import PolicyModal from './PolicyModal';

interface SettingsPageProps {
  state: AppState;
  t: any;
  onBack: () => void;
  onUpdateNickname: (name: string) => void;
  onLogout: () => void;
  onSetSensitivity: (lvl: NoiseLevel) => void;
  onToggleLanguage: () => void;
  onUpdateNoiseReduction: (val: number) => void;
}

export default function SettingsPage({ 
  state, t, onBack, onUpdateNickname, onLogout, onSetSensitivity, onToggleLanguage, onUpdateNoiseReduction 
}: SettingsPageProps) {
  const [nickname, setNickname] = useState(state.user?.nickname || '');
  const [showPolicy, setShowPolicy] = useState(false);
  const [policyType, setPolicyType] = useState<'privacy' | 'terms'>('privacy');

  const handleExport = () => {
    const data = { voiceprints: [] }; // Mock export
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shengxi_voiceprints.json';
    a.click();
  };

  const openPolicy = (type: 'privacy' | 'terms') => {
    setPolicyType(type);
    setShowPolicy(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col pt-12 pb-8 px-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center text-white/40 hover:text-white transition-colors group">
          <ChevronLeft className="w-6 h-6 mr-1 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">{t.login.back}</span>
        </button>
        <h1 className="text-lg font-bold text-white uppercase tracking-widest">{t.settings.title}</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="space-y-6">
        {/* Account Section - REMOVED FOR BREVITY IN ReplacementChunk but I should keep the whole file structure */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-4">{t.settings.account}</h2>
          <div className="glass-card rounded-[24px] p-4 space-y-4">
            <div className="flex items-center space-x-4">
              <UserAvatar person={state.user} size={48} />
              <div className="flex-1">
                <p className="text-xs text-white/40">{t.settings.email}</p>
                <p className="text-white font-medium">{state.user?.email}</p>
              </div>
            </div>
            <div className="space-y-1.5 px-1">
              <label className="text-[10px] font-bold text-white/20 uppercase">{t.settings.nickname}</label>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-bronze/50"
                />
                <button 
                  onClick={() => onUpdateNickname(nickname)}
                  className="bg-brand-bronze/20 text-brand-bronze px-4 rounded-xl text-xs font-bold"
                >
                  {t.settings.save}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Voiceprint Section */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-4">{t.settings.voiceprint}</h2>
          <div className="glass-card rounded-[24px] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-brand-bronze" />
                <span className="text-white font-medium">{t.settings.voiceprint}</span>
              </div>
              <span className="text-[10px] font-bold text-brand-bronze bg-brand-bronze/10 px-2 py-1 rounded-full uppercase">
                {t.dashboard.voiceprintStatus.trained}
              </span>
            </div>
            
            <div className="flex bg-white/5 rounded-xl p-1">
              {(['Relaxed', 'Standard', 'Strict'] as NoiseLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onSetSensitivity(lvl)}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                    state.noiseSensitivity === lvl ? 'bg-brand-bronze text-white shadow-lg' : 'text-white/30'
                  }`}
                >
                  {t.recording.sensitivityLevels[lvl]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Language Section */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-4">{t.settings.preference}</h2>
          <div className="glass-card rounded-[24px]">
            <button onClick={onToggleLanguage} className="w-full flex items-center justify-between p-4 px-5 active:bg-white/5">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-brand-bronze/60" />
                <span className="text-white font-medium">{t.settings.language}</span>
              </div>
              <span className="text-brand-bronze text-sm font-bold">{t.me.langDisplay}</span>
            </button>
          </div>
        </section>

        {/* Call Settings Section */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-4">{t.settings.callSettings}</h2>
          <div className="glass-card rounded-[24px] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-brand-bronze/60" />
                <span className="text-white font-medium">{t.settings.defaultNoise}</span>
              </div>
              <span className="text-brand-bronze font-mono">{state.noiseReduction}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="100"
              value={state.noiseReduction}
              onChange={(e) => onUpdateNoiseReduction(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none accent-brand-bronze"
            />
          </div>
        </section>

        {/* Data Section */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-4">{t.settings.data}</h2>
          <div className="glass-card rounded-[24px]">
            <button onClick={handleExport} className="w-full flex items-center p-4 px-5 active:bg-white/5 border-b border-white/5">
              <Download className="w-5 h-5 text-brand-bronze/60 mr-4" />
              <span className="text-white/80 flex-1">{t.settings.export}</span>
            </button>
            <button className="w-full flex items-center p-4 px-5 active:bg-white/5 border-b border-white/5">
              <Upload className="w-5 h-5 text-brand-bronze/60 mr-4" />
              <span className="text-white/80 flex-1">{t.settings.import}</span>
            </button>
            <button className="w-full flex items-center p-4 px-5 active:bg-white/5 text-red-400">
              <Trash2 className="w-5 h-5 mr-4" />
              <span className="flex-1 font-bold">{t.settings.clear}</span>
            </button>
          </div>
        </section>

        {/* About Section */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-4">{t.settings.about}</h2>
          <div className="glass-card rounded-[24px]">
            <div className="flex items-center justify-between p-4 px-5 border-b border-white/5">
              <span className="text-white/60">{t.settings.version}</span>
              <span className="text-white/40 font-mono text-xs">v4.2.1-mobile</span>
            </div>
            <button 
              onClick={() => openPolicy('privacy')}
              className="w-full text-left p-4 px-5 border-b border-white/5 text-white/60 text-sm hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              {t.settings.privacy}
            </button>
            <button 
              onClick={() => openPolicy('terms')}
              className="w-full text-left p-4 px-5 text-white/60 text-sm hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              {t.settings.terms}
            </button>
          </div>
        </section>

        <button 
          onClick={onLogout}
          className="w-full bg-red-500/10 text-red-500 rounded-[20px] py-4 font-bold flex items-center justify-center space-x-2 border border-red-500/20"
        >
          <LogOut className="w-5 h-5" />
          <span>{t.settings.logout}</span>
        </button>
      </div>

      <div className="text-center py-12">
        <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.3em]">{t.login.poweredBy}</p>
      </div>

      <PolicyModal 
        isOpen={showPolicy} 
        onClose={() => setShowPolicy(false)} 
        language={state.language}
        type={policyType}
      />
    </div>
  );
}
