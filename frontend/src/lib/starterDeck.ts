import { Slots } from '../types/types';

export interface StarterDeck {
  meta: {
    role: string;
    background: string;
    specialty: string;
  };
  foc: number;
  spi: number;
  awa: number;
  fit: number;
  slots: Slots;
}

export const STARTER_DECKS: StarterDeck[] = [
  {
    meta: {
      role: '01037',
      background: 'traveler',
      specialty: 'explorer',
    },
    foc: 1,
    spi: 2,
    awa: 2,
    fit: 3,
    slots: {
      '01001': 2,
      '01039': 2,
      '01056': 2,
      '01099': 2,
      '01005': 2,
      '01101': 2,
      '01105': 2,
      '01003': 2,
      '01044': 2,
      '01006': 2,
      '01093': 2,
      '01008': 2,
      '01048': 2,
      '01042': 2,
      '01043': 2,
    }
  },
  {
    meta: {
      role: '01066',
      background: 'shepherd',
      specialty: 'conciliator',
    },
    foc: 2,
    spi: 3,
    awa: 1,
    fit: 2,
    slots: {
      '01023': 2,
      '01073': 2,
      '01104': 2,
      '01078': 2,
      '01026': 2,
      '01107': 2,
      '01095': 2,
      '01067': 2,
      '01097': 2,
      '01022': 2,
      '01070': 2,
      '01025': 2,
      '01027': 2,
      '01077': 2,
      '01018': 2,
    },
  },
  {
    meta: {
      role: '01079',
      background: 'forager',
      specialty: 'shaper',
    },
    foc: 2,
    spi: 1,
    awa: 3,
    fit: 2,
    slots: {
      '01102': 2,
      '01084': 2,
      '01081': 2,
      '01085': 2,
      '01034': 2,
      '01029': 2,
      '01090': 2,
      '01031': 2,
      '01100': 2,
      '01094': 2,
      '01083': 2,
      '01082': 2,
      '01028': 2,
      '01106': 2,
      '01035': 2,
    },
  },
  {
    meta: {
      role: '01051',
      background: 'artisan',
      specialty: 'artificer',
    },
    foc: 3,
    spi: 2,
    awa: 2,
    fit: 1,
    slots: {
      '01062': 2,
      '01061': 2,
      '01012': 2,
      '01059': 2,
      '01060': 2,
      '01096': 2,
      '01011': 2,
      '01007': 2,
      '01017': 2,
      '01013': 2,
      '01108': 2,
      '01015': 2,
      '01098': 2,
      '01103': 2,
      '01053': 2,
    },
  },
];