import React, { useEffect, useMemo } from 'react';
import Head from 'next/head'
import { Box } from '@chakra-ui/react'
import { useGetCardQuery, useGetCardsQuery } from '../../generated/graphql/apollo-schema';
import { find, identity } from 'lodash';
import Card from '../../components/Card';
import { useAspectMap, useRouterPathParam } from '../../lib/hooks';
import LoadingPage from '../../components/LoadingPage';
import { GetServerSidePropsContext } from 'next';

export default function CardPage() {
  const [cardId, isReady] = useRouterPathParam<string>('cid', identity, '/cards')
  const { data: cardData, loading } = useGetCardQuery({
    ssr: true,
    variables: {
      locale: 'en',
      cid: cardId || '',
    },
    skip: !isReady || !cardId,
  });

  const card = (cardData?.cards.length && cardData.cards[0]) || undefined;
  const aspects = useAspectMap(cardData?.aspects);
  return (
    <>
      <Head>
        <title>{card?.name || 'Card'} - RangersDB</title>
      </Head>
      <Box
          maxW="64rem"
          marginX="auto"
          py={{ base: "3rem", lg: "4rem" }}
          px={{ base: "1rem", lg: "0" }}
        >
          { card ? <Card card={card} aspects={aspects} /> : <LoadingPage /> }
        </Box>
    </>
  );
}
