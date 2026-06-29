import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Phone, CheckCircle2, Trash2, Plus, Info, ChevronRight } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Contact } from '../../types';
import ContactSheet from '../ContactSheet';
import UserAvatar from '../UserAvatar';

interface ContactsTabProps {
  onSelect: (c: Contact) => void; 
  onCall: (c: Contact) => void;
  onAdd: () => void;
  onRecord: (c: Contact) => void;
  t: any;
  language: 'zh' | 'en';
}

export default function ContactsTab({ onSelect, onCall, onAdd, onRecord, t, language }: ContactsTabProps) {
  const contacts = useLiveQuery(() => db.contacts.reverse().toArray()) || [];
  const [selectedForSheet, setSelectedForSheet] = useState<Contact | null>(null);

  const handleCreateContact = async () => {
    const id = Math.random().toString(36).substr(2, 9);
    await db.contacts.add({
      id,
      name: `${t.contact.add} ${contacts.length + 1}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      voiceprintStatus: 'untrained',
      createdAt: new Date().toISOString()
    });
  };

  const handleDelete = async (id: string) => {
    await db.contacts.delete(id);
    await db.voiceprints.where('contactId').equals(id).delete();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white tracking-tight">{t.dashboard.contacts}</h2>
        <button 
          onClick={onAdd}
          className="w-10 h-10 rounded-full bg-brand-bronze/10 text-brand-bronze flex items-center justify-center hover:bg-brand-bronze/20 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 pb-24">
        {contacts.map((contact) => (
          <ContactCard 
            key={contact.id} 
            contact={contact} 
            onSelect={(c) => {
              onSelect(c);
              setSelectedForSheet(c);
            }} 
            onCall={onCall}
            onDelete={(e, id) => {
              e.stopPropagation();
              handleDelete(id);
            }}
            t={t}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedForSheet && (
          <ContactSheet 
            key="contact-sheet"
            contact={selectedForSheet}
            isOpen={!!selectedForSheet}
            onClose={() => setSelectedForSheet(null)}
            onCall={onCall}
            onRecord={onRecord}
            onDelete={handleDelete}
            language={language}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactCard({ contact, onSelect, onCall, onDelete, t }: { 
  key?: string;
  contact: Contact; 
  onSelect: (c: Contact) => void; 
  onCall: (c: Contact) => void;
  onDelete: (e: React.MouseEvent, id: string) => Promise<void> | void;
  t: any;
}) {
  const x = useMotionValue(0);
  const background = useTransform(x, [-100, 0, 100], ['#ef4444', '#1A1A1A', '#A68966']);
  const [isSwiped, setIsSwiped] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-[24px]">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <div className="flex items-center space-x-2 text-white font-bold text-xs uppercase tracking-widest">
           <Phone className="w-5 h-5" />
           <span>{t.contact.call}</span>
        </div>
        <div className="flex items-center space-x-2 text-white font-bold text-xs uppercase tracking-widest">
           <span>{t.contact.delete}</span>
           <Trash2 className="w-5 h-5" />
        </div>
      </div>

      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 50) {
            onCall(contact);
          } else if (info.offset.x < -40) {
            setIsSwiped(true);
          }
          x.set(0);
        }}
        onTap={() => {
          if (!isSwiped) onSelect(contact);
        }}
        className="relative z-10 glass-card p-4 flex items-center space-x-4 active:scale-[0.98] transition-transform cursor-pointer"
      >
        <div className="relative">
          <UserAvatar person={contact} size={56} />
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0A0A0A] ${
            contact.voiceprintStatus === 'trained' || contact.voiceprintStatus === 'ready' ? 'bg-green-500' : 
            contact.voiceprintStatus === 'training' || contact.voiceprintStatus === 'pending' ? 'bg-yellow-500' : 'bg-white/20'
          }`} />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <h3 className="text-white font-semibold truncate">{contact.name}</h3>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
            {t.dashboard.voiceprintStatus[contact.voiceprintStatus]}
          </p>
        </div>

        <div className="flex items-center space-x-2">
           <button 
             onClick={(e) => { e.stopPropagation(); onCall(contact); }}
             className="p-3 bg-brand-bronze rounded-full text-white shadow-lg shadow-brand-bronze/20"
           >
             <Phone className="w-5 h-5 fill-current" />
           </button>
           <ChevronRight className="w-5 h-5 text-white/10" />
        </div>
      </motion.div>

      <AnimatePresence>
        {isSwiped && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-red-600 flex items-center justify-between px-6"
          >
            <span className="text-white font-bold uppercase tracking-widest text-xs">
              {t.contact.deleteConfirm.replace('%s', contact.name)}
            </span>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setIsSwiped(false)}
                className="px-4 py-2 bg-white/10 rounded-xl text-white font-bold text-[10px] uppercase"
              >
                {t.contact.cancel}
              </button>
              <button 
                onClick={(e) => { onDelete(e, contact.id); setIsSwiped(false); }}
                className="px-4 py-2 bg-white text-red-600 rounded-xl font-bold text-[10px] uppercase shadow-lg"
              >
                {t.contact.delete}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
