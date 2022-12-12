import React, { useCallback, useEffect, useState } from 'react';
import { t } from '@lingui/macro';
import { Box, Button } from '@chakra-ui/react';
import { Pagination, PaginationContainer, PaginationNext, PaginationPageGroup, PaginationPrevious, usePagination } from '@ajna/pagination';
import { useAuth } from '../lib/AuthContext';
import { AuthUser } from '../lib/useFirebaseAuth';
import LoadingPage from './LoadingPage';

interface Props<T> {
  total: number | undefined;
  fetchData: (authUser: AuthUser, pageSize: number, offset: number) => Promise<T[]>;
  children: (data: T[]) => React.ReactNode;
  deleteCount?: number;
}
export default function PaginationWrapper<T>({ children, total, fetchData, deleteCount }: Props<T>) {
  const { authUser } = useAuth();
  const {
    isDisabled,
    pagesCount,
    currentPage,
    setCurrentPage,
    pageSize,
    offset,
  } = usePagination({
    total,
    initialState: {
      pageSize: 10,
      currentPage: 1,
      isDisabled: false,
    },
  });

  const [data, setData] = useState<T[] | undefined>();
  useEffect(() => {
    if (authUser) {
      fetchData(authUser, pageSize, offset).then((result) => {
        setData(result);
      });
    }
  }, [authUser, fetchData, currentPage, pageSize, offset, deleteCount]);

  const handlePageChange = useCallback((nextPage: number) => {
    setCurrentPage(nextPage);
  }, [setCurrentPage]);
  return (
    <>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        { isDisabled || !data ? <LoadingPage /> : children(data) }
        <Pagination
          isDisabled={isDisabled}
          currentPage={currentPage}
          pagesCount={pagesCount}
          onPageChange={handlePageChange}
        >
          <PaginationContainer align="center" justify="space-between" w="full" paddingTop={4} paddingBottom={4}>
            <PaginationPrevious>
              {t`Previous`}
            </PaginationPrevious>
            <PaginationPageGroup isInline align="center" />
            <PaginationNext>
              {t`Next`}
            </PaginationNext>
          </PaginationContainer>
        </Pagination>
      </Box>
    </>
  );
}