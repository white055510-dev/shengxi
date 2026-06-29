import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, ArrowLeft, ChevronRight } from 'lucide-react';
import { Language, User } from '../types';
import { db } from '../db/database';
import { useCountdown } from '../hooks/useCountdown';
import { EmailService } from '../services/emailService';
import Logo from './Logo';
import PolicyModal from './PolicyModal';

interface LoginScreenProps {
  language: Language;
  onLanguageToggle: (lang: Language) => void;
  onLoginSuccess: (user: User) => void;
  t: any;
}

export default function LoginScreen({ language, onLanguageToggle, onLoginSuccess, t }: LoginScreenProps) {
  const [loginMode, setLoginMode] = useState<'selection' | 'email'>('selection');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const codeInputs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { seconds: countdown, isActive: isCounting, start: startCountdown } = useCountdown(60);
  const [toast, setToast] = useState<{msg: string, type?: 'error' | 'success'} | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [agreed, setAgreed] = useState(true);

  const showToast = (msg: string, type: 'error' | 'success' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendCode = async () => {
    if (!email) {
      showToast(language === 'zh' ? '请输入账号' : 'Please enter an account', 'error');
      return;
    }
    
    setIsSending(true);
    try {
      const { success, message } = await EmailService.sendVerificationCode(email);
      
      if (success) {
        showToast(language === 'zh' ? '验证码已发送至您的邮箱' : 'Code sent to your email');
        startCountdown();
      } else {
        showToast(message || 'Failed to send', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const handleEmailLogin = async () => {
    const fullCode = code.join('');
    if (!email || fullCode.length < 6) return;
    
    setIsLoggingIn(true);
    try {
      const { success, message } = await EmailService.verifyCode(email, fullCode);

      if (success) {
        const user: User = {
          id: `u_${Date.now()}`,
          email: email,
          nickname: email.split('@')[0],
          avatar: ''
        };
        await db.users.put(user);
        onLoginSuccess(user);
      } else {
        showToast(message || 'Verification failed', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 pt-20">
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <Logo size={56} className="mb-4" />
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
          {t.appName}
        </h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold">
          Shengxi Audio
        </p>
      </div>

      <div className="absolute top-8 right-8">
        <button
          onClick={() => onLanguageToggle(language === 'zh' ? 'en' : 'zh')}
          className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium text-white/80"
        >
          {language === 'zh' ? 'EN' : '中'}
        </button>
      </div>

      <motion.div 
        layout
        className="w-full max-w-md glass-card rounded-[32px] p-8 relative overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {loginMode === 'selection' ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <button
                  onClick={() => setLoginMode('email')}
                  className="w-full h-[72px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center px-6 group transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-[#00d4ff]/20 flex items-center justify-center mr-4">
                    <Mail className="w-6 h-6 text-[#00d4ff]" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-lg font-bold text-white block leading-tight">{t.login.email}</span>
                    <span className="text-[10px] font-bold text-brand-bronze uppercase tracking-widest">{t.login.recommended}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white/50 transition-colors" />
                </button>

                <button
                  onClick={() => showToast(t.login.phoneToast)}
                  className="w-full h-[72px] rounded-2xl bg-white/5 opacity-40 border border-white/10 flex items-center px-6 group cursor-not-allowed"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mr-4">
                    <Phone className="w-5 h-5 text-white/40" />
                  </div>
                  <span className="text-lg font-bold text-white/40 flex-1 text-left">{t.login.phone}</span>
                  <span className="text-[10px] text-white/20 font-bold uppercase">{t.login.comingSoon}</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="email-page"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <button 
                onClick={() => setLoginMode('selection')}
                className="flex items-center text-xs font-bold text-white/40 hover:text-white transition-colors group uppercase tracking-[0.2em]"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                {t.login.back}
              </button>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#00d4ff] transition-colors" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.login.emailPlaceholder}
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 text-white focus:outline-none focus:border-[#00d4ff]/50 transition-colors placeholder:text-white/10"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                         {language === 'zh' ? '6位验证码' : '6-digit verification code'}
                       </span>
                       <button 
                         onClick={handleSendCode}
                         disabled={isSending || isCounting || !email}
                         className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                           isCounting ? 'text-white/20' : 'text-[#00d4ff] hover:text-cyan-300'
                         }`}
                       >
                         {isSending ? '...' : (isCounting ? `${countdown}s` : t.login.sendCode)}
                       </button>
                    </div>
                    
                    <div className="flex justify-between gap-2">
                      {code.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={el => codeInputs.current[idx] = el}
                          type="text"
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handleCodeChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className="w-full aspect-square bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:border-[#00d4ff] transition-all"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleEmailLogin}
                  disabled={!email || code.join('').length < 6 || !agreed || isLoggingIn}
                  className="w-full h-16 bg-[#00d4ff] hover:bg-cyan-400 disabled:opacity-50 disabled:bg-[#00d4ff]/30 rounded-2xl text-black font-bold text-lg shadow-xl shadow-[#00d4ff]/20 transition-all mt-6 uppercase tracking-widest flex items-center justify-center space-x-3"
                >
                  {isLoggingIn && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                  <span>{t.login.loginBtn}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3 group">
            <button 
              onClick={() => setAgreed(!agreed)}
              className="w-4 h-4 rounded border border-white/10 flex items-center justify-center hover:border-[#00d4ff]/50 transition-colors"
            >
              {agreed && <div className="w-2 h-2 bg-[#00d4ff] rounded-sm" />}
            </button>
            <span className="text-[10px] text-white/30 font-medium">
              {language === 'zh' ? '已阅读并同意' : 'Read and agree to '}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPolicy(true);
                }}
                className="text-brand-bronze hover:text-white transition-colors underline underline-offset-4 decoration-white/10"
              >
                {language === 'zh' ? '服务条款及隐私政策' : 'Terms and Conditions'}
              </button>
            </span>
          </div>
          <div className="text-[10px] text-white/10 font-bold tracking-[0.2em] uppercase">{t.login.poweredBy}</div>
        </div>
      </motion.div>

      <PolicyModal 
        isOpen={showPolicy} 
        onClose={() => setShowPolicy(false)} 
        language={language}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 border rounded-full text-[10px] font-bold uppercase tracking-widest z-50 shadow-2xl backdrop-blur-md ${
              toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500 text-red-500' 
                : 'bg-[#121212]/90 border-white/10 text-white/90'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
