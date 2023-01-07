import React, { useCallback } from 'react';
import { Box } from '@chakra-ui/react'
import { t } from '@lingui/macro';
import Head from 'next/head';

import { DeckDetailFragment, DeckDetailFragmentDoc, useGetAllCardsQuery, useGetDeckQuery } from '../../../../generated/graphql/apollo-schema';
import { useCardsMap, useLikeAction, useRouterPathParam } from '../../../../lib/hooks';
import LoadingPage from '../../../../components/LoadingPage';
import DeckDetail from '../../../../components/DeckDetail';
import { useLocale } from '../../../../lib/TranslationProvider';
import { useApolloClient } from '@apollo/client';
import { useAuth } from '../../../../lib/AuthContext';

export default function ViewDeckPage() {
  const { authUser } = useAuth();
  const [deckId, isReady] = useRouterPathParam('did', parseInt, '/decks')
  const { data, loading } = useGetDeckQuery({
    ssr: true,
    variables: {
      deckId: deckId || 0,
    },
    skip: !isReady || !deckId,
  });
  const { locale } = useLocale();
  const { data: cardsData } = useGetAllCardsQuery({
    variables: {
      locale,
    },
  });
  const cards = useCardsMap(cardsData?.cards);
  const deck = data?.deck;
  const client = useApolloClient();
  const updateLikeCache = useCallback((deck: DeckDetailFragment, liked: boolean) => {
    const id = client.cache.identify(deck);
    client.cache.updateFragment({
      id,
      fragmentName: 'DeckDetail',
      fragment: DeckDetailFragmentDoc,
    }, (data) => ({
      ...data,
      liked_by_user: liked,
      like_count: (data.like_count || 0) + (liked ? 1 : -1),
    }));
  }, [client]);
  const onLikeAction = useLikeAction(updateLikeCache);
  const onLike = useCallback(async () => {
    if (deck?.published) {
      return await onLikeAction(deck)
    }
    return undefined;
  }, [deck, onLikeAction]);
  if (loading) {
    return <LoadingPage />;
  }
  return (
    <>
     <Head>
        <title>{deck?.name || t`Deck`} - {t`RangersDB`}</title>
      </Head>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        { deck ? <DeckDetail deck={deck} cards={cards} onLike={deck.published && authUser ? onLike : undefined} /> : <LoadingPage /> }
      </Box>
    </>
  );
}


