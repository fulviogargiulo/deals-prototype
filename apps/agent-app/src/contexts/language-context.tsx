import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { type Language, translate } from '@/lib/translations';

const STORAGE_KEY = 'huspy-language';

// Mock backend values — in production these come from user profile / session
const MOCK_ENTITY_COUNTRY = 'ES';
const MOCK_IP_COUNTRY = 'ES';

function resolveDefaultLanguage(): Language {
  // 1. localStorage (manual override)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'es') return stored;

  // 2. Device language
  const nav = navigator.language || (navigator as any).userLanguage || '';
  if (nav.startsWith('es')) return 'es';

  // 3. Business entity country
  if (MOCK_ENTITY_COUNTRY === 'ES') return 'es';

  // 4. IP geolocation
  if (MOCK_IP_COUNTRY === 'ES') return 'es';

  // 5. Fallback
  return 'en';
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(resolveDefaultLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const t = useCallback((key: string) => translate(key, language), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
