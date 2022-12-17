import React, { useCallback, useState } from 'react';
import { t } from '@lingui/macro';
import { Box, Button } from '@chakra-ui/react';
import { useCardsMap, useRequireAuth } from '../../lib/hooks';
import { useNewDeckModal } from '../../components/DeckEdit';
import DeckList from '../../components/DeckList';
import { DeckFragment, DeckWithCampaignFragment, useDeleteDeckMutation, useGetMyDecksQuery, useGetMyDecksTotalQuery, useGetRoleCardsQuery } from '../../generated/graphql/apollo-schema';
import PageHeading from '../../components/PageHeading';
import { useAuth } from '../../lib/AuthContext';
import useDeleteDialog from '../../components/useDeleteDialog';
import { useLocale } from '../../lib/TranslationProvider';
import PaginationWrapper from '../../components/PaginationWrapper';
import { AuthUser } from '../../lib/useFirebaseAuth';


function deleteDeckMessage(d: DeckFragment) {
  return t`Are you sure you want to delete the '${d.name}' deck?`;
}

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
  const [deleteCount, setDeleteCount] = useState(0);
  const [doDelete] = useDeleteDeckMutation();
  const deleteDeck = useCallback(async(d: DeckFragment) => {
    await doDelete({
      variables: {
        id: d.id,
      },
    });
    setDeleteCount(deleteCount + 1)
  }, [doDelete, deleteCount, setDeleteCount]);
  const [onDelete, deleteDialog] = useDeleteDialog(
    t`Delete deck?`,
    deleteDeckMessage,
    deleteDeck
  );
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
          deleteCount={deleteCount}
        >
          { (decks: DeckWithCampaignFragment[]) => (
            <DeckList
              decks={decks}
              roleCards={roleCards}
              onDelete={onDelete}
            />
          ) }
        </PaginationWrapper>
      </Box>
      { newDeckModal }
      { deleteDialog }
    </>
  );
}


