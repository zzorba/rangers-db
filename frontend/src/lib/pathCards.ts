// frontend/src/lib/pathCards.ts

export type PathCardAction = 'moved' | 'removed';
export type PathCardSetType = 'location' | 'path';  // 'location' usa LocationIcon, 'path' usa PathIcon

export interface PathCardDefinition {
  code: string;
  action: PathCardAction;
  set_id: string;
  set_type: PathCardSetType;  // Indica se usare LocationIcon o PathIcon
  destination?: string;  // Solo per le carte "moved"
  name: { [locale: string]: string };
}

export const PATH_CARDS: PathCardDefinition[] = [
  // ============================================
  // PERMANENTLY MOVED
  // ============================================
  {
    code: '01322_tala_the_red_exile',
    action: 'moved',
    set_id: 'the_valley',
    set_type: 'location',
    destination: 'the_tumbledown',
    name: {
      en: 'Tala the Red, Exile',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '04018_olyv_aspirant_ranger',
    action: 'moved',
    set_id: 'the_valley',  // <-- cambia qui
    set_type: 'location',
    destination: 'lone_tree_station',  // la destinazione resta corretta
    name: {
      en: 'Olyv, Ranger Aspirant',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },

  // ============================================
  // PERMANENTLY REMOVED
  // ============================================
  {
    code: '01326_umbra',
    action: 'removed',
    set_id: 'the_valley',
    set_type: 'location',
    name: {
      en: 'Umbra',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '01327_quiet',
    action: 'removed',
    set_id: 'the_valley',
    set_type: 'location',
    name: {
      en: 'Quiet',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '01328_ol_bloody_clicker',
    action: 'removed',
    set_id: 'the_valley',
    set_type: 'location',
    name: {
      en: "Ol' Bloody Clicker",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '01368_aell_ambitious_shaper',
    action: 'removed',
    set_id: 'marsh_of_rebirth',
    set_type: 'location',
    name: {
      en: 'Aell, Ambitious Shaper',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '04019_deadfall',
    action: 'removed',
    set_id: 'the_valley',
    set_type: 'location',
    name: {
      en: 'Deadfall',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '03308_lost_lutrinal',
    action: 'removed',
    set_id: 'the_chimney',
    set_type: 'location',
    name: {
      en: 'Lost Lutrinal',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '03340_crimson_guardian',
    action: 'removed',
    set_id: 'the_arcology',
    set_type: 'location',
    name: {
      en: 'Crimson Guardian',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '03322_archivist_spirit',
    action: 'removed',
    set_id: 'arboretum_of_memory',
    set_type: 'location',
    name: {
      en: 'Archivist Spirit',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '03337_wandered_spirit',
    action: 'removed',
    set_id: 'the_arcology',
    set_type: 'location',
    name: {
      en: 'Wandered Spirit',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '01265_caustic_mulcher',
    action: 'removed',
    set_id: 'woods',
    set_type: 'path',  // Usa PathIcon invece di LocationIcon
    name: {
      en: 'Caustic Mulcher',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '03314_wild_scuttlebus',
    action: 'removed',
    set_id: 'artery',
    set_type: 'location',
    name: {
      en: 'Wild Scuttlebus',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '03316_gardener_spirit',
    action: 'removed',
    set_id: 'mycelial_conclave',
    set_type: 'location',
    name: {
      en: 'Gardener Spirit',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: '01371_kasende_expert_hunter',
    action: 'removed',
    set_id: 'the_tumbledown',
    set_type: 'location',
    name: {
      en: 'Kasende, Expert Hunter',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
];

// Helper function per trovare una carta dal code
export function getPathCardByCode(code: string): PathCardDefinition | undefined {
  return PATH_CARDS.find(c => c.code === code);
}

// Helper function per ottenere il nome tradotto
export function getPathCardName(code: string, locale: string): string {
  const card = getPathCardByCode(code);
  if (!card) return code;
  return card.name[locale] || card.name['en'] || code;
}

// Helper function per filtrare le carte per azione
export function getPathCardsByAction(action: PathCardAction): PathCardDefinition[] {
  return PATH_CARDS.filter(c => c.action === action);
}

// Helper function per filtrare le carte per set
export function getPathCardsBySet(set_id: string): PathCardDefinition[] {
  return PATH_CARDS.filter(c => c.set_id === set_id);
}
