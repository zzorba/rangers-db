import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { promisify } from 'util';
import { forEach, find, pick, concat } from 'lodash';

dotenv.config();

import client from './graphql/client';

import deepEqual = require('deep-equal');

import { METADATA, CARD_DATA } from './data';

const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const accessFile = promisify(fs.access);

const BASE_IMAGE_DIR = `${process.env.BASE_IMAGE_DIR || ''}/card/`;
const BASE_IMAGE_URL = `${process.env.BASE_IMAGE_URL || ''}/card/`;
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
const BASE_DIR = process.env.BASE_DATA_DIR;
if (!BASE_DIR) {
  throw new Error('BASE_DATA_DIR not set in .env');
}

async function readBasicFile<T>(path: string): Promise<any[]> {
  const rawData = await readFile(path, 'utf8');
  return JSON.parse(rawData);
}

async function importMetadata() {
  const response = await client.getMetadata();
  const files = METADATA;
  const englishLocale = await client.getLocaleText({ locale: 'en' });
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
      const existingData: any = find(existing, (e: any) => e.id === current.id) as any;
      if (!existingData || !deepEqual(
          safePick(existingData, allFields),
          safePick(current, allFields)
        )) {
        console.log(`\tUpdating ${current.id} data`);
        await upsert({
          id: current.id,
          ...safePick(current, allFields),
        } as any);
      }

      if (textFields?.length) {
        const translation = find(translations, (t: any) => t.id === current.id);
        if (!translation || !deepEqual(
          safePick(translation, textFields),
          safePick(current, textFields),
        )) {
          console.log(`\tUpdating ${current.id} text`);
          await upsertText({
            id: current.id,
            locale: 'en',
            ...safePick(current, textFields),
          } as any);
        }
      }
    }
  }
  const cards = await client.getCards();
  const packs = await readDir(`${BASE_DIR}/packs/`);
  const allFields = concat(CARD_DATA.fields, CARD_DATA.textFields || []);
  for (let i = 0; i < packs.length; i++) {
    const cardPacks = await readDir(`${BASE_DIR}/packs/${packs[i]}`);

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
        card.pack_id = pack_id;
        try {
          const path = `${pack_id}/${card.id}.jpeg`;
          await accessFile(`${BASE_IMAGE_DIR}${path}`, fs.constants.F_OK);
          card.imagesrc = `${BASE_IMAGE_URL}${path}`;
        } catch (e) {
          false && console.log(`Could not find image for ${card.id}`);
        }
        const existing = find(cards.rangers_card, c => c.id === card.id);
        if (!existing || !deepEqual(
          safePick(existing, allFields),
          safePick(card, allFields)
        )) {
          console.log(`\tUpdating ${card.id} data`);
          await client.upsertCard({
            id: card.id,
            ...safePick(card, allFields),
          } as any);
        }
        if (CARD_DATA.textFields) {
          const translation = find(cards.rangers_card_text, c => c.id === card.id);
          if (translation) {
            if (deepEqual(safePick(existing, CARD_DATA.textFields), safePick(card, CARD_DATA.textFields))) {
              continue;
            }
          }
          console.log(`\tUpdating ${card.id} text`);
          await client.upsertCardText({
            id: card.id,
            locale: 'en',
            ...safePick(card, CARD_DATA.textFields),
          } as any);
        }
      }
    }
  }
};

async function run() {
  await importMetadata();
  // await updateTimestamps();
}

run();
