import React, { useCallback, useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { Pagination, PaginationContainer, PaginationNext, PaginationPageGroup, PaginationPrevious, usePagination } from '@ajna/pagination';
import { t } from '@lingui/macro';

import { useAuth } from '../lib/AuthContext';
import { AuthUser } from '../lib/useFirebaseAuth';
import LoadingPage from './LoadingPage';

interface Props<T> {
  total: number | undefined;
  fetchData: (authUser: AuthUser | undefined, pageSize: number, offset: number) => Promise<T[]>;
  children: (data: T[], refetch: () => void) => React.ReactNode;
  pageSize?: number;
  data: T[] | undefined;
}
export default function PaginationWrapper<T>({ children, total, fetchData, pageSize: pageSizeProp, data }: Props<T>) {
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
      pageSize: pageSizeProp || 10,
      currentPage: 1,
      isDisabled: false,
    },
  });

  const [deleteCount, setDeleteCount] = useState(0);
  useEffect(() => {
    fetchData(authUser, pageSize, offset);
  }, [authUser, fetchData, currentPage, pageSize, offset, deleteCount]);

  const handlePageChange = useCallback((nextPage: number) => {
    setCurrentPage(nextPage);
  }, [setCurrentPage]);
  const refetch = useCallback(() => setDeleteCount(deleteCount + 1), [setDeleteCount, deleteCount]);
  return (
    <>
      <Box
        maxW="64rem"
        marginX="auto"
      >
        { isDisabled || !data ? <LoadingPage /> : children(data, refetch) }
        { (total || 0) > pageSize && (
          <Box borderTopWidth="1px">
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
        ) }
      </Box>
    </>
  );
}