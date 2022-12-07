import React from 'react';
import { Box } from '@chakra-ui/react'
import { useGetCardsQuery, useGetDeckQuery, useGetSetsQuery } from '../../../../generated/graphql/apollo-schema';
import { useCardsMap, useCategoryTranslations, useRouterPathParam } from '../../../../lib/hooks';
import LoadingPage from '../../../../components/LoadingPage';
import Deck from '../../../../components/Deck';

export default function ViewDeckPage() {
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
  const deck = data?.deck;
  const { data: setData } = useGetSetsQuery({
    variables: {
      locale: 'en',
    },
  });
  const categoryTranslations = useCategoryTranslations(setData?.sets);
  if (loading) {
    return <LoadingPage />;
  }
  return (
    <Box
      maxW="64rem"
      marginX="auto"
      py={{ base: "3rem", lg: "4rem" }}
      px={{ base: "1rem", lg: "0" }}
    >
      { deck ? <Deck deck={deck} categoryTranslations={categoryTranslations} cards={cards} /> : <LoadingPage /> }
    </Box>
  );
}
