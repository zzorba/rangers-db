import React, { useCallback, useEffect } from 'react';
import Head from 'next/head'
import { t } from '@lingui/macro';
import { Box } from '@chakra-ui/react'
import { filter, flatMap } from 'lodash';

import { useAddFriendToCampaignMutation, useGetAllCardsQuery, useRemoveFriendFromCampaignMutation } from '../../generated/graphql/apollo-schema';
import { useCardsMap, useRequireAuth, useRouterPathParam } from '../../lib/hooks';
import LoadingPage from '../../components/LoadingPage';
import { useLocale } from '../../lib/TranslationProvider';
import { useGetCampaignQuery } from '../../generated/graphql/apollo-schema';
import Campaign, { useEditCampaignAccessModal } from '../../components/Campaign';

export default function CampaignPage() {
  useRequireAuth();
  const [campaignId, isReady] = useRouterPathParam('cid', parseInt, '/campaigns')
  const { data, loading, refetch } = useGetCampaignQuery({
    ssr: false,
    variables: {
      campaignId: campaignId || 0,
    },
    skip: !isReady || !campaignId,
  });
  const { locale } = useLocale();
  const { data: cardsData } = useGetAllCardsQuery({
    variables: {
      locale,
    },
  });
  const cards = useCardsMap(cardsData?.cards);
  const campaign = data?.campaign;
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
    const toRemove = flatMap(campaign?.access, u => !!u.user && !selectionSet.has(u.user.id) ? u.user.id : []);
    const existingSet = new Set(flatMap(campaign?.access, u => u.user?.id || []));
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
        { campaign ? <Campaign refetchCampaign={handleRefresh} campaign={campaign} cards={cards} showEditFriends={showEditFriends} /> : <LoadingPage /> }
      </Box>
      {editFriendsModal}
    </>
  );
}


