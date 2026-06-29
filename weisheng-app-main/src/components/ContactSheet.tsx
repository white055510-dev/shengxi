import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mic, Share2, Sliders, Trash2, Phone, 
  Clock, ShieldCheck, ChevronDown, Camera, Pencil
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Contact, NoiseLevel } from '../types';
import { db } from '../db/database';
import UserAvatar from './UserAvatar';

interface ContactSheetProps {
  key?: string;
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onCall: (contact: Contact) => void;
  onRecord: (contact: Contact) => void;
  onDelete: (id: string) => void;
  language: 'zh' | 'en';
  t: any;
}

export default function ContactSheet({ 
  contact: initialContact, isOpen, onClose, onCall, onRecord, onDelete, language, t 
}: ContactSheetProps) {
  const contact = useLiveQuery(() => db.contacts.get(initialContact.id), [initialContact.id]) || initialContact;
  const [showSlider, setShowSlider] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(contact.name);
  const [sensitivity, setSensitivity] = useState<NoiseLevel>(contact.customSensitivity || 'Standard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedName(contact.name);
  }, [contact.name]);

  const handleUpdateSensitivity = async (level: NoiseLevel) => {
    setSensitivity(level);
    await db.contacts.update(contact.id, { customSensitivity: level });
  };

  const handleNameSave = async () => {
    if (editedName.trim() && editedName !== contact.name) {
      await db.contacts.update(contact.id, { name: editedName.trim() });
    }
    setIsEditingName(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxSize = 500;
        const size = Math.min(img.width, img.height);
        const offsetX = (img.width - size) / 2;
        const offsetY = (img.height - size) / 2;

        canvas.width = Math.min(size, maxSize);
        canvas.height = Math.min(size, maxSize);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          await db.contacts.update(contact.id, { avatar: base64 });
          // Force refresh would be nice but since it's liveQuery in parent it might just work
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    console.log('Deleting contact:', contact.id);
    onDelete(contact.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-[100] h-[85%] bg-[#1a1f3a] rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl border-t border-white/5"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />

            {/* Handle Bar */}
            <div className="w-full flex justify-center pt-3 pb-6">
              <div className="w-10 h-1 bg-[#4a5070] rounded-full" />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-8">
                <button 
                  onClick={handleAvatarClick}
                  className="relative mb-4 group active:scale-95 transition-transform"
                >
                  <div className="absolute inset-0 bg-brand-bronze/20 blur-2xl rounded-full" />
                  <UserAvatar 
                    person={contact} 
                    size={100} 
                    className="relative z-10 shadow-2xl" 
                  />
                  <div className="absolute bottom-0 right-0 z-20 w-8 h-8 bg-[#00d4ff] rounded-full border-4 border-[#1a1f3a] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Pencil className="w-3 h-3 text-[#121212] fill-current" />
                  </div>
                </button>
                {isEditingName ? (
                  <div className="flex items-center space-x-2 mb-1">
                    <input 
                      autoFocus
                      type="text" 
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={handleNameSave}
                      onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-center font-bold focus:outline-none focus:border-brand-bronze"
                    />
                  </div>
                ) : (
                  <h2 
                    onClick={() => setIsEditingName(true)}
                    className="text-xl font-bold text-white mb-1 cursor-pointer hover:text-brand-bronze transition-colors flex items-center"
                  >
                    {contact.name}
                    <Pencil className="w-3 h-3 ml-2 opacity-30" />
                  </h2>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${
                    contact.voiceprintFeature ? 'text-cyan-400 bg-cyan-400/10' : 'text-red-400 bg-red-400/10'
                  }`}>
                    {contact.voiceprintFeature ? t.contact.featureExtracted : t.contact.featureMissing}
                  </span>
                  {!contact.voiceprintFeature && contact.voiceprintStatus === 'trained' && (
                    <button 
                      onClick={async () => {
                         const vp = await db.voiceprints.where('contactId').equals(contact.id).first();
                         if (vp) {
                           await db.contacts.update(contact.id, { voiceprintFeature: vp.data });
                         }
                      }}
                      className="text-[10px] font-bold text-brand-bronze underline decoration-brand-bronze/30 underline-offset-4 uppercase tracking-widest"
                    >
                      {t.contact.extractFeature}
                    </button>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="bg-white/5 rounded-[20px] p-4 mb-8 space-y-3 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">{t.contact.addedDate}</span>
                  <span className="text-white/80 font-mono italic">{contact.createdAt?.split('T')[0] || '2026-05-05'}</span>
                </div>
                {contact.recordedAt && (
                   <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{t.contact.recordedAt}</span>
                    <span className="text-white/80 font-mono italic">{contact.recordedAt.replace('T', ' ').split('.')[0]}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">{t.settings.sensitivity}</span>
                  <span className="text-brand-bronze font-bold uppercase">{t.recording.sensitivityLevels[sensitivity]}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 px-1">
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="w-full h-12 rounded-xl border border-[#A68966] text-white flex items-center px-4 hover:bg-white/5 active:bg-white/10 transition-all font-medium text-sm"
                >
                  <Pencil className="w-4 h-4 mr-3 opacity-60 text-brand-bronze" />
                  {t.contact.editName}
                </button>

                <button 
                  onClick={() => onRecord(contact)}
                  className="w-full h-12 rounded-xl border border-[#A68966] text-white flex items-center px-4 hover:bg-white/5 active:bg-white/10 transition-all font-medium text-sm"
                >
                  <Mic className="w-4 h-4 mr-3 opacity-60 text-brand-bronze" />
                  {t.contact.rerecord}
                </button>

                <button className="w-full h-12 rounded-xl border border-[#A68966] text-white flex items-center px-4 hover:bg-white/5 transition-all font-medium text-sm">
                  <Share2 className="w-4 h-4 mr-3 opacity-60 text-brand-bronze" />
                  {t.contact.generate}
                </button>

                <div className="space-y-2">
                  <button 
                    onClick={() => setShowSlider(!showSlider)}
                    className="w-full h-12 rounded-xl border border-[#A68966] text-white flex items-center px-4 hover:bg-white/5 transition-all font-medium text-sm justify-between"
                  >
                    <div className="flex items-center text-brand-bronze font-bold uppercase tracking-widest text-[10px]">
                      <Sliders className="w-4 h-4 mr-3" />
                      {t.contact.adjustNoise}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showSlider ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showSlider && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/20 rounded-xl p-4 flex space-x-2 border border-white/5"
                      >
                         {(['Relaxed', 'Standard', 'Strict'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => handleUpdateSensitivity(lvl)}
                            className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase transition-all ${
                              sensitivity === lvl ? 'bg-brand-bronze text-white' : 'bg-white/5 text-white/20'
                            }`}
                          >
                            {t.recording.sensitivityLevels[lvl]}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-4">
                  {!showDeleteConfirm ? (
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full h-12 text-[#ff4444] flex items-center justify-center font-bold text-xs uppercase tracking-[0.2em]"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.contact.deleteContact}
                    </button>
                  ) : (
                    <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20">
                      <p className="text-white text-xs text-center mb-4 leading-relaxed">
                        {t.contact.deleteConfirm.replace('%s', contact.name)}
                      </p>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 h-10 bg-white/5 rounded-lg text-white/60 text-[10px] font-bold uppercase tracking-widest"
                        >
                          {t.contact.cancel}
                        </button>
                        <button 
                          onClick={handleDelete}
                          className="flex-1 h-10 bg-red-500 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20"
                        >
                          {t.contact.delete}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fixed Bottom Call */}
            <div className="absolute bottom-6 left-6 right-6">
              <button 
                onClick={() => onCall(contact)}
                className="w-full h-[52px] bg-[#00d4ff] text-[#121212] rounded-[24px] font-bold uppercase tracking-[0.15em] shadow-xl shadow-[#00d4ff]/20 active:scale-95 transition-all flex items-center justify-center space-x-3"
              >
                <Phone className="w-5 h-5 fill-[#121212]" />
                <span>{t.dashboard.callBtn}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
