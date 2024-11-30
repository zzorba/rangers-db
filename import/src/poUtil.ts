import * as fs from 'fs';
import { promisify } from 'util';
import PO from 'pofile';
import unorm from 'unorm';

const loadPOFile = promisify(PO.load);
const exists = promisify(fs.exists);

const SETTINGS_FOR_LANGUAGE: any = {
  de: {
    'Language': 'de',
    'Plural-Forms': 'nplurals=2; plural=(n != 1);',
  },
  fr: {
    'Language': 'fr',
    'Plural-Forms': 'nplurals=2; plural=(n > 1);',
  },
  it: {
    'Language': 'it',
    'Plural-Forms': 'nplurals=2; plural=(n != 1);',
  },
  ru: {
    'Language': 'ru',
    'Plural-Forms': 'nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2);',
  },
  pseudo: {
    'Language': 'pseudo',
    'Plural-Forms': 'nplurals=2l plural=(n != 1);',
  },
};

async function getPOFile(filePath: string) {
  try {
    const poFile = await loadPOFile(filePath);
    return poFile;
  } catch (err) {
    throw new Error("Could not load PO entries : " + err);
  }
}

export async function getOrCreatePoFile(poFile: string, localeCode: string): Promise<any> {
  if (await exists(poFile)) {
    return await getPOFile(poFile);
  }
  const po = new PO();
  po.headers = SETTINGS_FOR_LANGUAGE[localeCode];
  return po;
}

export function itemMessageId(item: any) {
  if (item.msgctxt) {
    return `${item.msgctxt}_${unorm.nfc(item.msgid)}`;
  }
  return unorm.nfc(item.msgid);
}

export async function getOrCreateCleanPoFile(fileName: string, localeCode: string, noSave?: boolean): Promise<[any, any]> {
  const toRemove: any[] = [];
  const allPoEntries: any = {};
  const poFile = await getOrCreatePoFile(fileName, localeCode);
  for (const item of poFile.items) {
    if (item && item.msgstr && item.msgstr.length && item.msgstr[0]) {
      if (!allPoEntries[itemMessageId(item)]) {
        allPoEntries[itemMessageId(item)] = item;
      }
    } else {
      toRemove.push(item);
    }
  }
  if (toRemove.length) {
    poFile.items = poFile.items.filter((x: any) => !toRemove.find(y => x.msgid === y.msgid && x.msgctxt === y.msgctxt));
    if (!noSave) {
      await poFile.save(fileName, console.error);
    }
  }

  return [allPoEntries, poFile];
}

export function makePoItem(id: string, field: string, text: string) {
  const item = new PO.Item();
  item.msgid = text;
  item.msgctxt = `${id}.${field}`;
  return item;
}
