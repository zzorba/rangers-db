import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { promisify } from 'util';
import PO from 'pofile';
import { forEach } from 'lodash';
import { METADATA, CARD_DATA } from './data';
import { getOrCreateCleanPoFile, itemMessageId, makePoItem } from './poUtil';
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

dotenv.config();

const BASE_DIR = process.env.BASE_DATA_DIR;
if (!BASE_DIR) {
  throw new Error('BASE_DATA_DIR not set in .env');
}

async function readBasicFile<T>(path: string): Promise<any[]> {
  const rawData = await readFile(path, 'utf8');
  return JSON.parse(rawData);
}

async function translateMetadata(locale: string) {
  fs.mkdirSync(`${BASE_DIR}/i18n/${locale}/packs`, { recursive: true });
  const files = METADATA;

  for (let i = 0; i < files.length; i++) {
    const {
      file,
      textFields,
    } = files[i];
    console.log(`Processing ${file}`);
    const data = await readBasicFile(`${BASE_DIR}/${file}`);

    const translationPoFile = `${BASE_DIR}/i18n/${locale}/${file.replace(/json$/, 'po')}`;;
    const [allPoEntries, poFile] = await getOrCreateCleanPoFile(translationPoFile, locale);
    for (let j = 0; j < data.length; j++) {
      const current = data[j];
      const id = current.id;
      forEach(textFields, field => {
        if (current[field]) {
          const item = makePoItem(id, field, current[field]);
          if (!allPoEntries[itemMessageId(item)]) {
            poFile.items.push(item);
          }
        }
      });
      await poFile.save(translationPoFile, console.error);
    }
  }
  const packs = await readDir(`${BASE_DIR}/packs/`);
  for (let i = 0; i < packs.length; i++) {
    const cardPacks = await readDir(`${BASE_DIR}/packs/${packs[i]}`);

    for (let j = 0; j < cardPacks.length; j++) {
      const pack = cardPacks[j];
      if (pack.indexOf('.json') === -1) {
        continue;
      }
      const pack_id = packs[i];

    fs.mkdirSync(`${BASE_DIR}/i18n/${locale}/packs/${pack_id}`, { recursive: true });
      const data = await readBasicFile(`${BASE_DIR}/packs/${pack_id}/${pack}`);
      console.log(`Processing cards: ${pack}`);


      const translationPoFile = `${BASE_DIR}/i18n/${locale}/packs/${pack_id}/${pack.replace(/json$/, 'po')}`;
      const [allPoEntries, poFile] = await getOrCreateCleanPoFile(translationPoFile, locale);

      for (let k = 0; k < data.length; k++) {
        const card = data[k];

        const id = card.id;
        forEach(CARD_DATA.textFields, field => {
          if (card[field]) {
            const item = new PO.Item();
            item.msgid = card[field];
            item.msgctxt = `${id}.${field}`;
            if (!allPoEntries[itemMessageId(item)]) {
              poFile.items.push(item);
            }
          }
        });
        await poFile.save(translationPoFile, console.error);
      }
    }
  }
};

async function run() {
  const LOCALES = ['de', 'it', 'pseudo'];
  for(let i = 0; i < LOCALES.length; i++) {
    await translateMetadata(LOCALES[i]);
  }
  // await updateTimestamps();
}

run();
