import React from 'react';
import { List, ListItem } from '@chakra-ui/react';
import NextLink from 'next/link';
import { map } from 'lodash';

import { useGetMyDecksQuery } from '../generated/graphql/apollo-schema';
import { useAuth } from '../lib/AuthContext';
import LoadingPage from './LoadingPage';
import { DeckRow } from './Deck';
import { CategoryTranslations } from '../lib/hooks';

export default function DeckList({ categoryTranslations }: { categoryTranslations: CategoryTranslations }) {
  const { authUser } = useAuth();
  const { data } = useGetMyDecksQuery({
    variables: {
      userId: authUser?.uid || '',
      offset: 0,
    },
    skip: !authUser,
  });

  if (!data?.decks.length) {
    return <LoadingPage />;
  }
  return (
    <>
      <List>
        {}
        { map(data.decks, deck => (
          <ListItem as={NextLink} href={`/decks/view/${deck.id}`} key={deck.id}>
            <DeckRow deck={deck} categoryTranslations={categoryTranslations} />
          </ListItem>
        )) }
      </List>
    </>
  );
}