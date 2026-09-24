import { useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { translations, type Language } from './translations';

export const useTranslation = () => {
  const { language, setLanguage } = useLanguage();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[language];
      let text = dict[key] ?? translations.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return text;
    },
    [language]
  );

  const switchLanguage = useCallback(
    (lang: Language) => setLanguage(lang),
    [setLanguage]
  );

  return { t, language, switchLanguage };
};
