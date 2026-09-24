import { useTranslation } from '../i18n/useTranslation';

export function LanguageToggle() {
  const { language, switchLanguage, t } = useTranslation();

  return (
    <div
      className="lang-toggle"
      role="group"
      aria-label={t('lang_toggleHint')}
    >
      <button
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => switchLanguage('en')}
        aria-label="English"
        aria-pressed={language === 'en'}
      >
        {t('lang_english')}
      </button>
      <button
        className={`lang-btn ${language === 'ar' ? 'active' : ''}`}
        onClick={() => switchLanguage('ar')}
        aria-label={t('lang_arabic')}
        aria-pressed={language === 'ar'}
      >
        {t('lang_arabic')}
      </button>
    </div>
  );
}
