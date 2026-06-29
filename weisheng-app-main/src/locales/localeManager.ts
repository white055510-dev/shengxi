import zh_CN from './zh_CN.json';
import en_US from './en_US.json';
import { Language } from '../types';

const translations = {
  zh: zh_CN,
  en: en_US
};

export class LocaleManager {
  private static instance: LocaleManager;
  private currentLanguage: Language = 'zh';

  private constructor() {}

  public static getInstance(): LocaleManager {
    if (!LocaleManager.instance) {
      LocaleManager.instance = new LocaleManager();
    }
    return LocaleManager.instance;
  }

  public setLanguage(lang: Language) {
    this.currentLanguage = lang;
  }

  public getLanguage(): Language {
    return this.currentLanguage;
  }

  public getTranslations() {
    return translations[this.currentLanguage];
  }

  public t(path: string): any {
    const keys = path.split('.');
    let result: any = this.getTranslations();
    
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        return path;
      }
    }
    return result;
  }
}

export const i18n = LocaleManager.getInstance();
