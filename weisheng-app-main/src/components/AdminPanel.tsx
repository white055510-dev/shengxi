import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  Users, 
  Mic2, 
  PhoneCall, 
  Database, 
  Download, 
  Trash2, 
  LogOut,
  Activity,
  Server,
  UserCheck
} from 'lucide-react';
import { db } from '../db/database';
import { exportDB } from 'dexie-export-import';

interface AdminPanelProps {
  onBack: () => void;
  onLogout: () => void;
  language: 'zh' | 'en';
}

export default function AdminPanel({ onBack, onLogout, language }: AdminPanelProps) {
  const [stats, setStats] = useState({
    users: 0,
    contacts: 0,
    voiceprints: 0,
    calls: 0
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const [u, c, v, l] = await Promise.all([
        db.users.count(),
        db.contacts.count(),
        db.voiceprints.count(),
        db.callLogs.count()
      ]);
      setStats({ users: u, contacts: c, voiceprints: v, calls: l });
    };
    fetchStats();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportDB(db);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shengxi_db_export_${new Date().getTime()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert(language === 'zh' ? '导出失败' : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAll = async () => {
    const confirmed = confirm(
      language === 'zh' 
        ? '⚠️ 警告：这将清除所有本地数据库数据（用户、联系人、声纹、记录）。此操作不可逆！' 
        : '⚠️ WARNING: This will clear ALL local database data. This action is IRREVERSIBLE!'
    );
    
    if (confirmed) {
      try {
        await db.delete();
        window.location.reload();
      } catch (error) {
        alert(language === 'zh' ? '清除失败' : 'Clear failed');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 shrink-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold uppercase tracking-widest text-red-500">
              {language === 'zh' ? '管理员控制台' : 'Admin Panel'}
            </h1>
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">Super Admin Mode</span>
            </div>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-8 no-scrollbar">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<UserCheck className="w-5 h-5" />} label={language === 'zh' ? '本地用户' : 'Local Users'} value={stats.users} color="text-blue-400" />
          <StatCard icon={<Users className="w-5 h-5" />} label={language === 'zh' ? '联系人' : 'Contacts'} value={stats.contacts} color="text-green-400" />
          <StatCard icon={<Mic2 className="w-5 h-5" />} label={language === 'zh' ? '声纹模板' : 'Voiceprints'} value={stats.voiceprints} color="text-brand-bronze" />
          <StatCard icon={<PhoneCall className="w-5 h-5" />} label={language === 'zh' ? '通话记录' : 'Call Logs'} value={stats.calls} color="text-purple-400" />
        </div>

        {/* Management Actions */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2">
            {language === 'zh' ? '数据管理' : 'Data Management'}
          </h2>
          <div className="space-y-3">
            <ActionButton 
              icon={<Download className="w-5 h-5" />}
              label={language === 'zh' ? '导出完整数据库 JSON' : 'Export Full DB JSON'}
              onClick={handleExport}
              loading={isExporting}
            />
            <ActionButton 
              icon={<Trash2 className="w-5 h-5" />}
              label={language === 'zh' ? '一键清除所有用户数据' : 'Clear All User Data'}
              onClick={handleClearAll}
              color="text-red-500"
              borderColor="border-red-500/20"
              bgColor="bg-red-500/5"
            />
            <ActionButton 
              icon={<LogOut className="w-5 h-5" />}
              label={language === 'zh' ? '注销管理员身份' : 'Exit Admin Mode'}
              onClick={onLogout}
            />
          </div>
        </section>

        {/* System Info */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2">
            {language === 'zh' ? '系统配置' : 'System Config'}
          </h2>
          <div className="glass-card rounded-3xl p-6 space-y-4 border border-white/5">
            <InfoRow 
              icon={<Server className="w-4 h-4" />}
              label={language === 'zh' ? '信令服务器' : 'Signal Server'}
              value={language === 'zh' ? '在线(Online)' : 'Online'}
              status="online"
            />
            <InfoRow 
              icon={<Activity className="w-4 h-4" />}
              label={language === 'zh' ? '验证码模式' : 'Code Mode'}
              value={process.env.NODE_ENV === 'development' ? 'Dev (123456)' : 'SMTP Real'}
            />
            <InfoRow 
              icon={<Database className="w-4 h-4" />}
              label={language === 'zh' ? '数据库驱动' : 'DB Driver'}
              value="Dexie.js / IndexedDB"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="glass-card rounded-3xl p-5 border border-white/5 space-y-3">
      <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-white/40 text-xs font-medium">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, loading, color = 'text-white', borderColor = 'border-white/5', bgColor = 'bg-white/5' }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center p-5 rounded-2xl border ${borderColor} ${bgColor} active:scale-95 transition-all group`}
    >
      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform ${color}`}>
        {icon}
      </div>
      <span className={`font-bold text-sm ${color}`}>{loading ? '...' : label}</span>
    </button>
  );
}

function InfoRow({ icon, label, value, status }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="text-white/20">{icon}</div>
        <span className="text-sm text-white/60 font-medium">{label}</span>
      </div>
      <div className="flex items-center space-x-2">
        {status === 'online' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />}
        <span className="text-sm text-white/40 font-mono">{value}</span>
      </div>
    </div>
  );
}
