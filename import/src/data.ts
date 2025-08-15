import client from './graphql/client';
import { GetLocaleTextQuery, GetMetadataQuery } from './graphql/schema';

export const LOCALES = ['de', 'it', 'fr', 'es', 'ru', 'pseudo'];

export interface Table {
  collection: string;
  fields: string[];
  textFields?: string[];
  foreignKeys?: {
    [field: string]: string | undefined;
  };
}

export const TABLES: { [key: string]: Table } = {
  aspect: {
    collection: 'aspect',
    fields: [],
    textFields: ['name', 'short_name'],
  },
  taboo_set: {
    collection: 'taboo_set',
    fields: [
      'date',
      'is_current'
    ],
    textFields: ['name']
  },
  set_type: {
    collection: 'set_type',
    fields: [],
    textFields: ['name'],
  },
  set: {
    collection: 'set',
    fields: ['type_id', 'size'],
    textFields: ['name'],
    foreignKeys: {
      type_id: 'set_type',
    },
  },
  subset: {
    collection: 'subset',
    fields: ['set_id', 'pack_id', 'size'],
    textFields: ['name'],
    foreignKeys: {
      set_id: 'set',
      pack_id: 'pack',
    }
  },
  token: {
    collection: 'token',
    fields: [],
    textFields: ['name', 'plurals'],
  },
  type: {
    collection: 'type',
    fields: [],
    textFields: ['name'],
  },
  area: {
    collection: 'area',
    fields: [],
    textFields: ['name']
  },
  pack: {
    collection: 'pack',
    fields: ['position'],
    textFields: ['name', 'short_name']
  },
  card: {
    collection: 'card',
    fields: [
      'equip',
      'presence',
      'token_id',
      'token_count',
      'harm',
      'progress',
      'approach_conflict',
      'approach_reason',
      'approach_exploration',
      'approach_connection',
      'set_id',
      'set_position',
      'quantity',
      'level',
      'type_id',
      'cost',
      'aspect_id',
      'area_id',
      'guide_entry',
      'progress_fixed',
      'locations',
      'pack_id',
      'illustrator',
      'back_card_id',
      'position',
      'deck_limit',
      'spoiler',
      'subset_id',
      'subset_position',
      'code',
      'taboo_id',
    ],
    textFields: [
      'name',
      'traits',
      'text',
      'flavor',
      'objective',
      'imagesrc',
      'sun_challenge',
      'mountain_challenge',
      'crest_challenge'
    ],
    foreignKeys: {
      token_id: 'token',
      set_id: 'set',
      type_id: 'type',
      aspect_id: 'aspect',
      area_id: 'area',
      pack_id: 'pack',
      taboo_id: 'taboo_set',
      subset_id: 'subset',
    },
  },
};



export const METADATA = [
  {
    file: 'packs.json',
    ...TABLES.pack,
    getData: (data: GetMetadataQuery) => data.rangers_pack,
    getLocale: (data: GetLocaleTextQuery) => data.rangers_pack_text,
    upsert: client.upsertCardPack,
    upsertText: client.upsertCardPackText,
  },
  {
    file: 'areas.json',
    ...TABLES.aspect,
    getData: (data: GetMetadataQuery) => data.rangers_area,
    getLocale: (data: GetLocaleTextQuery) => data.rangers_area_text,
    upsert: client.upsertCardArea,
    upsertText: client.upsertCardAreaText,
  },
  {
    file: 'aspects.json',
    ...TABLES.aspect,
    getData: (data: GetMetadataQuery) => data.rangers_aspect,
    getLocale: (data: GetLocaleTextQuery) => data.rangers_aspect_text,
    upsert: client.upsertAspect,
    upsertText: client.upsertAspectText,
  },
  {
    file: 'set_types.json',
    ...TABLES.set_type,
    getData: (data: GetMetadataQuery) => data.rangers_set_type,
    getLocale: (data: GetLocaleTextQuery) => data.rangers_set_type_text,
    upsert: client.upsertCardSetType,
    upsertText: client.upsertCardSetTypeText,
  },
  {
    file: 'sets.json',
    ...TABLES.set,
    getData: (data: GetMetadataQuery) => data.rangers_set,
    getLocale: (data: GetLocaleTextQuery) => data.rangers_set_text,
    upsert: client.upsertCardSet,
    upsertText: client.upsertCardSetText,
  },
  {
    file: 'subsets.json',
    ...TABLES.subset,
    getData: (data: GetMetadataQuery) => data.rangers_subset,
    getLocale: (data: GetLocaleTextQuery) => data.rangers_subset_text,
    upsert: client.upsertCardSubset,
    upsertText: client.upsertCardSubsetText,
  },
  {
    file: 'tokens.json',
    ...TABLES.token,
    getData: (data: GetMetadataQuery) => data.rangers_token,
    getLocale: (data: GetLocaleTextQuery) => data.rangers_token_text,
    upsert: client.upsertToken,
    upsertText: client.upsertTokenText,
  },
  {
    file: 'types.json',
    ...TABLES.type,
    getData: (data: GetMetadataQuery) => data.rangers_type,
    getLocale: (data: GetLocaleTextQuery) => data.rangers_type_text,
    upsert: client.upsertCardType,
    upsertText: client.upsertCardTypeText,
  },
];

export const CARD_DATA = TABLES.card;
