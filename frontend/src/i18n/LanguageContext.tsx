import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Language } from './translations';
import { defaultLanguage } from './translations';

export interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return (stored === 'en' || stored === 'ar' ? stored : defaultLanguage) as Language;
  });

  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    const html = document.documentElement;
    html.dir = dir;
    html.lang = language;
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = {
    language,
    setLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
