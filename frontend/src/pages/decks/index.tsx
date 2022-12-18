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
  const { data } = useGetRoleCardsQuery({
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

  const { fetchMore } = useGetMyDecksQuery({
    variables: {
      userId: authUser?.uid || '',
      limit: 10,
      offset: 0,
    },
    skip: true,
  });

  const fetchDecks = useCallback(async(authUser: AuthUser, pageSize: number, offset: number): Promise<DeckFragment[]> => {
    if (authUser) {
      const data = await fetchMore({
        variables: {
          userId: authUser.uid,
          limit: pageSize,
          offset,
        },
      });
      return data.data.decks || [];
    }
    return [];
  }, [fetchMore]);
  const roleCards = useCardsMap(data?.cards);
  const [showNewDeck, newDeckModal] = useNewDeckModal(roleCards);
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
        <PaginationWrapper
          total={totalDecks?.total.aggregate?.count}
          fetchData={fetchDecks}
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


