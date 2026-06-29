import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Settings, ShieldCheck, LogOut, ChevronRight, Mic, Camera, Pencil, Terminal } from 'lucide-react';
import { User } from '../../types';
import UserAvatar from '../UserAvatar';
import { db } from '../../db/database';
import PolicyModal from '../PolicyModal';

interface MeTabProps {
  user: User | null;
  onUpdateUser: (updates: Partial<User>) => void;
  language: 'zh' | 'en';
  onLanguageToggle: () => void;
  onLogout: () => void;
  onStartRecording: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
  t: any;
}

export default function MeTab({ 
  user, 
  onUpdateUser, 
  language, 
  onLanguageToggle, 
  onLogout, 
  onStartRecording, 
  onOpenSettings, 
  onOpenPrivacy,
  onOpenAdmin,
  isAdmin,
  t 
}: MeTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showPolicy, setShowPolicy] = useState(false);
  const [policyType, setPolicyType] = useState<'privacy' | 'terms'>('privacy');

  const handleVersionClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 3000) {
      const nextCount = clickCount + 1;
      setClickCount(nextCount);
      if (nextCount >= 5) {
        onOpenAdmin();
        setClickCount(0);
      }
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check size (200KB limit)
    if (file.size > 2 * 1024 * 1024) { // Pre-compression limit 2MB
      alert(language === 'zh' ? '图片太大，请选择2MB以下的图片' : 'Image too large, please select one under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxSize = 500;
        let width = img.width;
        let height = img.height;

        // Calculate 1:1 crop
        const size = Math.min(width, height);
        const offsetX = (width - size) / 2;
        const offsetY = (height - size) / 2;

        canvas.width = Math.min(size, maxSize);
        canvas.height = Math.min(size, maxSize);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          
          // Final check for 200KB
          if (base64.length > 300000) { // Approx 220KB in base64
             // Lower quality if still too big
             const compressed = canvas.toDataURL('image/jpeg', 0.5);
             onUpdateUser({ avatar: compressed });
          } else {
            onUpdateUser({ avatar: base64 });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const menuItems = [
    { icon: Mic, label: t.recording.title, onClick: onStartRecording },
    { icon: Globe, label: t.me.language, onClick: onLanguageToggle },
    { icon: ShieldCheck, label: t.me.privacy, onClick: onOpenPrivacy },
    { icon: Settings, label: t.me.appSettings, onClick: onOpenSettings },
  ];

  return (
    <div className="space-y-10">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      {/* Profile Header */}
      <div className="flex flex-col items-center pt-4 space-y-4">
        <AnimatePresence>
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-1 bg-red-500 rounded-full flex items-center space-x-1.5"
            >
              <Terminal className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {language === 'zh' ? '管理员模式' : 'Admin Mode'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          onClick={handleAvatarClick}
          className="relative group active:scale-95 transition-transform"
        >
          <div className="absolute inset-x-0 -bottom-4 mx-auto w-24 h-8 bg-brand-bronze/10 blur-xl rounded-full" />
          <UserAvatar 
            person={user} 
            size={100} 
            className="ring-4 ring-white/5 shadow-2xl relative z-10" 
          />
          <div className="absolute bottom-0 right-0 z-20 w-8 h-8 bg-[#00d4ff] rounded-full border-4 border-[#121212] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Pencil className="w-3 h-3 text-[#121212] fill-current" />
          </div>
        </button>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white tracking-tight">{user?.nickname}</h2>
          <p className="text-xs text-brand-bronze font-bold uppercase tracking-[0.2em] mt-1">{user?.email}</p>
        </div>
      </div>

      {/* Menu Groups */}
      <div className="space-y-2">
        <div className="glass-card rounded-[32px] overflow-hidden">
          {menuItems.map((item, idx) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center p-5 text-left active:bg-white/5 transition-all ${
                idx !== menuItems.length - 1 ? 'border-b border-white/5' : ''
              }`}
            >
              <item.icon className="w-5 h-5 text-brand-bronze/60 mr-4" />
              <span className="flex-1 font-medium text-white/80">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-white/20" />
            </button>
          ))}
        </div>

        {isAdmin && (
          <button
            onClick={() => onOpenAdmin()}
            className="w-full glass-card rounded-[24px] flex items-center p-5 text-left text-red-500 font-bold active:bg-red-500/10 transition-all mt-2 border border-red-500/20"
          >
            <ShieldCheck className="w-5 h-5 mr-4" />
            {language === 'zh' ? '管理员控制台' : 'Admin Console'}
            <ChevronRight className="w-4 h-4 ml-auto text-red-500/40" />
          </button>
        )}

        <button
          onClick={onLogout}
          className="w-full glass-card rounded-[24px] flex items-center p-5 text-left text-red-400 font-bold active:bg-red-500/10 transition-all mt-4"
        >
          <LogOut className="w-5 h-5 mr-4" />
          {t.settings.logout}
        </button>
      </div>
      
      <div className="text-center pb-8 pt-4 flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              setPolicyType('privacy');
              setShowPolicy(true);
            }}
            className="text-[10px] font-bold text-white/20 uppercase tracking-widest hover:text-white/40 transition-colors"
          >
            {t.settings.privacy}
          </button>
          <div className="w-[1px] h-2 bg-white/5" />
          <button 
            onClick={() => {
              setPolicyType('terms');
              setShowPolicy(true);
            }}
            className="text-[10px] font-bold text-white/20 uppercase tracking-widest hover:text-white/40 transition-colors"
          >
            {t.settings.terms}
          </button>
        </div>
        <button 
          onClick={handleVersionClick}
          className="text-[10px] font-bold text-white/10 uppercase tracking-widest active:text-white/30 transition-colors"
        >
          版本 V1.0.0
        </button>
        <p className="text-[10px] font-bold text-white/5 uppercase tracking-widest mt-1">{t.login.poweredBy}</p>
      </div>

      <PolicyModal 
        isOpen={showPolicy} 
        onClose={() => setShowPolicy(false)}
        language={language}
        type={policyType}
      />
    </div>
  );
}
