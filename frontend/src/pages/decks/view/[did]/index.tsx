import React from 'react';
import { Box } from '@chakra-ui/react'
import { t } from '@lingui/macro';
import Head from 'next/head';

import { useGetAllCardsQuery, useGetDeckQuery } from '../../../../generated/graphql/apollo-schema';
import { useCardsMap, useRouterPathParam } from '../../../../lib/hooks';
import LoadingPage from '../../../../components/LoadingPage';
import DeckDetail from '../../../../components/DeckDetail';
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
  const { data: cardsData } = useGetAllCardsQuery({
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
        <title>{deck?.name || 'Deck'} - {t`RangersDB`}</title>
      </Head>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        { deck ? <DeckDetail deck={deck} cards={cards} /> : <LoadingPage /> }
      </Box>
    </>
  );
}


