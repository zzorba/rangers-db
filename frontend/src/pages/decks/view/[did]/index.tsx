import React from 'react';
import { Box } from '@chakra-ui/react'
import { useGetCardsQuery, useGetDeckQuery } from '../../../../generated/graphql/apollo-schema';
import { useCardsMap, useRouterPathParam } from '../../../../lib/hooks';
import LoadingPage from '../../../../components/LoadingPage';
import Deck from '../../../../components/Deck';
import Head from 'next/head';
import { useLocale } from '../../../../lib/TranslationProvider';

export default function ViewDeckPage() {
  const [deckId, isReady] = useRouterPathParam('did', parseInt, '/decks')
  const { data, loading } = useGetDeckQuery({
    ssr: true,
    variables: {
      deckId: deckId || 0,
    },
    skip: !isReady || !deckId,
  });
  const { locale } = useLocale();
  const { data: cardsData } = useGetCardsQuery({
    variables: {
      locale,
    },
  });
  const cards = useCardsMap(cardsData?.cards);
  const deck = data?.deck;
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
        { deck ? <Deck deck={deck} cards={cards} /> : <LoadingPage /> }
      </Box>
    </>
  );
}


