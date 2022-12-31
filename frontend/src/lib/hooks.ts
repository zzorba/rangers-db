import { useCallback, useEffect, useMemo } from 'react';
import { forEach } from 'lodash';
import Router,{ useRouter } from 'next/router';
import { t } from '@lingui/macro';

import { useAuth } from './AuthContext';
import { CardFragment, SetTypeFragment, useLikeDeckMutation, useUnlikeDeckMutation } from '../generated/graphql/apollo-schema';
import { AspectMap, DeckCardError, DeckError, MapLocation, MapLocations, PathType, PathTypeMap } from '../types/types';

export function useRequireAuth() {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !authUser) {
      const redirect = router.query['redirect'];
      if (redirect) {
        if (typeof redirect === 'string') {
          Router.replace({ pathname: '/login', query: { redirect: redirect }});
        } else {
          Router.replace({ pathname: '/login', query: { redirect: redirect[0] }});
        }
      }
      Router.replace({ pathname: '/login', query: { redirect: router.pathname }});
    }
  }, [loading, authUser, router]);
}

export function usePostLoginRedirect(): string | undefined {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const redirect = useMemo(() => {
    const redirect = router.query['redirect'];
    if (redirect) {
      if (typeof redirect === 'string') {
        return redirect;
      } else {
        return redirect[0];
      }
    }
    return undefined;
  }, [router]);
  useEffect(() => {
    if (!loading && authUser) {
      if (redirect && redirect.startsWith('/')) {
        Router.push(redirect);
      } else {
        Router.push('/');
      }
    }
  }, [loading, authUser, redirect]);
  return redirect;
}

export interface CategoryTranslation {
  name: string;
  options: { [set: string]: string | undefined };
}

export interface CategoryTranslations {
  [id: string]: CategoryTranslation | undefined;
}

export function useCategoryTranslations(sets?: SetTypeFragment[]): CategoryTranslations {
  return useMemo(() => {
    const r: { [category: string]: CategoryTranslation | undefined }  = {};
    forEach(sets, cat => {
      if (cat.id && cat.name) {
        const trans: CategoryTranslation = {
          name: cat.name,
          options: {},
        };
        forEach(cat.sets, set => {
          if (set.id && set.name) {
            trans.options[set.id] = set.name;
          }
        });
        r[cat.id] = trans;
      }
    });
    return r;
  }, [sets]);
}

export interface CardsMap {
  [code: string]: CardFragment | undefined;
}
export function useCardsMap(cards?: CardFragment[]): CardsMap {
  return useMemo(() => {
    const r: CardsMap = {};
    forEach(cards, c => {
      if (c.id) {
        r[c.id] = c;
      }
    });
    return r;
  }, [cards]);
}

export function useRouterPathParam<T=string>(
  key: string,
  parse: (s: string) => T | undefined,
  redirect: string = '/'
): [T | undefined, boolean] {
  const router = useRouter();
  const rawParam = router.query[key];
  const id = typeof rawParam === 'string' ? rawParam : '';
  const cleanId = useMemo(() => parse(id), [parse, id]);
  useEffect(() => {
    if (router.isReady && !cleanId) {
      Router.push(redirect);
    }
  }, [cleanId, redirect, router.isReady]);
  return [cleanId, router.isReady];
}

export type DeckErrorTranslations = { [error in DeckError]: string };
export type DeckCardErrorTranslations = { [error in DeckCardError]: string };

export function getDeckErrors(): DeckErrorTranslations {
  return {
    invalid_aspects: t`Chosen aspects are invalid.`,
    too_many_duplicates: t`Too many cards with the same name.`,
    need_two_cards: t`You must include two of each card in your starting deck.`,
    personality: t`Not enough personality cards.`,
    too_many_awa_personality: t`Too many AWA personality cards.`,
    too_many_spi_personality: t`Too many SPI personality cards.`,
    too_many_foc_personality: t`Too many FOC personality cards.`,
    too_many_fit_personality: t`Too many FIT personality cards.`,
    background: t`Not enough background cards.`,
    too_many_background: t`Too many cards of the chosen background.`,
    specialty: t`Not enough specialty cards.`,
    too_many_specialty: t`Too many cards of the chosen specialty.`,
    role: t`You must choose a role card.`,
    outside_interest: t`Not enough outside interest cards.`,
    invalid_background: t`Contains too many cards that do not match your chosen background.`,
    invalid_specialty: t`Contains too many cards that do not match your chosen background.`,
    invalid_role: t`Your role card does not match your chosen specialty.`,
    invalid_aspect_levels: t`Your deck contains cards with aspect requirements that are not allowed.`,
    invalid_outside_interest: t`Your outside interest card cannot have the Expert trait.`,
    too_many_outside_interest: t`There are too many outside interest cards in the deck.`,
    too_many_cards: t`Too many cards. When making deck changes while camping, you should remove cards to make room for rewards to maintain a 30 card deck.`,
    too_few_cards: t`Not enough cards. When reward cards are removed while camping, you must add back cards from your original deck to maintain a 30 card deck.`,
  };
}
export function getDeckCardErrors(): DeckCardErrorTranslations {
  return {
    too_many_duplicates: t`There are too many cards with this card's name in your deck.`,
    need_two_cards: t`When starting a campaign, you must include two of each card in your deck.`,
    invalid_role: t`This role card does not match your chosen specialty.`,
    invalid_aspect_levels: t`This card's aspect requirement is not satisfied by your chosen aspects.`,
    invalid_outside_interest: t`Outside interest cards cannot have the Expert trait.`,
  };
}

export function getAspectMap(): AspectMap {
  return {
    AWA: {
      name: t`Awareness`,
      short_name: t`AWA`,
    },
    FOC: {
      name: t`Focus`,
      short_name: t`FOC`,
    },
    FIT: {
      name: t`Fitness`,
      short_name: t`FIT`,
    },
    SPI: {
      name: t`Spirit`,
      short_name: t`SPI`,
    },
  };
}

export function getPathTypes(): PathTypeMap {
  const r: PathTypeMap = {};
  const paths: PathType[] = [
    {
      name: t`Old-growth`,
      icon: 'old_growth',
      color: '#924030',
    },
    {
      name: t`Mountain Pass`,
      icon: 'mountain_pass',
      color: '#1b211e',
    },
    {
      name: t`Woods`,
      icon: 'woods',
      color: '#46932b',
    },
    {
      name: t`Lakeshore`,
      icon: 'lakeshore',
      color: '#3f4f6b',
    },
    {
      name: t`Grassland`,
      icon: 'grassland',
      color: '#d08e10',
    },
    {
      name: t`Ravine`,
      icon: 'ravine',
      color: '#67666b',
    },
    {
      name: t`Swamp`,
      icon: 'swamp',
      color: '#7a3d63',
    },
    {
      name: t`River`,
      icon: 'river',
      color: '#5996aa',
    },
  ];
  forEach(paths, p => {
    r[p.icon] = p;
  })
  return r;
}


export function getMapLocations(): MapLocations {
  const r: MapLocations = {};
  const paths: MapLocation[] = [
    {
      id: 'atrox_mountain',
      name: t`Atrox Mountain`,
      background: true,
      type: 'trail',
    },
    {
      id: 'northern_outpost',
      name: t`Northern Outpost`,
      type: 'location',
    },
    {
      id: 'lone_tree_station',
      name: t`Lone Tree Station`,
      background: true,
      type: 'location',
    },
    {
      id: 'white_sky',
      name: t`White Sky`,
      type: 'location',
    },
    {
      id: 'golden_shore',
      name: t`Golden Shore`,
      type: 'trail',
    },
    {
      id: 'mount_nim',
      name: t`Mount Nim`,
      type: 'trail',
    },
    {
      id: 'ancestors_grove',
      name: t`Ancestor's Grove`,
      type: 'trail',
    },
    {
      id: 'kobos_market',
      name: t`Kobo's Market`,
      type: 'trail',
    },
    {
      id: 'boulder_field',
      name: t`Boulder Field`,
      type: 'trail',
      background: true,
    },
    {
      id: 'the_fractured_wall',
      name: t`The Fractured Wall`,
      type: 'location',
    },
    {
      id: 'the_philosophers_garden',
      name: t`The Philosopher's Garden`,
      type: 'trail',
    },
    {
      id: 'the_high_basin',
      name: t`The High Basin`,
      type: 'trail',
    },
    {
      id: 'branch',
      name: t`Branch`,
      type: 'location',
    },
    {
      id: 'spire',
      name: t`Spire`,
      type: 'location',
      background: true,
    },
    {
      id: 'crossroads_station',
      name: t`Crossroads Station`,
      type: 'trail',
    },
    {
      id: 'the_furrow',
      name: t`The Furrow`,
      type: 'trail',
    },
    {
      id: 'biologists_outpost',
      name: t`Biologist's Outpost`,
      type: 'trail',
      background: true,
    },
    {
      id: 'terravore',
      name: t`Terravore`,
      type: 'trail',
    },
    {
      id: 'mound_of_the_navigator',
      name: t`Mound of the Navigator`,
      type: 'trail',
      background: true,
    },
    {
      id: 'the_greenbridge',
      name: t`The Greenbridge`,
      type: 'trail',
      background: true,
    },
    {
      id: 'michaels_bog',
      name: t`Michael's Bog`,
      type: 'trail',
    },
    {
      id: 'the_cypress_citadel',
      name: t`The Cypress Citadel`,
      type: 'trail',
    },
    {
      id: 'marsh_of_rebirth',
      name: t`Marsh of Rebirth`,
      type: 'location',
    },
    {
      id: 'sunken_outpost',
      name: t`Sunken Outpost`,
      type: 'trail',
      background: true,
    },
    {
      id: 'the_frowning_gate',
      name: t`The Frowning Gate`,
      type: 'trail',
    },
    {
      id: 'bowl_of_the_sun',
      name: t`Bowl of the Sun`,
      type: 'trail',
    },
    {
      id: 'the_alluvial_ruins',
      name: t`The Alluvial Ruins`,
      type: 'trail',
    },
    {
      id: 'the_tumbledown',
      name: t`The Tumbledown`,
      type: 'location',
    },
    {
      id: 'watchers_rock',
      name: t`Watcher's Rock`,
      type: 'trail',
    },
    {
      id: 'archeological_outpost',
      name: t`Archeological Outpost`,
      type: 'trail',
      background: true,
    },
    {
      id: 'rings_of_the_moon',
      name: t`Rings of the Moon`,
      type: 'trail',
    },
    {
      id: 'the_concordant_ziggurats',
      name: t`The Concordant Ziggurats`,
      type: 'trail',
    },
    {
      id: 'meadow',
      name: t`Meadow`,
      type: 'location',
    },
    {
      id: 'stoneweaver_bridge',
      name: t`Stoneweaver Bridge`,
      type: 'trail',
      background: true,
    },
    {
      id: 'greenbriar_knoll',
      name: t`Greenbriar Knoll`,
      type: 'trail',
    },
    {
      id: 'the_plummet',
      name: t`The Plummet`,
      type: 'trail',
    },
    {
      id: 'headwaters_station',
      name: t`Headwaters Station`,
      type: 'trail',
      background: true,
    },
  ];
  forEach(paths, p => {
    r[p.id] = p;
  })
  return r;
}

interface BasicDeck {
  id?: number | null | undefined;
  liked_by_user?: boolean | null | undefined;
}
export function useLikeAction<T extends BasicDeck>(updateCache: (d: T, liked: boolean) => void): (deck: T) => Promise<string | undefined> {
  const { authUser } = useAuth();
  const [doLike] = useLikeDeckMutation();
  const [doUnlike] = useUnlikeDeckMutation();
  return useCallback(async(deck: T) => {
    if (authUser && deck.id) {
      if (deck.liked_by_user) {
        const r = await doUnlike({
          variables: {
            deckId: deck.id,
            userId: authUser.uid,
          },
        });
        if (r.errors?.length) {
          return r.errors[0].message;
        }
        updateCache(deck, false);
      } else {
        const r = await doLike({
          variables: {
            deckId: deck.id,
          },
        });
        if (r.errors?.length) {
          return r.errors[0].message;
        }
        updateCache(deck, true);
      }
    }
    return undefined;
  }, [doLike, doUnlike, updateCache, authUser]);
}