import React from 'react';
import { Box } from '@chakra-ui/react'
import { identity } from 'lodash';
import Head from 'next/head';
import { t } from '@lingui/macro';

import { useGetCardQuery } from '../../generated/graphql/apollo-schema';
import Card from '../../components/Card';
import { useRouterPathParam } from '../../lib/hooks';
import LoadingPage from '../../components/LoadingPage';
import { useLocale } from '../../lib/TranslationProvider';
import { getLocalizationServerSideProps } from '../../lib/Lingui';

export default function CardPage() {
  const [cardId, isReady] = useRouterPathParam<string>('cid', identity, '/cards')
  const { locale } = useLocale();
  const { data: cardData, loading } = useGetCardQuery({
    ssr: true,
    variables: {
      locale,
      cid: cardId || '',
    },
    skip: !isReady || !cardId,
  });

  const card = (cardData?.cards.length && cardData.cards[0]) || undefined;
  return (
    <>
      { !!card && (
        <Head>
          <title>{card.name} - {t`RangersDB`}</title>
          <meta property="og:title" content={`${card.name} - ${t`RangersDB`}`} />
          <meta property="og:description" content={card.text || ''} />
        </Head>
      )}
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

export const getServerSideProps = getLocalizationServerSideProps;
