import React, { useCallback } from 'react';
import { Box, Button } from '@chakra-ui/react';
import { t } from '@lingui/macro';
import { flatMap } from 'lodash';

import PageHeading from '../../components/PageHeading';
import { useCardsMap, useRequireAuth } from '../../lib/hooks';
import { Campaign, CampaignFragment, useGetMyCampaignsQuery, useGetMyCampaignsTotalQuery, useGetRoleCardsQuery } from '../../generated/graphql/apollo-schema';
import { useAuth } from '../../lib/AuthContext';
import PaginationWrapper from '../../components/PaginationWrapper';
import { AuthUser } from '../../lib/useFirebaseAuth';
import { CampaignList, useNewCampaignModal } from '../../components/Campaign';
import { useLocale } from '../../lib/TranslationProvider';

export default function CampaignsList() {
  useRequireAuth();
  const { authUser } = useAuth();
  const { data: totalCampaigns } = useGetMyCampaignsTotalQuery({
    variables: {
      userId: authUser?.uid || '',
    },
    skip: !authUser,
  })
  const { fetchMore } = useGetMyCampaignsQuery({
    variables: {
      userId: authUser?.uid || '',
      limit: 10,
      offset: 0,
    },
    skip: true,
  });

  const fetchCampaigns = useCallback(async(authUser: AuthUser, pageSize: number, offset: number): Promise<CampaignFragment[]> => {
    if (authUser) {
      const data = await fetchMore({
        variables: {
          userId: authUser.uid,
          limit: pageSize,
          offset,
        },
      });
      return flatMap(data.data.user?.campaigns || [], c => c.campaign || []);
    }
    return [];
  }, [fetchMore]);
  const { locale } = useLocale();
  const { data } = useGetRoleCardsQuery({
    variables: {
      locale,
    },
  });
  const roleCards = useCardsMap(data?.cards);

  const [showNewCampaign, newCampaignModal] = useNewCampaignModal();
  return (
    <>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        <PageHeading title={t`Campaigns`}>
          <Button onClick={showNewCampaign}>{t`New campaign`}</Button>

        </PageHeading>
        <PaginationWrapper
          total={totalCampaigns?.user?.campaigns_aggregate.aggregate?.count}
          fetchData={fetchCampaigns}
        >
          { (campaigns: CampaignFragment[]) => (
            <CampaignList
              campaigns={campaigns}
              roleCards={roleCards}
            />
          ) }
        </PaginationWrapper>
      </Box>
      { newCampaignModal }
    </>
  );
}