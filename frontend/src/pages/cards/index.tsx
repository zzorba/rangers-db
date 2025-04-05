import React from 'react';
import { Box } from '@chakra-ui/react';
import { t } from '@lingui/macro';

import CardList, { PackCollectionContextProvider } from '../../components/CardList';
import PageHeading from '../../components/PageHeading';
import { getLocalizationServerSideProps } from '../../lib/Lingui';

export default function CardsPage() {
  return (
    <Box
      maxW="64rem"
      marginX="auto"
      py={{ base: "3rem", lg: "4rem" }}
      px={{ base: "1rem", lg: "0" }}
    >
      <PageHeading title={t`Cards`} />
      <PackCollectionContextProvider>
        <CardList />
      </PackCollectionContextProvider>
    </Box>
  );
}

export const getServerSideProps = getLocalizationServerSideProps;
