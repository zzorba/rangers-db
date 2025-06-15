import React, { useCallback, useMemo } from 'react';
import { Box, Button } from '@chakra-ui/react';
import { t } from '@lingui/macro';
import { flatMap, map } from 'lodash';

import PageHeading from '../../components/PageHeading';
import { useRequireAuth } from '../../lib/hooks';
import { useGetMyCampaignsQuery, useGetMyCampaignsTotalQuery, useGetMyTransferableCampaignsQuery } from '../../generated/graphql/apollo-schema';
import { useAuth } from '../../lib/AuthContext';
import PaginationWrapper from '../../components/PaginationWrapper';
import { AuthUser } from '../../lib/useFirebaseAuth';
import { CampaignList, CampaignWrapper, ParsedCampaign, useNewCampaignModal } from '../../components/Campaign';
import { useRoleCardsMap } from '../../lib/cards';
import { getLocalizationServerSideProps } from '../../lib/Lingui';

export function useCycleCampaigns(cycle: string[]): CampaignWrapper[] | undefined {
  const { authUser } = useAuth();

  const { data } = useGetMyTransferableCampaignsQuery({
    skip: !authUser,
    variables: {
      userId: authUser?.uid ?? '',
      cycles: cycle
    }
  });
  return useMemo(() => {
    if (!data?.campaigns) {
      return undefined;
    }
    return map(
      flatMap(data.campaigns || [], c => c.campaign ?? []),
      c => new CampaignWrapper(c)
    );
  }, [data]);
}

export function usePaginatedCampaigns(): {
  total: number | undefined;
  campaigns: CampaignWrapper[] | undefined;
  fetchCampaigns: (authUser: AuthUser | undefined, pageSize: number, offset: number) => Promise<ParsedCampaign[]>;
} {

  const { authUser } = useAuth();
  const { data: totalCampaigns } = useGetMyCampaignsTotalQuery({
    skip: !authUser,
  });
  const { data, fetchMore } = useGetMyCampaignsQuery({
    variables: {
      userId: authUser?.uid || '',
      limit: 10,
      offset: 0,
    },
    skip: !authUser,
  });

  const fetchCampaigns = useCallback(async(authUser: AuthUser | undefined, pageSize: number, offset: number): Promise<ParsedCampaign[]> => {
    if (authUser) {
      const data = await fetchMore({
        variables: {
          userId: authUser.uid,
          limit: pageSize,
          offset,
        },
        updateQuery(_, { fetchMoreResult }) {
          return fetchMoreResult;
        },
      });
      return map(
        flatMap(data.data?.campaigns || [], c => c.campaign || []),
        c => new CampaignWrapper(c)
      );
    }
    return [];
  }, [fetchMore]);
  const campaigns = useMemo(() => {
    if (!data?.campaigns) {
      return undefined;
    }
    return map(
      flatMap(data.campaigns || [], c => c.campaign || []),
      c => new CampaignWrapper(c)
    );
  }, [data?.campaigns]);

  return {
    total: totalCampaigns?.campaigns.aggregate?.count,
    campaigns,
    fetchCampaigns,
  }
}
export default function CampaignsList() {
  useRequireAuth();
  const roleCards = useRoleCardsMap(undefined);
  const { total, campaigns, fetchCampaigns } = usePaginatedCampaigns();

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
          total={total}
          fetchData={fetchCampaigns}
          data={campaigns}
        >
          { (campaigns: ParsedCampaign[], refetch) => (
            <CampaignList
              campaigns={campaigns}
              roleCards={roleCards}
              refetch={refetch}
            />
          ) }
        </PaginationWrapper>
      </Box>
      { newCampaignModal }
    </>
  );
}

export const getServerSideProps = getLocalizationServerSideProps;
