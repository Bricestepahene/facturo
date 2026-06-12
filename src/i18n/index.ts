// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import fr from './fr.json';
import en from './en.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

const NS = ['common', 'document', 'client', 'product', 'settings', 'pdf', 'monetization', 'onboarding'] as const;

type NsKey = typeof NS[number];

function splitResources(json: Record<NsKey, Record<string, unknown>>) {
  return Object.fromEntries(NS.map((ns) => [ns, json[ns]])) as Record<NsKey, Record<string, unknown>>;
}

i18n.use(initReactI18next).init({
  resources: {
    fr: splitResources(fr as Record<NsKey, Record<string, unknown>>),
    en: splitResources(en as Record<NsKey, Record<string, unknown>>),
  },
  ns: [...NS],
  defaultNS: 'common',
  lng: ['fr', 'en'].includes(deviceLanguage) ? deviceLanguage : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v3',
  returnNull: false,
  returnEmptyString: false,
});

export default i18n;
export { useTranslation } from 'react-i18next';
