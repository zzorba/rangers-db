import { useCallback, useEffect, useMemo } from 'react';

import { CardFragment, useGetAllCardsQuery, useGetCardsUpdatedAtQuery, useGetPackCollectionQuery } from '../generated/graphql/apollo-schema';
import { useLocale } from '../lib/TranslationProvider';
import { filter } from 'lodash';
import { CardsMap, useCardsMap } from './hooks';
import { useGraphql } from './GraphqlContext';
import { useAuth } from './AuthContext';


export function useCardNeedUpdate(): [boolean, () => void] {
  const { locale } = useLocale();
  const { anonClient } = useGraphql();
  const { data: cardData, refetch, loading, error } = useGetAllCardsQuery({
    variables: {
      locale,
    },
    client: anonClient,
    fetchPolicy: 'cache-only',
  });
  const { data: updatedData, loading: updatedLoading} = useGetCardsUpdatedAtQuery({
    variables: {
      locale,
    },
    client: anonClient,
    fetchPolicy: 'no-cache',
  });

  useEffect(() => {
    if (!loading && !error) {
      if (!cardData?.cards.length) {
        console.log('Fetching cards');
        // This is our initial fetch of data.
        refetch();
      } else {
        console.log(`Cards are cached.`);
      }
    }
  }, [loading, error, cardData, refetch]);
  const forceRefresh = useCallback(() => {
    refetch({
      locale,
    });
  }, [refetch, locale]);
  const needsUpdate = useMemo(() => {
    const noUpdateData = !updatedLoading && !updatedData?.card_updated_at.length;
    const noCardData = !loading && !cardData?.all_updated_at.length;
    const outOfDate = !!cardData?.all_updated_at.length && !!updatedData?.card_updated_at.length && cardData.all_updated_at[0].updated_at !== updatedData.card_updated_at[0].updated_at;
    return noUpdateData || noCardData || outOfDate;
  }, [updatedLoading, updatedData, cardData, loading]);
  return [
    needsUpdate,
    forceRefresh,
  ];
}

export function useAllCards(tabooSetId: string | undefined): CardFragment[] | undefined {
  const { locale } = useLocale();
  const { anonClient } = useGraphql();
  const { data } = useGetAllCardsQuery({
    variables: {
      locale,
    },
    client: anonClient,
    fetchPolicy: 'cache-only',
  });
  const matchingTabooCodes = useMemo(() => {
    const codes = data?.cards.filter(c => c.taboo_id === tabooSetId).map(c => c.code);
    return new Set(codes);
  }, [data, tabooSetId]);
  return useMemo(() => data?.cards.filter(c => c.taboo_id === tabooSetId || (!c.taboo_id && !matchingTabooCodes.has(c.code))), [data?.cards, matchingTabooCodes, tabooSetId]);
}

export function useCard(code: string | undefined, tabooSetId: string | undefined): CardFragment | undefined {
  const allCards = useAllCards(tabooSetId);
  return useMemo(() => {
    if (allCards && code) {
      return allCards.find(card => card.code === code && (card.taboo_id ?? undefined) === tabooSetId);
    }
    return undefined;
  }, [allCards, code, tabooSetId]);
}


export function useAllCardsMap(tabooSetId: string | undefined): CardsMap {
  const allCards = useAllCards(tabooSetId);
  return useCardsMap(allCards);
}

function useRoleCards(tabooSetId: string | undefined): CardFragment[] | undefined {
  const allCards = useAllCards(tabooSetId);
  return useMemo(() => allCards ? filter(allCards, card => card.type_id === 'role') : undefined, [allCards]);
}

export function useRoleCardsMap(tabooSetId: string | undefined): CardsMap {
  const roleCards = useRoleCards(tabooSetId);
  return useCardsMap(roleCards);
}