// frontend/src/lib/missions.ts

export interface MissionDefinition {
  code: string;
  cycles: string[];  // ['core'], ['loa'], or ['core', 'loa'] for shared
  name: { [locale: string]: string };
}

export const MISSIONS: MissionDefinition[] = [
  // ============================================
  // CORE MISSIONS
  // ============================================
  {
    code: 'journey',
    cycles: ['core', 'demo'],
    name: {
      en: 'Journey',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'biscuit_delivery',
    cycles: ['core', 'demo'],
    name: {
      en: 'Biscuit Delivery',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'accommodation',
    cycles: ['core', 'demo'],
    name: {
      en: 'Accommodation',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'intervention',
    cycles: ['core', 'demo'],
    name: {
      en: 'Intervention',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'rising_waters',
    cycles: ['core', 'demo'],
    name: {
      en: 'Rising Waters',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'watcher_in_the_brush',
    cycles: ['core', 'demo'],
    name: {
      en: 'Watcher in the Brush',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'sensor_network',
    cycles: ['core', 'demo'],
    name: {
      en: 'Sensor Network',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'secret_invasion',
    cycles: ['core', 'demo'],
    name: {
      en: 'Secret Invasion',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'trail_of_vines',
    cycles: ['core', 'demo'],
    name: {
      en: 'Trail of Vines',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'deeper_motives',
    cycles: ['core', 'demo'],
    name: {
      en: 'Deeper Motives',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'find_the_nest',
    cycles: ['core', 'demo'],
    name: {
      en: 'Find the Nest',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'into_the_nest',
    cycles: ['core', 'demo'],
    name: {
      en: 'Into the Nest',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'remove_the_reclaimers',
    cycles: ['core', 'demo'],
    name: {
      en: 'Remove the Reclaimers',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'the_valleys_secrets',
    cycles: ['core', 'demo'],
    name: {
      en: "The Valley's Secrets",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'lost_brother',
    cycles: ['core', 'demo'],
    name: {
      en: 'Lost Brother',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'washed_away',
    cycles: ['core', 'demo'],
    name: {
      en: 'Washed Away',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'worm_food',
    cycles: ['core', 'demo'],
    name: {
      en: 'Worm Food',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'gruesome_feast',
    cycles: ['core', 'demo'],
    name: {
      en: 'Gruesome Feast',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'invasion_stage_1',
    cycles: ['core', 'demo'],
    name: {
      en: 'Invasion - Stage 1',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'invasion_stage_2',
    cycles: ['core', 'demo'],
    name: {
      en: 'Invasion - Stage 2',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'spire_under_attack',
    cycles: ['core', 'demo'],
    name: {
      en: 'Spire Under Attack!',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'the_fall_of_spire',
    cycles: ['core', 'demo'],
    name: {
      en: 'The Fall of Spire',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'lure',
    cycles: ['core', 'demo'],
    name: {
      en: 'Lure',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'confront',
    cycles: ['core', 'demo'],
    name: {
      en: 'Confront',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'search',
    cycles: ['core', 'demo'],
    name: {
      en: 'Search',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'rescue',
    cycles: ['core', 'demo'],
    name: {
      en: 'Rescue',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'arcology_archaeology',
    cycles: ['core', 'demo'],
    name: {
      en: 'Arcology Archaeology',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },

  // ============================================
  // LEGACY OF THE ANCESTORS (LoA) MISSIONS
  // ============================================
  {
    code: 'the_descent',
    cycles: ['loa'],
    name: {
      en: 'The Descent',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'an_urgent_request',
    cycles: ['loa'],
    name: {
      en: 'An Urgent Request',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'the_long_dark',
    cycles: ['loa'],
    name: {
      en: 'The Long Dark',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'the_final_ascent',
    cycles: ['loa'],
    name: {
      en: 'The Final Ascent',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'following_a_lead',
    cycles: ['loa'],
    name: {
      en: 'Following a Lead',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'limited_time_offer',
    cycles: ['loa'],
    name: {
      en: 'Limited Time Offer',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'kobos_swap_meet',
    cycles: ['loa'],
    name: {
      en: "Kobo's Swap Meet",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'search_below',
    cycles: ['loa'],
    name: {
      en: 'Search Below',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'return_to_base_camp',
    cycles: ['loa'],
    name: {
      en: 'Return to Base Camp',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'survey_the_depths',
    cycles: ['loa'],
    name: {
      en: 'Survey the Depths',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'power_up',
    cycles: ['loa'],
    name: {
      en: 'Power Up',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'collapse',
    cycles: ['loa'],
    name: {
      en: 'Collapse!',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'buried_survey_team',
    cycles: ['loa'],
    name: {
      en: 'Buried Survey Team',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'breathe_easier',
    cycles: ['loa'],
    name: {
      en: 'Breathe Easier',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'spore_specimens',
    cycles: ['loa'],
    name: {
      en: 'Spore Specimens',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'artificial_adaptation',
    cycles: ['loa'],
    name: {
      en: 'Artificial Adaptation',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'assembly_required',
    cycles: ['loa'],
    name: {
      en: 'Assembly Required',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'to_the_heart_of_it',
    cycles: ['loa'],
    name: {
      en: 'To the Heart of It',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'heart_attack',
    cycles: ['loa'],
    name: {
      en: 'Heart Attack',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'contact_nal',
    cycles: ['loa'],
    name: {
      en: 'Contact Nal',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'spirit_council',
    cycles: ['loa'],
    name: {
      en: 'Spirit Council',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'overgrown',
    cycles: ['loa'],
    name: {
      en: 'Overgrown',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'jury_rigged',
    cycles: ['loa'],
    name: {
      en: 'Jury Rigged',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'cardiac_therapy',
    cycles: ['loa'],
    name: {
      en: 'Cardiac Therapy',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'clear',
    cycles: ['loa'],
    name: {
      en: 'Clear!',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'the_cage_crumbles',
    cycles: ['loa'],
    name: {
      en: 'The Cage Crumbles',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'escape',
    cycles: ['loa'],
    name: {
      en: 'Escape!',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'the_expeditions_path',
    cycles: ['loa'],
    name: {
      en: "The Expedition's Path",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'one_thousand_legs',
    cycles: ['loa'],
    name: {
      en: 'One Thousand Legs',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'before_the_mandibles',
    cycles: ['loa'],
    name: {
      en: 'Before the Mandibles',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'mycelial_networking',
    cycles: ['loa'],
    name: {
      en: 'Mycelial Networking',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'at_the_source',
    cycles: ['loa'],
    name: {
      en: 'At the Source',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'reclaimers_fate',
    cycles: ['loa'],
    name: {
      en: "Reclaimers' Fate",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'rattling_the_cage',
    cycles: ['loa'],
    name: {
      en: 'Rattling the Cage',
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'the_arcologys_secrets',
    cycles: ['loa'],
    name: {
      en: "The Arcology's Secrets",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },

  // ============================================
  // SPIRE IN BLOOM (SiB) MISSIONS
  // ============================================
  {
    code: 'cause_for_celebration',
    cycles: ['core'],
    name: {
      en: "Cause for Celebration",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'buzzkill',
    cycles: ['core'],
    name: {
      en: "Buzzkill",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'the_festival_begin',
    cycles: ['core'],
    name: {
      en: "The Festivities Begin",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'fun_and_games',
    cycles: ['core'],
    name: {
      en: "Fun and Games",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'lost_letter',
    cycles: ['core'],
    name: {
      en: "Lost Letter",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'flower_collection',
    cycles: ['core'],
    name: {
      en: "Flower Collection",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'pollen_collection',
    cycles: ['core'],
    name: {
      en: "Pollen Collection",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'supply_run',
    cycles: ['core'],
    name: {
      en: "Supply Run",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'return_trip',
    cycles: ['core'],
    name: {
      en: "Return Trip",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'tracking_destruction',
    cycles: ['core'],
    name: {
      en: "Tracking Destruction",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
  {
    code: 'stop_the_rampage',
    cycles: ['core'],
    name: {
      en: "Stop the Rampage",
      it: '',
      es: '',
      de: '',
      fr: '',
      ru: '',
    }
  },
];

// Helper function per trovare una missione dal code
export function getMissionByCode(code: string): MissionDefinition | undefined {
  return MISSIONS.find(m => m.code === code);
}

// Helper function per ottenere il nome tradotto
export function getMissionName(code: string, locale: string): string {
  const mission = getMissionByCode(code);
  if (!mission) return code;
  return mission.name[locale] || mission.name['en'] || code;
}

// Helper function per filtrare le missioni per ciclo
export function getMissionsByCycle(cycle: string): MissionDefinition[] {
  return MISSIONS.filter(m => m.cycles.includes(cycle));
}