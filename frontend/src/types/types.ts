import { pathToArray } from "graphql/jsutils/Path";

export interface Aspect {
  name: string;
  short_name: string;
}

export type AspectMap = {
  [code: string]: Aspect | undefined;
}

export const AWA = 'AWA';
export const FIT = 'FIT';
export const FOC = 'FOC';
export const SPI = 'SPI';
export type AspectType = typeof AWA | typeof FIT | typeof FOC | typeof SPI;

export interface MapLocationConnection {
  id: string;
  path: Path;
  restriction: ConnectionRestriction | undefined;
}

export interface CampaignCycle {
  id: string;
  name: string;
}

export interface MapLocation {
  id: string;
  name: string;
  background?: boolean;
  type: 'location' | 'trail' | 'general';
  cycles?: string[];
  connections: MapLocationConnection[];
}

export interface MapLocations {
  [code: string]: MapLocation | undefined;
}

export enum Path {
  NONE = 'none',
  WOODS = 'woods',
  MOUNTAIN_PASS = 'mountain_pass',
  OLD_GROWTH = 'old_growth',
  LAKESHORE = 'lakeshore',
  GRASSLAND = 'grassland',
  RAVINE = 'ravine',
  SWAMP = 'swamp',
  RIVER = 'river',
  ANCIENT_RUINS = 'ancient_ruins',
  FLOODED_RUINS = 'flooded_ruins',
  DEEP_ROOTS = 'deep_roots',
  FUNGAL_FOREST = 'fungal_forest',
  CAVE_SYSTEM = 'cave_system',
}
export enum ConnectionRestriction {
  FLOODED_PASSAGE = 'flooded_passage',
  LOCKED_PASSAGE = 'locked_passage',
  OVERGROWN_PASSAGE = 'overgrown_passage',
}

export interface PathType {
  id: Path;
  name: string;
  color: string;
  campaigns: string[];
}

export interface PathTypeMap {
  [code: string]: PathType | undefined;
}

export interface ConnectionRestrictionType {
  id: ConnectionRestriction;
  name: string;
  color: string;
  campaigns: string[];
}

export interface ConnectionRestrictionMap {
  [code: string]: ConnectionRestrictionType | undefined;
}

export interface DeckMeta {
  background?: string;
  specialty?: string;
  [key: string]: string | boolean | number | undefined;
}

export interface Slots {
  [code: string]: number | undefined;
}
export interface AspectStats {
  awa: number;
  fit: number;
  foc: number;
  spi: number;
}

export type DeckCardError =
  'need_two_cards' |
  'invalid_role' |
  'too_many_duplicates' |
  'invalid_aspect_levels' |
  'invalid_outside_interest';

export type DeckError =
  'invalid_aspects' |
  'invalid_background' |
  'invalid_specialty' |
  'too_many_duplicates' |
  'personality' |
  'too_many_foc_personality' |
  'too_many_awa_personality' |
  'too_many_fit_personality' |
  'too_many_spi_personality' |
  'background' |
  'too_many_background' |
  'specialty' |
  'too_many_specialty' |
  'role' |
  'invalid_outside_interest' |
  'outside_interest' |
  'too_many_outside_interest' |
  'too_many_cards' |
  'too_few_cards' |
  DeckCardError;
