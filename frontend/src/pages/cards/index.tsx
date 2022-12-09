import React from 'react';
import { Box } from '@chakra-ui/react';

import CardList from '../../components/CardList';
import PageHeading from '../../components/PageHeading';

export default function CardsPage() {
  return (
    <Box
      maxW="64rem"
      marginX="auto"
      py={{ base: "3rem", lg: "4rem" }}
      px={{ base: "1rem", lg: "0" }}
    >
      <PageHeading title="Cards" />
      <CardList />
    </Box>
  );
}

