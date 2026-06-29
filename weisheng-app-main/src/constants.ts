import { Language } from './types';
import zh_CN from './locales/zh_CN.json';
import en_US from './locales/en_US.json';

export const TRANSLATIONS: Record<Language, any> = {
  zh: zh_CN,
  en: en_US
};

export const SCHEME_D = {
  colors: {
    bg: '#000000',
    card: 'rgba(15, 15, 15, 0.8)',
    paper: '#D4B896',
    accent: '#C4A77D',
    secondary: '#A68D6A',
    text: '#F5F5F5',
    textMuted: '#999999',
    cyan: '#C4A77D',
    border: 'rgba(212, 184, 150, 0.1)'
  },
  radius: {
    card: '12px',
    button: '4px'
  }
};

export const BASE_URL = 'http://39.106.223.179';
export const API_BASE = 'http://39.106.223.179:3000';
