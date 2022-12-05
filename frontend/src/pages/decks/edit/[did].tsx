import React, { useEffect } from 'react';
import Head from 'next/head'
import { Box } from '@chakra-ui/react'
import { useGetCardsQuery, useGetDeckQuery, useGetSetsQuery } from '../../../generated/graphql/apollo-schema';
import { useAspectMap, useCardsMap, useCategoryTranslations, useRequireAuth, useRouterPathParam } from '../../../lib/hooks';
import LoadingPage from '../../../components/LoadingPage';
import { DeckEdit}  from '../../../components/Deck';
import { useAuth } from '../../../lib/AuthContext';
import Router from 'next/router';

export default function EditDeckPage() {
  useRequireAuth();
  const { authUser, loading: authLoading } = useAuth();
  const [deckId, isReady] = useRouterPathParam('did', parseInt, '/decks')
  const { data, loading } = useGetDeckQuery({
    ssr: true,
    variables: {
      deckId: deckId || 0,
    },
    skip: !isReady || !deckId,
  });
  const { data: cardsData } = useGetCardsQuery({
    variables: {
      locale: 'en'
    },
  });
  const cards = useCardsMap(cardsData?.cards);
  const aspects = useAspectMap(cardsData?.aspects);
  const deck = data?.deck;
  const { data: setData } = useGetSetsQuery({
    variables: {
      locale: 'en',
    },
  });
  const categoryTranslations = useCategoryTranslations(setData?.sets);
  useEffect(() => {
    if (loading) {
      return;
    }
    if (data?.deck && !authLoading && (!authUser || data.deck.user_id !== authUser.uid)) {
      Router.push(`/decks/view/${deckId}`);
      return;
    }
  }, [data?.deck, loading, authLoading, authUser, deckId]);
  if (loading) {
    return <LoadingPage />;
  }
  return (
    <>
      <Head>
        <title>{deck?.name || 'Deck'} - RangersDB</title>
      </Head>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        { deck ? <DeckEdit deck={deck} aspects={aspects} categoryTranslations={categoryTranslations} cards={cards} /> : <LoadingPage /> }
      </Box>
    </>
  );
}
