import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button } from '@chakra-ui/react';
import { useCardsMap, useCategoryTranslations, useRequireAuth } from '../../lib/hooks';
import { useNewDeckModal } from '../../components/Deck';
import DeckList from '../../components/DeckList';
import { DeckFragment, useGetDecksPageDataQuery, useGetMyDecksLazyQuery, useGetMyDecksQuery, useGetMyDecksTotalQuery } from '../../generated/graphql/apollo-schema';
import PageHeading from '../../components/PageHeading';
import { useAuth } from '../../lib/AuthContext';
import LoadingPage from '../../components/LoadingPage';
import { Pagination, PaginationContainer, PaginationNext, PaginationPageGroup, PaginationPrevious, usePagination } from '@ajna/pagination';
import { useApolloClient } from '@apollo/client';

export default function DecksPage() {
  useRequireAuth();
  const { authUser } = useAuth();
  const { data, loading } = useGetDecksPageDataQuery({
    variables: {
      locale: 'en',
    },
  });
  const client = useApolloClient();


  const { data: totalDecks } = useGetMyDecksTotalQuery({
    variables: {
      userId: authUser?.uid || '',
    },
    skip: !authUser,
  });
  const {
    isDisabled,
    pagesCount,
    currentPage,
    setCurrentPage,
    setIsDisabled,
    pageSize,
    setPageSize,
    offset,
  } = usePagination({
    total: totalDecks?.total.aggregate?.count,
    initialState: {
      pageSize: 10,
      currentPage: 1,
      isDisabled: false,
    },
  });

  const { fetchMore } = useGetMyDecksQuery({
    variables: {
      userId: authUser?.uid || '',
      limit: pageSize,
      offset: offset,
    },
    skip: true,
  });

  const fetchDecks = useCallback(async(pageSize: number, offset: number): Promise<DeckFragment[]> => {
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
  }, [fetchMore, authUser]);

  const [decks, setDecks] = useState<DeckFragment[] | undefined>();

  useEffect(() => {
    if (authUser) {
      fetchDecks(pageSize, offset).then((result) => {
        setDecks(result);
      });
    }
  }, [authUser, fetchDecks, currentPage, pageSize, offset]);

  const categoryTranslations = useCategoryTranslations(data?.sets);
  const roleCards = useCardsMap(data?.roleCards);

  const [showNewDeck, newDeckModal] = useNewDeckModal(categoryTranslations, roleCards);
  const handlePageChange = (nextPage: number) => {
    setCurrentPage(nextPage);
  };
  return (
    <>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        <PageHeading title="My Decks">
          { !!authUser && <Button onClick={showNewDeck}>New deck</Button> }
        </PageHeading>
        { isDisabled || !decks ? <LoadingPage /> : (
          <DeckList
            decks={decks}
            categoryTranslations={categoryTranslations}
            roleCards={roleCards}
          />
        ) }
        <Pagination
          isDisabled={isDisabled}
          currentPage={currentPage}
          pagesCount={pagesCount}
          onPageChange={handlePageChange}
        >
          <PaginationContainer align="center" justify="space-between" w="full" p={4}>
            <PaginationPrevious>
              Previous
            </PaginationPrevious>
            <PaginationPageGroup isInline align="center" />
            <PaginationNext>
              Next
            </PaginationNext>
          </PaginationContainer>
        </Pagination>
      </Box>
      { newDeckModal }
    </>
  );
}