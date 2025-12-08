import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from './locales/en/common.json';
import authEn from './locales/en/auth.json';
import boardEn from './locales/en/board.json';
import cardEn from './locales/en/card.json';
import notificationEn from './locales/en/notification.json';
import dashboardEn from './locales/en/dashboard.json';
import sprintEn from './locales/en/sprint.json';

import commonKo from './locales/ko/common.json';
import authKo from './locales/ko/auth.json';
import boardKo from './locales/ko/board.json';
import cardKo from './locales/ko/card.json';
import notificationKo from './locales/ko/notification.json';
import dashboardKo from './locales/ko/dashboard.json';
import sprintKo from './locales/ko/sprint.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
        auth: authEn,
        board: boardEn,
        notification: notificationEn,
        dashboard: dashboardEn,
        card: cardEn,
        sprint: sprintEn,
      },
      ko: {
        common: commonKo,
        auth: authKo,
        board: boardKo,
        notification: notificationKo,
        dashboard: dashboardKo,
        card: cardKo,
        sprint: sprintKo,
      },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ko'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
