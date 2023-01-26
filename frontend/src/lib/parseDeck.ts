import { concat, forEach, map, flatMap, uniq, sumBy, keys, remove } from 'lodash';
import { t } from '@lingui/macro';

import { AspectStats, AWA, DeckCardError, DeckError, DeckMeta, FIT, FOC, Slots, SPI } from '../types/types';
import { CardsMap, CategoryTranslations } from '../lib/hooks';
import { CardFragment } from '../generated/graphql/apollo-schema';

export interface HeaderItem {
  type: 'header';
  id: string;
  title: string;
  problem: DeckError[] | undefined;
}
export interface CardItem {
  type: 'card';
  id: string;
  card: CardFragment;
  count: number;
  problem: DeckCardError[] | undefined;
}
export interface DescriptionItem {
  type: 'description';
  id: string;
  description: string;
  problem?: undefined;
}
export type Item = HeaderItem | CardItem | DescriptionItem;

export interface DeckChanges {
  addedCards: Slots;
  removedCards: Slots;

  addedCollectionCards: Slots;
  returnedCollectionCards: Slots;
}

function computeDeckChanges(
  slots: Slots,
  sideSlots: Slots,
  previousDeck?: {
    slots?: Slots;
    side_slots?: Slots;
  }
): DeckChanges | undefined {
  if (!previousDeck) {
    return undefined;
  }
  const previousSlots = previousDeck.slots || {};
  const previousSideSlots = previousDeck.side_slots || {};
  const addedCards: Slots = {};
  const removedCards: Slots = {};
  const addedCollectionCards: Slots = {};
  const returnedCollectionCards: Slots = {};

  forEach(uniq(concat(keys(slots), keys(sideSlots), keys(previousDeck.side_slots), keys(previousDeck.slots))), (code) => {
    if (slots[code] === previousSlots[code] && sideSlots[code] === previousSideSlots[code]) {
      // No change.
      return;
    }

    if (((slots[code] || 0) + (sideSlots[code] || 0)) === ((previousSlots[code] || 0) + (previousSideSlots[code] || 0))) {
      // Normal swaps.
      const difference = (slots[code] || 0) - (previousSlots[code] || 0);
      if (difference > 0) {
        addedCards[code] = difference;
      } else {
        removedCards[code] = difference;
      }
    } else {
      // Collection swaps
      const difference = ((slots[code] || 0) + (sideSlots[code] || 0)) - ((previousSlots[code] || 0) + (previousSideSlots[code] || 0));
      if (difference > 0) {
        addedCollectionCards[code] = difference;
      } else {
        returnedCollectionCards[code] = difference;
      }
    }
  });
  return {
    addedCards,
    removedCards,
    addedCollectionCards,
    returnedCollectionCards,
  };
}
export interface ParsedDeck {
  stats: AspectStats;
  background: string | undefined;
  specialty: string | undefined;
  role: CardFragment | undefined;

  problem: DeckError[] | undefined;
  roleProblems: DeckError[] | undefined;
  cards: Item[];
  loading: boolean;
  deckSize: number;
  maladyCount: number;

  changes?: DeckChanges;
}
export default function parseDeck(
  aspects: AspectStats,
  meta: DeckMeta,
  slots: Slots,
  sideSlots: Slots,
  cards: CardsMap,
  categoryTranslations: CategoryTranslations,
  previousDeck: { meta?: DeckMeta; slots?: Slots; side_slots?: Slots } | undefined
): ParsedDeck {
  const missingCards: string[] = [];
  const stats: { [key: string]: number } = {
    [AWA]: aspects.awa,
    [FIT]: aspects.fit,
    [FOC]: aspects.foc,
    [SPI]: aspects.spi,
  };
  const role = typeof meta.role === 'string' ? meta.role : '';
  const roleCard = role ? cards[role] : undefined;
  const background = typeof meta.background === 'string' ? meta.background : undefined;
  const specialty = typeof meta.specialty === 'string' ? meta.specialty : undefined;
  let items: CardItem[] = flatMap(slots, (count, code) => {
    if (typeof count !== 'number' || count === 0) {
      return [];
    }
    const card = cards[code];
    if (!card) {
      missingCards.push(code);
      return [];
    }
    const problems: DeckCardError[] = [];
    if (count > 2) {
      if (card.set_id !== 'malady') {
        problems.push('too_many_duplicates');
      }
    } else if (!previousDeck && count !== 2) {
      problems.push('need_two_cards');
    }
    if (card.aspect_id && card.level !== null && card.level !== undefined) {
      if (stats[card.aspect_id] < card.level) {
        problems.push('invalid_aspect_levels');
      }
    }
    return {
      type: 'card',
      id: code,
      card,
      count,
      problem: problems.length ? problems : undefined,
    };
  });
  const globalProblems: DeckError[] = [];
  const roleProblems: DeckError[] = [];

  if (!roleCard) {
    roleProblems.push('role');
  } else if (roleCard.set_type_id !== 'specialty' || roleCard.type_id !== 'role' || roleCard.set_id !== specialty) {
    roleProblems.push('invalid_role');
  }
  const backgroundErrors: DeckError[] = [];
  const specialtyErrors: DeckError[] = [];
  const outsideInterestErrors: DeckError[] = [];
  const personalityErrors: DeckError[] = [];
  let splashFaction: 'background' | 'specialty' | undefined = undefined;
  const deckSize = sumBy(items, i => i.type === 'card' && i.card.set_id !== 'malady' ? i.count : 0);
  if (previousDeck) {
    if (deckSize < 30) {
      globalProblems.push('too_few_cards');
    } else if (deckSize > 30) {
      globalProblems.push('too_many_cards');
    }
  } else {
    // Starting decks have more rules.
    let backgroundNonExpert = 0;
    let backgroundCount = 0;
    let specialtyNonExpert = 0;
    let specialtyCount = 0;
    let splashCount = 0;
    let personalityCount: {
      [aspect: string]: number;
    } = { [AWA]: 0, [FIT]: 0, [FOC]: 0, [SPI]: 0 };
    items = map(items, i => {
      if (i.type !== 'card') {
        return i;
      }
      const problems = [...(i.problem || [])];
      if (i.card.set_id === 'personality') {
        if (i.card.aspect_id) {
          switch (i.card.aspect_id) {
            case AWA: {
              personalityCount.AWA += 2;
              if (personalityCount.AWA > 2) {
                personalityErrors.push('too_many_awa_personality');
              }
              break;
            }
            case FOC: {
              personalityCount.FOC += 2;
              if (personalityCount.FOC > 2) {
                personalityErrors.push('too_many_foc_personality');
              }
              break;
            }
            case FIT: {
              personalityCount.FIT += 2;
              if (personalityCount.FIT > 2) {
                personalityErrors.push('too_many_fit_personality');
              }
              break;
            }
            case SPI: {
              personalityCount.SPI += 2;
              if (personalityCount.SPI > 2) {
                personalityErrors.push('too_many_spi_personality');
              }
              break;
            }
          }
        }
      } else {
        switch (i.card.set_type_id) {
          case 'background':
            if (i.card.set_id === background) {
              backgroundCount += i.count;
              if (!i.card.real_traits || i.card.real_traits.indexOf('Expert') === -1) {
                backgroundNonExpert += i.count;
              }
              if (backgroundCount > 10) {
                if (backgroundCount > 12 || splashCount >= 2) {
                  backgroundErrors.push('too_many_background')
                } else if (backgroundNonExpert < 2) {
                  backgroundErrors.push('invalid_outside_interest');
                } else {
                  splashFaction = 'background';
                  splashCount += i.count;
                }
              }
            } else {
              if (i.card.real_traits && i.card.real_traits.indexOf('Expert') !== -1) {
                problems.push('invalid_outside_interest');
              } else {
                splashCount += i.count;
                if (splashCount > 2){
                  outsideInterestErrors.push('too_many_outside_interest');
                }
              }
            }
            break;
          case 'specialty':
            if (i.card.set_id === specialty) {
              specialtyCount += i.count;
              if (!i.card.real_traits || i.card.real_traits.indexOf('Expert') === -1) {
                specialtyNonExpert += i.count;
              }
              if (specialtyCount > 10) {
                if (specialtyCount > 12 || splashCount >= 2) {
                  specialtyErrors.push('too_many_specialty')
                } else if (specialtyNonExpert < 2) {
                  specialtyErrors.push('invalid_outside_interest');
                } else {
                  splashFaction = 'specialty';
                  splashCount += i.count;
                }
              }
            } else {
              if (i.card.real_traits && i.card.real_traits.indexOf('Expert') !== -1) {
                problems.push('invalid_outside_interest');
              } else {
                splashCount += i.count;
                if (splashCount > 2){
                  outsideInterestErrors.push('too_many_outside_interest');
                }
              }
            }
            break;
        }
      }
      return {
        ...i,
        problem: problems.length ? problems : undefined,
      };
    });
    if (
      personalityCount.AWA !== 2 ||
      personalityCount.FIT !== 2 ||
      personalityCount.FOC !== 2 ||
      personalityCount.SPI !== 2
    ) {
      personalityErrors.push('personality')
    }
    if (specialtyCount < 10) {
      specialtyErrors.push('specialty');
    }
    if (backgroundCount < 10) {
      backgroundErrors.push('background');
    }
    if (splashCount < 2) {
      outsideInterestErrors.push('outside_interest');
    }
  }
  const backgroundName = background && categoryTranslations.background?.options[background];
  const specialtyName = specialty && categoryTranslations.specialty?.options[specialty];
  const personalityCards: Item[] = [
    {
      type: 'header',
      id: 'personality',
      title: t`Personality`,
      problem: personalityErrors.length ? uniq(personalityErrors) : undefined,
    },
  ];
  const backgroundCards: Item[] = [
    {
      type: 'header',
      id: 'background',
      title: backgroundName ? t`Background: ${backgroundName}` : t`Background`,
      problem: backgroundErrors.length ? uniq(backgroundErrors) : undefined,
    },
  ];
  const specialtyCards: Item[] = [
    {
      type: 'header',
      id: 'specialty',
      title: specialtyName ? t`Specialty: ${specialtyName}` : t`Specialty`,
      problem: specialtyErrors.length ? uniq(specialtyErrors) : undefined,
    },
  ];
  const outsideInterestCards: Item[] = [
    {
      type: 'header',
      title: t`Outside Interest`,
      id: 'outside_interest',
      problem: outsideInterestErrors.length ? uniq(outsideInterestErrors) : undefined,
    },
  ];
  const otherCards: Item[] = [
    {
      type: 'header',
      id: 'other',
      title: t`Rewards and Maladies`,
      problem: undefined,
    },
  ];
  forEach(items, i => {
    if (i.type === 'card') {
      if (i.card.set_id === 'personality') {
        personalityCards.push(i);
        return;
      }
      if (i.card.set_type_id === 'background') {
        if (i.card.set_id === background) {
          backgroundCards.push(i);
        } else {
          outsideInterestCards.push(i);
        }
        return;
      }
      if (i.card.set_type_id === 'specialty') {
        if (i.card.set_id === specialty) {
          specialtyCards.push(i);
        } else {
          outsideInterestCards.push(i);
        }
        return;
      }
      otherCards.push(i);
    }
  });
  if (splashFaction) {
    switch (splashFaction) {
      case 'background':
        outsideInterestCards.push({
          type: 'description',
          id: 'splash',
          description: t`One of the chosen background cards is counting towards outside interest.`,
        });
        break;
      case 'specialty':
        outsideInterestCards.push({
          type: 'description',
          id: 'splash',
          description: t`One of the chosen specialty cards is counting towards outside interest.`,
        });
        break;
    }
  }

  const result = [
    ...personalityCards,
    ...backgroundCards,
    ...specialtyCards,
    ...outsideInterestCards,
    ...(otherCards.length > 1 || otherCards[0].problem?.length ? otherCards : []),
  ];
  return {
    stats: aspects,
    background,
    specialty,
    role: roleCard,
    problem: uniq([
      ...globalProblems,
      ...flatMap(result, i => i.problem || []),
    ]),
    roleProblems,
    cards: result,
    loading: missingCards.length > 0,
    deckSize,
    maladyCount: sumBy(items, i => i.type === 'card' && i.card.set_id === 'malady' ? i.count : 0),
    changes: computeDeckChanges(slots, sideSlots, previousDeck),
  };
}