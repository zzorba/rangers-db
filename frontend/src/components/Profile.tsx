import React, { useCallback, useEffect, useState } from 'react';
import {
  Flex,
  Input,
  FormControl,
  FormLabel,
  Text,
} from '@chakra-ui/react';
import { t } from '@lingui/macro';
import { useAuth } from '../lib/AuthContext';
import { useGraphql } from '../lib/GraphqlContext';
import { useGetProfileQuery, useSetPrivateDecksMutation } from '../generated/graphql/apollo-schema';
import useFirebaseFunction from '../lib/useFirebaseFunction';
import LoadingPage from './LoadingPage';
import DynamicCheckbox from './DynamicCheckbox';
import FriendRequestsComponent from './FriendRequests';
import SolidButton from './SolidButton';

export default function Profile() {
  const [handle, setHandle] = useState('');

  const { authUser } = useAuth();
  const { authClient } = useGraphql();
  const { data, loading, refetch } = useGetProfileQuery({
    client: authClient,
    variables: {
      id: authUser?.uid || '',
    },
    skip: !authUser,
    fetchPolicy: 'no-cache',
  });

  const [doSetHandle, setHandleError] = useFirebaseFunction<{ handle: string }>('social-updateHandle');
  const submitHandle = useCallback(async () => {
    const r = await doSetHandle({ handle });
    if (r?.success) {
      refetch({ id: authUser?.uid})
    }
  }, [doSetHandle, handle, authUser, refetch]);
  useEffect(() => {
    if (data?.profile?.handle) {
      setHandle(data.profile.handle);
    }
  }, [data?.profile, setHandle]);
  const [setPrivateDecks] = useSetPrivateDecksMutation();
  const onPrivateDecksChange = useCallback(async(value: boolean) => {
    await setPrivateDecks({
      client: authClient,
      variables: {
        userId: authUser?.uid || '',
        privateDecks: !value,
      },
    });
  }, [authClient, authUser, setPrivateDecks])
  const refreshProfile = useCallback(() => {
    if (authUser) {
      refetch({
        id: authUser.uid,
      });
    };
  }, [refetch, authUser]);
  return (
    <>
      { loading ? <LoadingPage /> : (
        <Flex direction="column" m="2">
          <FormControl marginBottom="1em">
            <FormLabel htmlFor="email">{t`Email`}</FormLabel>
            <Input
              disabled
              value={authUser?.email}
              placeholder={t`Email`}
            />
          </FormControl>
          <form
            onSubmit={e => {
              e.preventDefault();
              submitHandle();
            }}
          >
            <FormControl>
              <FormLabel htmlFor="handle">{t`Handle`}</FormLabel>
              <Flex direction="row">
                <Input
                  name="handle"
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  placeholder={t`Choose handle`}
                  borderColor={setHandleError ? 'red' : undefined}
                />
                { (data?.profile?.handle || '') !== handle && (
                  <SolidButton color="blue" marginLeft={2} onClick={submitHandle}>{t`Save`}</SolidButton>
                )}
              </Flex>
              { !!setHandleError && <Text color="red.500">{setHandleError}</Text> }
            </FormControl>
          </form>
          <FormControl marginTop="1em">
            <FormLabel htmlFor="handle">{t`Settings`}</FormLabel>
            <DynamicCheckbox
              isChecked={!data?.settings?.private_decks}
              onChange={onPrivateDecksChange}
            >
              {t`Allow people to view my decks`}
            </DynamicCheckbox>
          </FormControl>
          { !!authUser && !!data?.profile &&  (
            <FriendRequestsComponent
              profile={data.profile}
              refreshProfile={refreshProfile}
            />
          ) }
        </Flex>
      )}
    </>
  );
}
