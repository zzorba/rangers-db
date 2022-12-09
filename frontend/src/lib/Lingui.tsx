import type { I18n } from '@lingui/core'
import { GetStaticProps, GetStaticPropsContext } from 'next';
import { en, de, it } from 'make-plural/plurals'
import { omit } from 'lodash';
import { ReactComponentElement } from 'react';

export type LOCALES = 'en' | 'de' | 'it' | 'pseudo';
//anounce which locales we are going to use and connect them to approprite plural rules
export function initTranslation(i18n: I18n): void {
  i18n.loadLocaleData({
    en: { plurals: en },
    de: { plurals: de },
    it: { plurals: it },
    pseudo: { plurals: en }
  })
}

export async function loadTranslation(locale: string = 'en', isProduction = true) {
  let data
  if (isProduction) {
    data = await import(`../translations/locales/${locale}/messages`)
  } else {
    data = await import(
      `@lingui/loader!../translations/locales/${locale}/messages.po`
    )
  }
  return data.messages
}

export async function getTranslation(locale: string) {
  return await loadTranslation(
    locale,
    process.env.NODE_ENV === 'production'
  );
}
