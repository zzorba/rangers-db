import React, { useEffect } from 'react';
import Head from 'next/head'
import { t } from '@lingui/macro';
import { Box } from '@chakra-ui/react'
import Router from 'next/router';

import { useGetDeckQuery } from '../../../generated/graphql/apollo-schema';
import { useRequireAuth, useRouterPathParam } from '../../../lib/hooks';
import LoadingPage from '../../../components/LoadingPage';
import DeckEdit  from '../../../components/DeckEdit';
import { useAuth } from '../../../lib/AuthContext';
import { useAllCardsMap } from '../../../lib/cards';
import { getLocalizationServerSideProps } from '../../../lib/Lingui';

export default function EditDeckPage() {
  useRequireAuth();
  const { authUser, loading: authLoading } = useAuth();
  const [deckId, isReady] = useRouterPathParam('did', parseInt, '/decks')
  const { data, loading } = useGetDeckQuery({
    ssr: false,
    variables: {
      deckId: deckId || 0,
    },
    skip: !isReady || !deckId,
  });
  const cards = useAllCardsMap();
  const deck = data?.deck;
  useEffect(() => {
    if (loading) {
      return;
    }
    if (data?.deck && !authLoading && (
      !authUser ||
      data.deck.user_id !== authUser.uid ||
      !!data.deck.next_deck
    )) {
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
        <title>{deck?.name || t`Deck`} - {t`RangersDB`}</title>
      </Head>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        { deck ? <DeckEdit deck={deck} cards={cards} /> : <LoadingPage /> }
      </Box>
    </>
  );
}

export const getServerSideProps = getLocalizationServerSideProps;
