import { useCallback, useEffect, useMemo } from 'react';

import { CardFragment, useGetAllCardsQuery, useGetCardsUpdatedAtQuery } from '../generated/graphql/apollo-schema';
import { useLocale } from '../lib/TranslationProvider';
import { filter } from 'lodash';
import { CardsMap, useCardsMap } from './hooks';
import { useGraphql } from './GraphqlContext';


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
    fetchPolicy: 'network-only',
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
  const needsUpdate = (!updatedLoading && !updatedData?.updated_at.length) || !!(cardData?.updated_at.length && updatedData?.updated_at.length && cardData.updated_at[0].updated_at !== updatedData.updated_at[0].updated_at);
  return [
    needsUpdate,
    forceRefresh,
  ];
}

export function useAllCards(): CardFragment[] | undefined {
  const { locale } = useLocale();
  const { anonClient } = useGraphql();
  const { data } = useGetAllCardsQuery({
    variables: {
      locale,
    },
    client: anonClient,
    fetchPolicy: 'cache-only',
  });
  return data?.cards;
}

export function useAllCardsMap(): CardsMap {
  const allCards = useAllCards();
  return useCardsMap(allCards);
}

export function useCards(): CardFragment[] | undefined {
  const allCards = useAllCards();
  return useMemo(() => allCards ? filter(allCards, card => !card.spoiler) : undefined, [allCards]);
}

export function useRoleCards(): CardFragment[] | undefined {
  const allCards = useAllCards();
  return useMemo(() => allCards ? filter(allCards, card => card.type_id === 'role') : undefined, [allCards]);
}

export function useRoleCardsMap(): CardsMap {
  const roleCards = useRoleCards();
  return useCardsMap(roleCards);
}