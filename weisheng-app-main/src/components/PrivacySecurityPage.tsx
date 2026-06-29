import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Shield, Lock, Trash2, Download, ExternalLink, History, AlertCircle, X, Settings as SettingsIcon } from 'lucide-react';
import { AppState } from '../types';
import { db } from '../db/database';
import { useMicrophonePermission } from '../hooks/useMicrophonePermission';

interface PrivacySecurityPageProps {
  state: AppState;
  t: any;
  onBack: () => void;
  onClearHistory: () => void;
  onClearData: () => void;
}

export default function PrivacySecurityPage({ state, t, onBack, onClearHistory, onClearData }: PrivacySecurityPageProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const { status: micStatus, requestPermission: micRequest, openSettings: micOpenSettings } = useMicrophonePermission();

  const handleExport = () => {
    const data = {
      user: state.user,
      contacts: [], // Would fetch from DB
      voiceprints: [] // Would fetch from DB
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weisheng_data_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleDeleteAccount = async () => {
    try {
      // 1. Delete Dexie database
      await db.delete();
      
      // 2. Clear storages
      localStorage.clear();
      sessionStorage.clear();
      
      // 3. Clear Service Worker registrations
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          registration.unregister();
        }
      }
      
      // 4. Redirect to login
      window.location.href = '/login';
    } catch (err) {
      alert(state.language === 'zh' ? '操作失败，请手动卸载 App 清除数据' : 'Operation failed, please uninstall app to clear data');
      setShowDeleteConfirm(false);
    }
  };

  const sections = [
    {
      title: state.language === 'zh' ? '数据隐私说明' : 'Data Privacy',
      icon: Shield,
      content: state.language === 'zh' 
        ? '声隙 AI 采用端到端本地处理技术。您的所有声纹特征、通话音频采样均在设备本地安全加密存储。我们承诺不会将任何生物识别数据上传至云端或与第三方共享。'
        : 'Shengxi AI uses end-to-end local processing. All your voiceprint features and call audio samples are securely encrypted and stored locally on your device. We promise not to upload any biometric data to the cloud or share it with third parties.',
      color: 'text-cyan-400'
    },
    {
      title: state.language === 'zh' ? '麦克风权限' : 'Microphone Permission',
      icon: Lock,
      action: micStatus !== 'granted' ? {
        label: micStatus === 'prompt' 
          ? (state.language === 'zh' ? '申请权限' : 'Request') 
          : (state.language === 'zh' ? '去设置' : 'Settings'),
        onClick: micStatus === 'prompt' ? micRequest : micOpenSettings
      } : null,
      customContent: (
        <div className="flex items-center space-x-3 mt-4">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            micStatus === 'granted' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 
            micStatus === 'denied' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 
            'bg-yellow-500 shadow-[0_0_8px_#eab308]'
          }`} />
          <span className="text-sm font-bold text-white">
            {micStatus === 'granted' ? (state.language === 'zh' ? '已授权' : 'Granted') : 
             micStatus === 'denied' ? (state.language === 'zh' ? '已拒绝' : 'Denied') : 
             (state.language === 'zh' ? '待授权' : 'Pending')}
          </span>
        </div>
      ),
      content: state.language === 'zh'
        ? '为了实现系统级降噪，我们需要访问您的麦克风权限以便采集声纹特征。'
        : 'To achieve system-level noise reduction, we need access to your microphone to collect voiceprint features.',
      color: 'text-brand-bronze'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col pt-12 pb-8 px-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="flex items-center text-white/40 hover:text-white transition-colors group">
          <ChevronLeft className="w-6 h-6 mr-1 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">{t.login.back}</span>
        </button>
        <div className="flex-1 text-center pr-8">
          <h1 className="text-lg font-bold text-white uppercase tracking-widest">{t.me.privacy}</h1>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <section key={idx} className="space-y-3">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center space-x-2">
                <section.icon className={`w-4 h-4 ${section.color}`} />
                <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">{section.title}</h2>
              </div>
              {section.action && (
                <button 
                  onClick={section.action.onClick}
                  className="text-[10px] font-bold text-brand-bronze uppercase flex items-center"
                >
                  {section.action.label}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </button>
              )}
            </div>
            <div className="glass-card rounded-[24px] p-5">
              <p className="text-sm text-white/60 leading-relaxed">
                {section.content}
              </p>
              {section.customContent}
            </div>
          </section>
        ))}

        {/* Action List */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-4">
            {state.language === 'zh' ? '安全操作' : 'Security Actions'}
          </h2>
          <div className="glass-card rounded-[24px] overflow-hidden">
            <button 
              onClick={handleExport}
              className="w-full flex items-center p-5 active:bg-white/5 border-b border-white/5 group"
            >
              <Download className="w-5 h-5 text-brand-bronze/60 mr-4 group-active:scale-95 transition-transform" />
              <div className="flex-1 text-left">
                <p className="text-white font-medium">{state.language === 'zh' ? '导出个人数据' : 'Export Personal Data'}</p>
                <p className="text-[10px] text-white/30 uppercase">{state.language === 'zh' ? 'JSON 格式' : 'JSON FORMAT'}</p>
              </div>
            </button>
            <button 
              onClick={onClearHistory}
              className="w-full flex items-center p-5 active:bg-white/5 border-b border-white/5 group"
            >
              <History className="w-5 h-5 text-brand-bronze/60 mr-4 group-active:scale-95 transition-transform" />
              <div className="flex-1 text-left">
                <p className="text-white font-medium">{state.language === 'zh' ? '清除通话记录' : 'Clear Call History'}</p>
              </div>
            </button>
            <button 
              onClick={onClearData}
              className="w-full flex items-center p-5 active:bg-red-500/10 text-red-400 group"
            >
              <Trash2 className="w-5 h-5 mr-4 group-active:scale-95 transition-transform" />
              <div className="flex-1 text-left">
                <p className="font-medium">{state.language === 'zh' ? '一键清除声纹数据' : 'Clear All Voiceprints'}</p>
                <p className="text-[10px] opacity-50 uppercase">{state.language === 'zh' ? '不可逆操作' : 'IRREVERSIBLE'}</p>
              </div>
            </button>
          </div>
        </section>

        {/* Delete Account Section */}
        <section className="mt-8 pt-8 border-t border-white/5 space-y-4">
          <div className="px-4">
            <h2 className="text-[10px] font-bold text-[#ff4444] uppercase tracking-[0.2em]">{state.language === 'zh' ? '账号管理' : 'Account Management'}</h2>
          </div>
          <div className="glass-card rounded-[24px] border border-[#ff4444]/20 overflow-hidden">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center p-6 active:bg-red-500/10 transition-colors group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#ff4444]/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                <Trash2 className="w-6 h-6 text-[#ff4444]" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold">{state.language === 'zh' ? '注销账号并清除所有数据' : 'Delete Account & Clear Data'}</p>
                <p className="text-xs text-white/40 mt-1">
                  {state.language === 'zh' 
                    ? '此操作将删除账号、联系人、声纹、通话记录并退出登录'
                    : 'This deletes account, contacts, voiceprints, logs and logs out'}
                </p>
              </div>
            </button>
          </div>
        </section>

        <div className="pt-8 text-center pb-12">
          <Shield className="w-12 h-12 text-white/5 mx-auto mb-4" />
          <p className="text-[10px] font-bold text-white/10 uppercase tracking-[0.4em]">End-to-End Local Privacy</p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#1A1A1A] border border-white/10 rounded-[32px] p-8 shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              
              <h3 className="text-xl font-bold text-white text-center mb-3">
                {state.language === 'zh' ? '确认注销？' : 'Confirm Delete?'}
              </h3>
              
              <p className="text-sm text-white/40 text-center leading-relaxed mb-8">
                {state.language === 'zh' 
                  ? '此操作不可逆，将永久清除您设备上的所有本地数据（包括账号、联系人、声纹、通话记录）并退出登录。'
                  : 'This action is irreversible and will permanently clear all local data and log you out.'}
              </p>
              
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={handleDeleteAccount}
                  className="w-full h-14 bg-[#ff4444] text-white font-bold rounded-2xl active:scale-95 transition-transform"
                >
                  {state.language === 'zh' ? '确认注销' : 'Confirm and Delete'}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full h-14 bg-white/5 text-white/60 font-bold rounded-2xl active:scale-95 transition-transform"
                >
                  {state.language === 'zh' ? '取消' : 'Cancel'}
                </button>
              </div>

              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
                id="close-delete-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
