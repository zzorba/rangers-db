import React from 'react';
import Head from 'next/head'
import { Heading, Box, Button, Flex } from '@chakra-ui/react';
import { useCategoryTranslations, useRequireAuth } from '../../lib/hooks';
import { useNewDeckModal } from '../../components/Deck';
import DeckList from '../../components/DeckList';
import { useGetSetsQuery } from '../../generated/graphql/apollo-schema';

export default function DecksPage() {
  useRequireAuth();

  const { data: setData } = useGetSetsQuery({
    variables: {
      locale: 'en',
    },
  });
  const categoryTranslations = useCategoryTranslations(setData?.sets);
  const [showNewDeck, newDeckModal] = useNewDeckModal(categoryTranslations);

  return (
    <>
      <Head>
        <title>Decks - RangersDB</title>
      </Head>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        <Flex direction="row" justifyContent="space-between" alignItems="center">
          <Heading>Decks</Heading><Button onClick={showNewDeck}>New deck</Button>
        </Flex>
        <DeckList categoryTranslations={categoryTranslations} />
      </Box>
      { newDeckModal }
    </>
  );
}