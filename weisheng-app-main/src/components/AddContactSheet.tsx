import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, FileText, Copy, CheckCircle2, QrCode, Shield, RefreshCw, Mail, Keyboard, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Clipboard } from '@capacitor/clipboard';
import { db } from '../db/database';
import { BASE_URL, API_BASE } from '../constants';

interface AddContactSheetProps {
  isOpen: boolean;
  onClose: () => void;
  t: any;
}

type AddMode = 'qr' | 'email' | 'manual';

export default function AddContactSheet({ isOpen, onClose, t }: AddContactSheetProps) {
  const [activeMode, setActiveMode] = useState<AddMode>('qr');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [bindingCode, setBindingCode] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setNotes('');
      setEmail('');
      setInviteCode('');
      setBindingCode('');
      setShowResult(false);
      setCopied(false);
      setGeneratedLink('');
      setIsProcessing(false);
      setActiveMode('qr');
    }
  }, [isOpen]);

  const generateToken = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAddQR = async () => {
    if (!name.trim()) return;
    setIsProcessing(true);
    
    try {
      const contactId = Math.random().toString(36).substr(2, 9);
      const shareToken = generateToken(16);
      
      await db.contacts.add({
        id: contactId,
        name: name.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        voiceprintStatus: 'pending',
        shareToken: shareToken,
        createdAt: new Date().toISOString()
      });

      // Unified URL config
      const githubUrl = `${BASE_URL}/record?token=${shareToken}&contactId=${contactId}`;
      setGeneratedLink(githubUrl);
      setShowResult(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInviteEmail = async () => {
    if (!name.trim() || !email.trim()) return;
    setIsProcessing(true);

    try {
      const contactId = Math.random().toString(36).substr(2, 9);
      const shareToken = generateToken(16);
      const code = generateToken(6); // 6-digit confirmation code
      setInviteCode(code);

      await db.contacts.add({
        id: contactId,
        name: name.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        voiceprintStatus: 'pending',
        shareToken: shareToken,
        createdAt: new Date().toISOString(),
        email: email.trim(),
        inviteCode: code
      });

      const recordUrl = `${BASE_URL}/record?token=${shareToken}&contactId=${contactId}`;
      
      const resp = await fetch(`${API_BASE}/api/invite-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          contactName: name,
          recordUrl,
          inviteCode: code
        })
      });

      if (resp.ok) {
        setShowResult(true);
      } else {
        alert('Mail failed');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualAdd = async () => {
    if (!name.trim()) return;
    setIsProcessing(true);
    try {
      await db.contacts.add({
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        voiceprintStatus: 'untrained',
        createdAt: new Date().toISOString()
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyBinding = async () => {
    const contact = await db.contacts.where('name').equals(name).first();
    if (contact && contact.inviteCode === bindingCode) {
        // Find if voiceprint exists (it should come via socket if they recorded)
        alert('绑定成功');
        onClose();
    } else {
        alert('验证码错误或声纹未就绪');
    }
  };

  const copyToClipboard = async () => {
    try {
      await Clipboard.write({ string: generatedLink });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const modes = [
    { id: 'qr', label: '扫码/链接', icon: QrCode },
    { id: 'email', label: '邮件邀请', icon: Mail },
    { id: 'manual', label: '手动添加', icon: Keyboard },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#1A1A1A] rounded-t-[40px] px-8 pt-4 pb-12 shadow-2xl safe-area-bottom"
          >
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8" />
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                {showResult ? '完成添加' : '添加联系人'}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-white/40">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!showResult && (
              <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMode(m.id as AddMode)}
                    className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${
                      activeMode === m.id ? 'bg-brand-bronze text-white shadow-lg' : 'text-white/40'
                    }`}
                  >
                    <m.icon className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
                  </button>
                ))}
              </div>
            )}

            {!showResult ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">姓名</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-bronze/40" />
                      <input 
                        type="text" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="请输入联系人备注姓名"
                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:border-brand-bronze/50"
                      />
                    </div>
                  </div>

                  {activeMode === 'email' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">对方邮箱</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-bronze/40" />
                        <input 
                          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder="请输入对方的邮箱地址"
                          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:border-brand-bronze/50"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">备注信息</label>
                    <textarea 
                      value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="选填：如对方的身份或录制场景"
                      className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-white resize-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={
                    activeMode === 'qr' ? handleAddQR : 
                    activeMode === 'email' ? handleInviteEmail : handleManualAdd
                  }
                  disabled={!name.trim() || isProcessing}
                  className="w-full h-16 bg-brand-bronze rounded-[24px] text-white font-bold text-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : '开始添加'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-8 animate-in fade-in duration-500">
                {activeMode === 'qr' ? (
                  <>
                    <div className="p-4 bg-white rounded-3xl">
                      <QRCodeSVG value={generatedLink} size={180} />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-white font-bold text-lg">二维码已生成</p>
                      <p className="text-white/40 text-sm">请对方扫描二维码开始录制</p>
                    </div>
                    <button onClick={copyToClipboard} className="w-full h-14 bg-white/5 rounded-2xl flex items-center justify-center space-x-2 text-white border border-white/10 active:scale-95 transition-all">
                      {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-brand-bronze" />}
                      <span>{copied ? '链接已复制' : '复制分享链接'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Mail className="w-10 h-10 text-green-500" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-white font-bold text-lg">邀请邮件已发送</p>
                      <p className="text-white/40 text-sm italic">确认码：<span className="text-brand-bronze font-mono font-bold text-xl">{inviteCode}</span></p>
                    </div>
                    <div className="w-full space-y-3">
                      <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">输入确认码以完成绑定</label>
                      <div className="flex space-x-3">
                         <input 
                          type="text" value={bindingCode} onChange={(e) => setBindingCode(e.target.value)}
                          placeholder="6位确认码"
                          className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-white text-center font-mono text-xl tracking-[0.5em]"
                        />
                        <button onClick={handleVerifyBinding} className="w-20 h-14 bg-brand-bronze rounded-2xl text-white font-bold flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                <button onClick={onClose} className="text-white/20 font-bold uppercase tracking-tighter text-xs mt-4">稍后手动绑定</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
