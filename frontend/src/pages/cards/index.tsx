import React from 'react';
import Head from 'next/head'
import { Box } from '@chakra-ui/react';

import CardList from '../../components/CardList';

export default function CardsPage() {
  return (
    <>
      <Head>
        <title>Cards - RangersDB</title>
      </Head>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        <CardList />
      </Box>
    </>
  );
}