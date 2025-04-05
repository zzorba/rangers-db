import React, { useMemo } from 'react';
import Head from 'next/head'
import { t } from '@lingui/macro';
import { Box, Heading, Flex, Text } from '@chakra-ui/react'

import { useGetProfileByHandleQuery } from '../../generated/graphql/apollo-schema';
import { useRouterPathParam } from '../../lib/hooks';
import LoadingPage from '../../components/LoadingPage';
import CoreIcon from '../../icons/CoreIcon';
import SearchDecks from '../../components/SearchDecks';
import { useLocale } from '../../lib/TranslationProvider';
import { useRoleCardsMap } from '../../lib/cards';
import { getLocalizationServerSideProps } from '../../lib/Lingui';

export default function ProfilePage() {
  const [handle, isReady] = useRouterPathParam('handle', (s: string) => s, '/');
  const { i18n } = useLocale();
  const { data, loading } = useGetProfileByHandleQuery({
    ssr: false,
    variables: {
      handle: handle || '',
    },
    skip: !isReady || !handle,
  });
  const [user, error] = useMemo(() => {
    if (loading || !isReady || !handle) {
      return [undefined, undefined];
    }
    if (!data?.profile.length) {
      return [undefined, t`Could not find user ${handle}`];
    }
    return [data.profile[0], undefined];
  }, [data, loading, isReady, handle]);
  if (loading || !isReady) {
    return <LoadingPage />;
  }
  if (error || !user) {
    return (
      <>
        <Head>
          <title>{handle} - {t`RangersDB`}</title>
        </Head>
        <Box
          maxW="64rem"
          marginX="auto"
          py={{ base: "3rem", lg: "4rem" }}
          px={{ base: "1rem", lg: "0" }}
        >
          <Heading>{error || t`Could not find user ${handle}`}</Heading>
        </Box>
      </>
    );
  }
  const joinDate = i18n?.date(user.created_at, { dateStyle: 'short' });
  return (
    <>
      <Head>
        <title>{user.handle} - {t`RangersDB`}</title>
      </Head>
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        <Flex direction="row" alignItems="center">
          <CoreIcon size={32} icon="ranger" />
          <Heading marginLeft={2}>{ user.handle }</Heading>
        </Flex>
        <Text>{t`Member since ${joinDate}`}</Text>
        <Box marginTop="1em">
          <Heading size="md">{t`Published decks`}</Heading>
          <Box marginTop={2} paddingLeft="1em" borderLeftWidth="1px">
            <SearchDecks
              userId={user.id}
              pageSize={5}
              emptyMessage={t`No published decks.`}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
}

export const getServerSideProps = getLocalizationServerSideProps;
