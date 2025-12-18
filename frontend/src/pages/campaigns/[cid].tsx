import React, { useCallback, useEffect, useMemo } from 'react';
import Head from 'next/head'
import { t } from '@lingui/macro';
import { Box, Text } from '@chakra-ui/react'
import { filter, flatMap } from 'lodash';
import Router from 'next/router';
import { useGetCampaignQuery, useAddFriendToCampaignMutation, useRemoveFriendFromCampaignMutation } from '../../generated/graphql/apollo-schema';
import { useRouterPathParam } from '../../lib/hooks';
import { useAuth } from '../../lib/AuthContext';
import LoadingPage from '../../components/LoadingPage';
import Campaign, { CampaignWrapper, useEditCampaignAccessModal } from '../../components/Campaign';
import { useAllCardsMap } from '../../lib/cards';
import { getLocalizationServerSideProps } from '../../lib/Lingui';

export default function CampaignPage() {
  const { authUser, loading: authLoading } = useAuth();
  const [campaignId, isReady] = useRouterPathParam('cid', parseInt, '/campaigns')
  
  const { data, loading, refetch } = useGetCampaignQuery({
    ssr: false,
    variables: {
      campaignId: campaignId || 0,
    },
    skip: !isReady || !campaignId,
  });
  
  const cards = useAllCardsMap(undefined);
  const campaign = useMemo(() => data?.campaign ? new CampaignWrapper(data.campaign) : undefined, [data]);
  
  // Controlla se l'utente ha accesso alla campagna
  const hasAccess = useMemo(() => {
    if (!authUser || !campaign) return false;
    // L'utente è il proprietario
    if (campaign.user_id === authUser.uid) return true;
    // L'utente è nella lista degli accessi
    return campaign.access.some(user => user.id === authUser.uid);
  }, [authUser, campaign]);

  // Redirect alla versione view-only se:
  // 1. L'utente non è loggato (e non sta caricando)
  // 2. L'utente è loggato ma non ha accesso alla campagna
  useEffect(() => {
    // Aspetta che tutto sia caricato
    if (authLoading || loading || !isReady) return;
    
    // Se non c'è la campagna, non fare nulla (mostrerà l'errore)
    if (data && !data.campaign) return;
    
    // Se la campagna esiste
    if (campaign) {
      // Utente non loggato → redirect a view
      if (!authUser) {
        Router.replace(`/campaigns/view/${campaignId}`);
        return;
      }
      
      // Utente loggato ma senza accesso → redirect a view
      if (!hasAccess) {
        Router.replace(`/campaigns/view/${campaignId}`);
        return;
      }
    }
  }, [authLoading, loading, isReady, authUser, campaign, hasAccess, campaignId, data]);
  
  const handleRefresh = useCallback(async() => {
    await refetch({ campaignId });
  }, [refetch, campaignId]);
  
  const [addFriend] = useAddFriendToCampaignMutation();
  const [removeFriend] = useRemoveFriendFromCampaignMutation();
  
  const updateAccess = useCallback(async(selection: string[]): Promise<string | undefined> => {
    if (!campaignId) {
      return undefined;
    }
    const selectionSet = new Set(selection);
    const toRemove = flatMap(campaign?.access, user => !selectionSet.has(user.id) ? user.id : []);
    const existingSet = new Set(flatMap(campaign?.access, user => user.id || []));
    const toAdd = filter(selection, id => !existingSet.has(id));
    try {
      for (let i = 0; i < toRemove.length; i++) {
        const userId = toRemove[i];
        const r = await removeFriend({
          variables: {
            campaignId,
            userId,
          },
        });
        if (r.errors?.length) {
          return r.errors[0].message;
        }
      }
      for (let i = 0; i < toAdd.length; i++) {
        const userId = toAdd[i];
        const r = await addFriend({
          variables: {
            campaignId,
            userId,
          },
        });
        if (r.errors?.length) {
          return r.errors[0].message;
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        return e.message;
      }
    }
    return undefined;
  }, [campaign, campaignId, addFriend, removeFriend]);
  
  const [showEditFriends, editFriendsModal] = useEditCampaignAccessModal(campaign, updateAccess);
  
  // Mostra loading mentre controlla autenticazione e permessi
  if (authLoading || loading || !isReady) {
    return <LoadingPage />;
  }
  
  // Mostra loading se stiamo per fare redirect
  if (!authUser || (campaign && !hasAccess)) {
    return <LoadingPage />;
  }
  
  // Campagna non trovata
  if (data && !data.campaign) {
    return (
      <>
        <Head>
          <title>{t`Campaign`} - {t`RangersDB`}</title>
        </Head>
        <Box
          maxW="64rem"
          marginX="auto"
          py={{ base: "3rem", lg: "4rem" }}
          px={{ base: "1rem", lg: "0" }}
        >
          <Text>{t`This campaign is not accessible. Are you sure you are signed into the correct account?`}</Text>
        </Box>
      </>
    );
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
        { campaign ? <Campaign refetchCampaign={handleRefresh} campaign={campaign} cards={cards} showEditFriends={showEditFriends} /> : <LoadingPage /> }
      </Box>
      {editFriendsModal}
    </>
  );
}

export const getServerSideProps = getLocalizationServerSideProps;