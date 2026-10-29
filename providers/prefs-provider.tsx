import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';

import { DEFAULT_COUNTRY, getCountry, type Country, type CountryCode } from '@/constants/countries';
import { type Look } from '@/constants/looks';
import { isRtl, translate, type Language, type TranslationKey } from '@/i18n';

const KEY = 'sih.prefs.v1';

type Stored = { language?: Language; country?: CountryCode; notifications?: boolean; look?: Look };

type Prefs = {
  ready: boolean;
  language: Language;
  rtl: boolean;
  /** Native layout direction only flips after a restart; true when the user must reopen the app. */
  needsRestart: boolean;
  country: Country;
  currency: string;
  /** BCP 47 tag for Intl formatting. Latin digits are kept on purpose; they are common across the Gulf. */
  locale: string;
  notifications: boolean;
  look: Look;
  setLook: (l: Look) => void;
  setLanguage: (l: Language) => void;
  setCountry: (c: CountryCode) => void;
  setNotifications: (on: boolean) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<Prefs | null>(null);

function deviceDefaults(): { language: Language; country: CountryCode } {
  const locale = getLocales()[0];
  const language: Language = locale?.languageCode === 'ar' ? 'ar' : 'en';
  const region = locale?.regionCode ?? '';
  const country = getCountry(region).code === region ? (region as CountryCode) : DEFAULT_COUNTRY;
  return { language, country };
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [language, setLang] = useState<Language>('en');
  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [notifications, setNotif] = useState(true);
  const [look, setLookState] = useState<Look>('frosted');

  useEffect(() => {
    (async () => {
      const defaults = deviceDefaults();
      let stored: Stored = {};
      try {
        stored = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}') as Stored;
      } catch {
        // unreadable prefs fall back to device defaults
      }
      setLang(stored.language ?? defaults.language);
      setCountryCode(stored.country ?? defaults.country);
      setNotif(stored.notifications ?? true);
      setLookState(stored.look === 'classic' ? 'classic' : 'frosted');
      setReady(true);
    })();
  }, []);

  const rtl = isRtl(language);

  // Native: set direction for the next launch. Web: the document direction flips immediately.
  useEffect(() => {
    if (!ready) return;
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        document.documentElement.dir = rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
      }
      return;
    }
    I18nManager.allowRTL(true);
    if (I18nManager.isRTL !== rtl) I18nManager.forceRTL(rtl);
  }, [ready, rtl, language]);

  const persist = useCallback((patch: Stored) => {
    AsyncStorage.getItem(KEY)
      .then((raw) => AsyncStorage.setItem(KEY, JSON.stringify({ ...(raw ? JSON.parse(raw) : {}), ...patch })))
      .catch(() => {});
  }, []);

  const value = useMemo<Prefs>(() => {
    const country = getCountry(countryCode);
    return {
      ready,
      language,
      rtl,
      needsRestart: Platform.OS !== 'web' && ready && I18nManager.isRTL !== rtl,
      country,
      currency: country.currency,
      locale: language === 'ar' ? 'ar-AE-u-nu-latn' : 'en-AE',
      notifications,
      look,
      setLook: (l) => {
        setLookState(l);
        persist({ look: l });
      },
      setLanguage: (l) => {
        setLang(l);
        persist({ language: l });
      },
      setCountry: (c) => {
        setCountryCode(c);
        persist({ country: c });
      },
      setNotifications: (on) => {
        setNotif(on);
        persist({ notifications: on });
      },
      t: (key, vars) => translate(language, key, vars),
    };
  }, [ready, language, rtl, countryCode, notifications, look, persist]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): Prefs {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePrefs must be used inside PrefsProvider');
  return v;
}

export function useT() {
  return usePrefs().t;
}
