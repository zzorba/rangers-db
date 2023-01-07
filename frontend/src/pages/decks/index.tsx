import React, { useCallback } from 'react';
import { t } from '@lingui/macro';
import { Box, Button } from '@chakra-ui/react';

import { useCardsMap, useRequireAuth } from '../../lib/hooks';
import { useNewDeckModal } from '../../components/DeckEdit';
import DeckList from '../../components/DeckList';
import { DeckFragment, DeckWithCampaignFragment, useGetMyDecksQuery, useGetMyDecksTotalQuery, useGetRoleCardsQuery } from '../../generated/graphql/apollo-schema';
import PageHeading from '../../components/PageHeading';
import { useAuth } from '../../lib/AuthContext';
import { useLocale } from '../../lib/TranslationProvider';
import PaginationWrapper from '../../components/PaginationWrapper';
import { AuthUser } from '../../lib/useFirebaseAuth';

export default function DecksPage() {
  useRequireAuth();
  const { locale } = useLocale();
  const { authUser } = useAuth();
  const { data: role } = useGetRoleCardsQuery({
    variables: {
      locale,
    },
  });
  const { data: totalDecks } = useGetMyDecksTotalQuery({
    variables: {
      userId: authUser?.uid || '',
    },
    skip: !authUser,
  });

  const { data, fetchMore } = useGetMyDecksQuery({
    variables: {
      userId: authUser?.uid || '',
      limit: 10,
      offset: 0,
    },
    skip: !authUser?.uid,
  });

  const fetchDecks = useCallback(async(authUser: AuthUser, pageSize: number, offset: number): Promise<DeckWithCampaignFragment[]> => {
    if (authUser) {
      const data = await fetchMore({
        variables: {
          userId: authUser.uid,
          limit: pageSize,
          offset,
        },
        updateQuery(_, { fetchMoreResult }) {
          return fetchMoreResult;
        },
      });
      return data.data.decks || [];
    }
    return [];
  }, [fetchMore]);
  const roleCards = useCardsMap(role?.cards);
  const [showNewDeck, newDeckModal] = useNewDeckModal(roleCards);
  console.log(data);
  return (
    <>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        <PageHeading title={t`My Decks`}>
          { !!authUser && <Button onClick={showNewDeck}>{t`New deck`}</Button> }
        </PageHeading>
        <PaginationWrapper<DeckWithCampaignFragment>
          total={totalDecks?.total.aggregate?.count}
          fetchData={fetchDecks}
          data={data?.decks}
        >
          { (decks: DeckWithCampaignFragment[], refetch) => (
            <DeckList
              decks={decks}
              roleCards={roleCards}
              refetch={refetch}
            />
          ) }
        </PaginationWrapper>
      </Box>
      { newDeckModal }
    </>
  );
}


