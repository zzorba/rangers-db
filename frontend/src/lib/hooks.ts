import { useEffect, useMemo } from 'react';
import { forEach } from 'lodash';
import Router,{ useRouter } from 'next/router';
import { t } from 'ttag';

import { useAuth } from './AuthContext';
import { CardFragment, SetTypeFragment } from '../generated/graphql/apollo-schema';
import { AspectMap, DeckCardError, DeckError } from '../types/types';

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
    too_many_outside_interest: t`There are too many outside interest cards in the deck.`
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
      short_name: t`Fit`,
    },
    SPI: {
      name: t`Spirit`,
      short_name: t`SPI`,
    },
  };
}
export function useDeckErrors(): DeckErrorTranslations  {
  return useMemo(() => getDeckErrors(), []);
}