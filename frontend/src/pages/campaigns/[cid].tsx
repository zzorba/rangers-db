import React, { useCallback, useMemo, useEffect } from 'react';
import Head from 'next/head'
import { useRouter } from 'next/router';
import { t } from '@lingui/macro';
import { Box, Text } from '@chakra-ui/react'
import { filter, flatMap, find } from 'lodash';

import { useGetCampaignQuery, useAddFriendToCampaignMutation, useRemoveFriendFromCampaignMutation } from '../../generated/graphql/apollo-schema';
import { useRouterPathParam } from '../../lib/hooks';
import { useAuth } from '../../lib/AuthContext';
import LoadingPage from '../../components/LoadingPage';
import Campaign, { CampaignWrapper, useEditCampaignAccessModal } from '../../components/Campaign';
import { useAllCardsMap } from '../../lib/cards';
import { getLocalizationServerSideProps } from '../../lib/Lingui';

export default function CampaignPage() {
  const router = useRouter();
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
  
  // Verifica se l'utente ha accesso alla campagna
  const hasAccess = useMemo(() => {
    if (!authUser || !campaign) return false;
    return !!find(campaign.access, user => user.id === authUser.uid);
  }, [authUser, campaign]);

  // Redirect alla pagina view-only se non ha accesso
  useEffect(() => {
    // Aspetta che auth e campaign siano caricati
    if (authLoading || loading || !isReady) return;
    
    // Se non c'è campaignId, non fare nulla
    if (!campaignId) return;

    // Se la campagna non esiste, redirect a view-only (che mostrerà errore)
    if (data && !data.campaign) {
      router.replace(`/campaigns/view/${campaignId}`);
      return;
    }

    // Se l'utente non è loggato O non ha accesso → redirect a view-only
    if (campaign && (!authUser || !hasAccess)) {
      router.replace(`/campaigns/view/${campaignId}`);
    }
  }, [authLoading, loading, isReady, authUser, hasAccess, campaign, campaignId, router, data]);

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

  // Loading state (include auth loading)
  if (loading || authLoading || !isReady) {
    return <LoadingPage />;
  }

  // Se sta per fare redirect, mostra loading
  if (!authUser || !hasAccess) {
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
        { campaign ? <Campaign refetchCampaign={handleRefresh} campaign={campaign} cards={cards} showEditFriends={showEditFriends} /> : <LoadingPage /> }
      </Box>
      {editFriendsModal}
    </>
  );
}

export const getServerSideProps = getLocalizationServerSideProps;