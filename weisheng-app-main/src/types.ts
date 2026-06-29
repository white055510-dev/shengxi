import { LucideIcon } from 'lucide-react';

export type Language = 'zh' | 'en';

export type User = {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
};

export type VoiceprintStatus = 'trained' | 'untrained' | 'training' | 'pending' | 'ready';

export type Contact = {
  id: string;
  name: string;
  avatar: string;
  voiceprintStatus: VoiceprintStatus;
  createdAt: string;
  shareToken?: string;
  recordedAt?: string;
  customSensitivity?: NoiseLevel;
  lastUpdated?: string;
  voiceprintFeature?: Float32Array;
  email?: string;
  inviteCode?: string;
};

export type NoiseLevel = 'Relaxed' | 'Standard' | 'Strict';

export type CallLog = {
  id?: number;
  contactId: string;
  duration: number;
  timestamp: Date;
  noiseReduced: boolean;
};

export type DatabaseVoiceprint = {
  id?: number;
  contactId: string;
  data: Float32Array; // MFCC data or similar
  noiseLevel: NoiseLevel;
  createdAt: Date;
};

export interface AppState {
  view: 'splash' | 'login' | 'app' | 'recording' | 'calling' | 'settings' | 'privacy' | 'record' | 'admin';
  activeTab: 'contacts' | 'calls' | 'me';
  user: User | null;
  language: Language;
  selectedContact: Contact | null;
  isFilterOn: boolean;
  noiseReduction: number;
  noiseSensitivity: NoiseLevel;
  activeCallId: string | null;
}
