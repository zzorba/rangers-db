import { useCallback, useEffect, useMemo } from 'react';

import { CardFragment, useGetAllCardsQuery, useGetCardsUpdatedAtQuery } from '../generated/graphql/apollo-schema';
import { useLocale } from '../lib/TranslationProvider';
import { filter } from 'lodash';
import { CardsMap, useCardsMap } from './hooks';


export function useCardNeedUpdate(): [boolean, () => void] {
  const { locale } = useLocale();
  const { data: cardData, refetch, loading, error } = useGetAllCardsQuery({
    variables: {
      locale,
    },
    fetchPolicy: 'cache-only',
  });
  const { data: updatedData} = useGetCardsUpdatedAtQuery({
    variables: {
      locale,
    },
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (!loading && !error && !cardData?.cards.length) {
      // This is our initial fetch of data.
      refetch();
    }
  }, [loading, error, cardData, refetch]);
  const forceRefresh = useCallback(() => {
    refetch({
      locale,
    });
  }, [refetch, locale]);
  return [
    !!(cardData?.updated_at.length && updatedData?.updated_at.length && cardData.updated_at[0].updated_at !== updatedData.updated_at[0].updated_at),
    forceRefresh,
  ];
}

export function useAllCards(): CardFragment[] | undefined {
  const { locale } = useLocale();
  const { data } = useGetAllCardsQuery({
    variables: {
      locale,
    },
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