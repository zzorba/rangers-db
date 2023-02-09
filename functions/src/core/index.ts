import * as functions from 'firebase-functions';
import { t, addLocale, useLocale } from 'ttag';

export interface RequestData {
  locale?: string;
}

function getTranslationObj(locale: string) {
  switch (locale) {
    case 'de': return require('../../assets/i18n/de.po.json');
    case 'it': return require('../../assets/i18n/it.po.json');
    case 'fr': return require('../../assets/i18n/fr.po.json');
    case 'en':
    default:
      return require('../../assets/i18n/en.po.json');
  }
}

export function onCallAuth<T extends RequestData>(callback: (
  data: T,
  context: {
    auth: {
      uid: string;
    };
  }
) => Promise<any>) {
  return functions.https.onCall(async(data: T, context: functions.https.CallableContext) => {
    try {
      const locale = data.locale || 'en';
      const translationObj = getTranslationObj(locale);
      addLocale(locale, translationObj); // adding locale to ttag
      useLocale(locale);
      if (!context.auth) {
        return {
          error: t`Request not authorized. User must be signed in.`,
        };
      }
      return await callback(data, { auth: context.auth });
    } catch (e) {
      console.error(e);
      return {
        error: 'Unknown error occurred',
      };
    }
  });
}