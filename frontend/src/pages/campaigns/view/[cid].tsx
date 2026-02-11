import React, { useMemo } from 'react';
import Head from 'next/head';
import { t } from '@lingui/macro';
import { Box, Text, Alert, AlertIcon, AlertDescription } from '@chakra-ui/react';
import { useGetCampaignQuery } from '../../../generated/graphql/apollo-schema';
import { useRouterPathParam } from '../../../lib/hooks';
import LoadingPage from '../../../components/LoadingPage';
import CampaignDetailViewOnly, { CampaignWrapper } from '../../../components/CampaignViewOnly';
import { useAllCardsMap } from '../../../lib/cards';
import { getLocalizationServerSideProps } from '../../../lib/Lingui';

/**
 * Pagina view-only per visualizzare una campagna senza autenticazione.
 * Percorso: /campaigns/view/[cid]
 * 
 * Differenze dalla pagina principale (/campaigns/[cid]):
 * - Non richiede autenticazione (useRequireAuth rimosso)
 * - Non mostra opzioni di editing
 * - Non permette modifiche alla campagna
 * - Mostra un banner che indica la modalità sola lettura
 */
export default function CampaignViewPage() {
  const [campaignId, isReady] = useRouterPathParam('cid', parseInt, '/campaigns');
  
  const { data, loading, error } = useGetCampaignQuery({
    ssr: false,
    variables: {
      campaignId: campaignId || 0,
    },
    skip: !isReady || !campaignId,
  });
  
  const cards = useAllCardsMap(undefined);
  const campaign = useMemo(
    () => (data?.campaign ? new CampaignWrapper(data.campaign) : undefined),
    [data]
  );

  // Gestione errori di query
  if (error) {
    return (
      <>
        <Head>
          <title>{t`Campaign`} - {t`RangersDB`}</title>
        </Head>
        <Box
          maxW="64rem"
          marginX="auto"
          py={{ base: '3rem', lg: '4rem' }}
          px={{ base: '1rem', lg: '0' }}
        >
          <Alert status="error">
            <AlertIcon />
            <AlertDescription>
              {t`An error occurred while loading the campaign.`}
            </AlertDescription>
          </Alert>
        </Box>
      </>
    );
  }

  // Campagna non trovata o non accessibile
  if (data && !data.campaign) {
    return (
      <>
        <Head>
          <title>{t`Campaign`} - {t`RangersDB`}</title>
        </Head>
        <Box
          maxW="64rem"
          marginX="auto"
          py={{ base: '3rem', lg: '4rem' }}
          px={{ base: '1rem', lg: '0' }}
        >
          <Alert status="warning">
            <AlertIcon />
            <AlertDescription>
              {t`This campaign is not accessible or does not exist.`}
            </AlertDescription>
          </Alert>
        </Box>
      </>
    );
  }

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
        py={{ base: '3rem', lg: '4rem' }}
        px={{ base: '1rem', lg: '0' }}
      >
        {/* Banner informativo per la modalità view-only */}
        <Alert status="info" mb={4}>
          <AlertIcon />
          <AlertDescription>
            {t`You are viewing this campaign in read-only mode.`}
          </AlertDescription>
        </Alert>
        
        {campaign ? (
          <CampaignDetailViewOnly
            campaign={campaign}
            cards={cards}
          />
        ) : (
          <LoadingPage />
        )}
      </Box>
    </>
  );
}

export const getServerSideProps = getLocalizationServerSideProps;
