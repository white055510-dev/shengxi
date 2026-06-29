import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';

interface AdminLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => boolean;
  language: 'zh' | 'en';
}

export default function AdminLoginDialog({ isOpen, onClose, onLogin, language }: AdminLoginDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(password)) {
      onClose();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xs bg-[#1a1a1a] border border-white/10 rounded-[32px] p-8 shadow-2xl"
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-red-500" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">
                  {language === 'zh' ? '管理员验证' : 'Admin Verification'}
                </h3>
                <p className="text-white/40 text-sm">
                  {language === 'zh' ? '请输入管理员密码以继续' : 'Enter admin password to continue'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'zh' ? '管理员密码' : 'Admin Password'}
                  className={`w-full h-14 bg-white/5 border rounded-2xl px-6 text-white placeholder:text-white/20 focus:outline-none transition-all ${
                    error ? 'border-red-500 animate-shake' : 'border-white/10 focus:border-red-500/50'
                  }`}
                  autoFocus
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-14 rounded-2xl bg-white/5 text-white/60 font-bold active:scale-95 transition-transform"
                  >
                    {language === 'zh' ? '取消' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="h-14 rounded-2xl bg-red-500 text-white font-bold active:scale-95 transition-transform shadow-lg shadow-red-500/20"
                  >
                    {language === 'zh' ? '进入管理' : 'Enter'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
