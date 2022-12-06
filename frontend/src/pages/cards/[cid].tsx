import React from 'react';
import { Box } from '@chakra-ui/react'
import { useGetCardQuery } from '../../generated/graphql/apollo-schema';
import { identity } from 'lodash';
import Card from '../../components/Card';
import { useRouterPathParam } from '../../lib/hooks';
import LoadingPage from '../../components/LoadingPage';
import PageHeading from '../../components/PageHeading';

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
  return (
    <>
      <PageHeading title={card?.name || 'Card'} />
      <Box
          maxW="64rem"
          marginX="auto"
          py={{ base: "3rem", lg: "4rem" }}
          px={{ base: "1rem", lg: "0" }}
        >
          { card ? <Card card={card} /> : <LoadingPage /> }
        </Box>
    </>
  );
}
