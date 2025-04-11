import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { promisify } from 'util';
// @ts-ignore
import pseudoizer from 'pseudoizer';
import { forEach, find, pick, concat, keys } from 'lodash';

dotenv.config();

import client from './graphql/client';

import deepEqual = require('deep-equal');

import { METADATA, CARD_DATA, LOCALES } from './data';
import { getOrCreateCleanPoFile, itemMessageId, makePoItem } from './poUtil';
import { GetLocaleTextQuery } from './graphql/schema';

const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const accessFile = promisify(fs.access);


const BASE_IMAGE_DIR = `${process.env.BASE_IMAGE_DIR || ''}`;
const BASE_IMAGE_URL = `${process.env.BASE_IMAGE_URL || ''}`;
function cleanNulls(obj: {[key: string]: any }): any {
  const r: { [key: string]: any } = {};
  forEach(obj, (value, key) => {
    if (value !== null && value !== undefined) {
      r[key] = value;
    }
  });
  return r;
}

function safePick(o: any, fields: string[]) {
  const r = cleanNulls(pick(o, fields));
  forEach(fields, f => {
    if (r[f] !== null && r[f] !== undefined) {
      return;
    }
    r[f] = undefined;
  });
  return r;
}

const OMIT = '<OMIT>';
function omitBlank(o: any, fields: string[]) {
  const r = safePick(o, fields);
  forEach(fields, f => {
    if (r[f] === OMIT) {
      r[f] = '';
    }
  });
  return r;
}

const BASE_DIR = process.env.BASE_DATA_DIR;
if (!BASE_DIR) {
  throw new Error('BASE_DATA_DIR not set in .env');
}

async function readBasicFile<T>(path: string): Promise<any[]> {
  const rawData = await readFile(path, 'utf8');
  return JSON.parse(rawData);
}

async function processCardLikeData(
  data: any[],
  existingData: any[],
  allFields: string[],
  textFields: string[] | undefined,
  upsert: (data: any) => Promise<void>,
  upsertText: (data: any) => Promise<void>,
  localeText: { [locale: string]: GetLocaleTextQuery },
  getLocale: (locale: GetLocaleTextQuery) => any[],
  file: string,
  getId: (data: any) => string,
  additionalFields: { [key: string]: any } = {}
) {

  for (let i = 0; i < data.length; i++) {
    const current = data[i];
    const code = current.id;
    const id = getId(current);

    const path = `${file.replace('.json', '')}/${code}.jpg`;
    try {
      await accessFile(`${BASE_IMAGE_DIR}/taboo/${path}`, fs.constants.F_OK);
      current.imagesrc = `${BASE_IMAGE_URL}/taboo/${path}`;
    } catch (e) {
      console.log(`Could not find image for ${current.id} at ${path}`);
    }

    const existing = find(existingData, (e: any) => e.id === id);

    if (!existing || !deepEqual(safePick(existing, allFields), safePick(current, allFields))) {
      console.log(`\tUpdating ${id} data`);
      await upsert({
        ...safePick(current, allFields),
        ...additionalFields,
        code,
        id,
      });

    }

    if (textFields?.length) {
      const theText = safePick(current, textFields);
      const translation = find(getLocale(localeText['en']), (t: any) => t.id === id);

      if (!translation || !deepEqual(safePick(translation, textFields), theText)) {
        console.log(`\tUpdating ${id} text`);
        await upsertText({
          id,
          locale: 'en',
          ...theText,
        });
      }

      for (let k = 0; k < LOCALES.length; k++) {
        const locale = LOCALES[k];
        const [allPoEntries] = await getOrCreateCleanPoFile(
          `${BASE_DIR}/i18n/${locale}/${file.replace('.json', '.po')}`,
          locale,
          true
        );
        const theTranslation = { ...theText };

        forEach(keys(theText), (field) => {
          if (theText[field]) {
            const item = makePoItem(id, field, theText[field]);
            if (locale === 'pseudo') {
              theTranslation[field] = pseudoizer.pseudoize(theText[field]);
            } else {
              if (allPoEntries[itemMessageId(item)]?.msgstr.length) {
                theTranslation[field] = allPoEntries[itemMessageId(item)].msgstr[0];
              }
            }
          }
        });

        const existingTranslation = find(
          getLocale(localeText[locale]),
          (t: any) => t.id === id
        );

        if (!existingTranslation || !deepEqual(safePick(existingTranslation, textFields), theTranslation)) {
          console.log(`\tUpdating ${id} ${locale}.text`);
          await upsertText({
            id,
            locale: locale,
            ...theTranslation,
          });
        }
      }
    }
  }
}


async function importCards() {
  const response = await client.getMetadata();
  const files = METADATA;
  const englishLocale = await client.getLocaleText({ locale: 'en' });
  const localeText: { [locale: string]: GetLocaleTextQuery } = {};
  for (let i = 0; i < LOCALES.length; i++) {
    localeText[LOCALES[i]] = await client.getLocaleText({ locale: LOCALES[i] });
  }
  for (let i = 0; i < files.length; i++) {
    const {
      file,
      fields,
      textFields,
      getData,
      getLocale,
      upsert,
      upsertText
    } = files[i];
    const allFields = concat(fields, textFields || []);
    const existing = getData(response);
    console.log(`Processing ${file}`);
    const data = await readBasicFile(`${BASE_DIR}/${file}`);
    const translations = getLocale(englishLocale);

    for (let j = 0; j < data.length; j++) {
      const current = data[j];
      const id = current.id;
      const existingData: any = find(existing, (e: any) => e.id === current.id) as any;
      if (!existingData || !deepEqual(
          safePick(existingData, allFields),
          safePick(current, allFields)
        )) {
        console.log(`\tUpdating ${current.id} data`);
        await upsert({
          id: current.id,
          ...safePick(current, allFields),
          code: current.id,
        } as any);
      }

      if (textFields?.length) {
        const translation = find(translations, (t: any) => t.id === current.id);
        const theText = safePick(current, textFields);
        if (!translation || !deepEqual(
          safePick(translation, textFields),
          theText,
        )) {
          console.log(`\tUpdating ${current.id} text`);
          await upsertText({
            id: current.id,
            locale: 'en',
            ...theText,
          } as any);
        }

        for (let k = 0; k < LOCALES.length; k++) {
          const locale = LOCALES[k];
          const [allPoEntries] = await getOrCreateCleanPoFile(`${BASE_DIR}/i18n/${locale}/${file.replace('.json', '.po')}`, locale, true);
          const theTranslation = { ...theText };
          forEach(keys(theText), field => {
            if (theText[field]) {
              const item = makePoItem(id, field, theText[field]);
              if (locale === 'pseudo') {
                theTranslation[field] = pseudoizer.pseudoize(theText[field]);
              } else {
                if (allPoEntries[itemMessageId(item)]?.msgstr.length) {
                  theTranslation[field] = allPoEntries[itemMessageId(item)].msgstr[0];
                }
              }
            }
          });
          const existingTranslation = find(
            getLocale(localeText[locale]),
            (t: any) => t.id === current.id);
          if (!existingTranslation || !deepEqual(
            safePick(existingTranslation, textFields),
            theTranslation,
          )) {
            console.log(`\tUpdating ${current.id} ${locale}.text`);
            await upsertText({
              id: current.id,
              locale: locale,
              ...theTranslation,
            } as any);
          }
        }
      }
    }
  }
  const cards = await client.getCards();
  const packs = await readDir(`${BASE_DIR}/packs/`);
  const allFields = concat(CARD_DATA.fields, CARD_DATA.textFields || []);
  for (let i = 0; i < packs.length; i++) {
    const packName = packs[i];
    if (packName === '.DS_Store') {
      continue;
    }
    const cardPacks = await readDir(`${BASE_DIR}/packs/${packName}`);

    for (let j = 0; j < cardPacks.length; j++) {
      const pack = cardPacks[j];
      if (pack.indexOf('.json') === -1) {
        continue;
      }
      const pack_id = packs[i];
      const data = await readBasicFile(`${BASE_DIR}/packs/${packs[i]}/${pack}`);
      console.log(`Processing cards: ${pack}`);
      for (let k = 0; k < data.length; k++) {
        const card = data[k];
        const id = card.id;
        card.pack_id = pack_id;
        try {
          const path = `${pack_id}/${card.id}.jpg`;
          await accessFile(`${BASE_IMAGE_DIR}/card/${path}`, fs.constants.F_OK);
          card.imagesrc = `${BASE_IMAGE_URL}/card/${path}`;
        } catch (e) {
          console.log(`Could not find image for ${card.id}`);
        }
        const existing = find(cards.rangers_card, c => c.id === card.id);
        if (!existing || !deepEqual(
          safePick(existing, allFields),
          safePick(card, allFields)
        )) {
          console.log(`\tUpdating ${card.id} data`);
          await client.upsertCard({
            id: card.id,
            ...omitBlank(card, allFields),
          } as any);
        }
        if (CARD_DATA.textFields) {
          const theText = safePick(card, CARD_DATA.textFields);
          const translation = find(cards.rangers_card_text, c => c.id === card.id);
          if (!translation || !deepEqual(
            safePick(existing, CARD_DATA.textFields),
            theText
          )) {
            console.log(`\tUpdating ${card.id} text`);
            await client.upsertCardText({
              id: card.id,
              locale: 'en',
              ...omitBlank(theText, CARD_DATA.textFields),
            } as any);
          }
          for (let n = 0; n < LOCALES.length; n++) {
            const locale = LOCALES[n];
            const [allPoEntries] = await getOrCreateCleanPoFile(`${BASE_DIR}/i18n/${locale}/packs/${packs[i]}/${pack.replace('.json', '.po')}`, locale, true);
            const theTranslation = { ...theText };

            let localeImageSrc: string | undefined = undefined;
            try {
              const path = `${pack_id}_${locale}/${card.id}.jpg`;
              await accessFile(`${BASE_IMAGE_DIR}/card/${path}`, fs.constants.F_OK);
              localeImageSrc = `${BASE_IMAGE_URL}/card/${path}`;
            } catch (e) {
              false && console.log(`Could not find image for ${card.id}`);
            }
            forEach(keys(theText), field => {
              if (field === 'imagesrc') {
                if (localeImageSrc) {
                  theTranslation[field] = localeImageSrc;
                }
              } else if (theText[field]) {
                const item = makePoItem(id, field, theText[field]);
                if (locale === 'pseudo') {
                  if (field !== 'text') {
                    theTranslation[field] = pseudoizer.pseudoize(theText[field]);
                  }
                } else {
                  if (allPoEntries[itemMessageId(item)]?.msgstr.length) {
                    theTranslation[field] = allPoEntries[itemMessageId(item)].msgstr[0];
                  }
                }
              }
            });

            const existingTranslation = find(localeText[locale].rangers_card_text, c => c.id === card.id);
            if (!existingTranslation || !deepEqual(
              safePick(existingTranslation, CARD_DATA.textFields),
              theTranslation,
            )) {
              console.log(`\tUpdating ${card.id} ${locale}.text`);
              await client.upsertCardText({
                id,
                locale: locale,
                ...omitBlank(theTranslation, CARD_DATA.textFields),
              } as any);
            }
          }
        }
      }
    }
  }
};


async function importTaboos() {
  const tabooFiles = await readDir(`${BASE_DIR}/taboos/`);
  const localeText: { [locale: string]: GetLocaleTextQuery } = {};
  const allLocales = ['en', ...LOCALES];
  for (let i = 0; i < allLocales.length; i++) {
    const locale = allLocales[i];
    localeText[locale] = await client.getLocaleText({ locale });
  }

  for (let i = 0; i < tabooFiles.length; i++) {
    const file = tabooFiles[i];
    if (file.indexOf('.json') === -1) {
      continue;
    }

    const taboo_id = file.replace('.json', '');
    const data = await readBasicFile(`${BASE_DIR}/taboos/${file}`);
    const existingTaboos = await client.getTaboos(); // Fetch existing taboo data
    const allFields = concat(CARD_DATA.fields, CARD_DATA.textFields || []);

    console.log(`Processing taboo set: ${file}`);
    await processCardLikeData(
      data,
      existingTaboos.rangers_card,
      allFields,
      CARD_DATA.textFields,
      async (data) => {
        await client.upsertCard({
          ...data,
          taboo_id,
        });
      },
      async (data) => {
        await client.upsertCardText(data);
      },
      localeText,
      (locale) => {
        return locale.rangers_card_text
      },
      file,
      (card) => `${card.id}-${taboo_id}`,
      { taboo_id }
    );
  }
}


async function run() {
  if (false) {
    await importCards();
  }
  await importTaboos();
  // await updateTimestamps();
}

run();
