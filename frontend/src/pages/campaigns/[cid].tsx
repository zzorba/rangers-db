import React, { useEffect } from 'react';
import Head from 'next/head'
import { t } from '@lingui/macro';
import { Box } from '@chakra-ui/react'

import { useGetCardsQuery } from '../../generated/graphql/apollo-schema';
import { useCardsMap, useRequireAuth, useRouterPathParam } from '../../lib/hooks';
import LoadingPage from '../../components/LoadingPage';
import { useLocale } from '../../lib/TranslationProvider';
import { useGetCampaignQuery } from '../../generated/graphql/apollo-schema';
import Campaign from '../../components/Campaign';

export default function CampaignPage() {
  useRequireAuth();
  const [campaignId, isReady] = useRouterPathParam('cid', parseInt, '/campaigns')
  const { data, loading } = useGetCampaignQuery({
    ssr: false,
    variables: {
      campaignId: campaignId || 0,
    },
    skip: !isReady || !campaignId,
  });
  const { locale } = useLocale();
  const { data: cardsData } = useGetCardsQuery({
    variables: {
      locale,
    },
  });
  const cards = useCardsMap(cardsData?.cards);
  const campaign = data?.campaign;
  if (loading) {
    return <LoadingPage />;
  }
  return (
    <>
      <Head>
        <title>{campaign?.name || t`Campaign`} - {t`RangersDB`}</title>
      </Head>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        { campaign ? <Campaign campaign={campaign} /> : <LoadingPage /> }
      </Box>
    </>
  );
}


