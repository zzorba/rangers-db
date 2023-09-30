import React from 'react';
import { Box } from '@chakra-ui/react';
import { t } from '@lingui/macro';

import CardList from '../../components/CardList';
import PageHeading from '../../components/PageHeading';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { loadCatalog, getLocalizationServerSideProps } from '../../lib/Lingui';

export default function CardsPage() {
  return (
    <Box
      maxW="64rem"
      marginX="auto"
      py={{ base: "3rem", lg: "4rem" }}
      px={{ base: "1rem", lg: "0" }}
    >
      <PageHeading title={t`Cards`} />
      <CardList />
    </Box>
  );
}

export const getServerSideProps = getLocalizationServerSideProps;
