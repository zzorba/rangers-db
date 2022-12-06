import React, { useCallback, useEffect, useState } from 'react';
import {
  Flex,
  Input,
  FormControl,
  FormLabel,
  Button,
  FormErrorMessage,
  Heading,
} from '@chakra-ui/react';
import { httpsCallable } from 'firebase/functions';
import { firebaseFunctions } from '../lib/initFirebase';
import NextLink from 'next/link';
import Router from 'next/router';
import { useAuth } from '../lib/AuthContext';
import { useGraphql } from '../lib/GraphqlContext';
import { useGetProfileQuery, useSetPrivateDecksMutation } from '../generated/graphql/apollo-schema';
import useFirebaseFunction from '../lib/useFirebaseFunction';
import LoadingPage from './LoadingPage';
import DynamicCheckbox from './DynamicCheckbox';
import { setPriority } from 'os';

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

  const [doSetHandle, setHandleError] = useFirebaseFunction<{ handle: string }, { success: boolean }>('social-updateHandle');
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
  }, [data, setHandle]);

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
  return (
    <>
      { loading ? <LoadingPage /> : (
        <Flex direction="column" m="2">
          <FormControl marginBottom="1em">
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input
              disabled
              value={authUser?.email}
              placeholder="Email"
            />
          </FormControl>
          <form
            onSubmit={e => {
              e.preventDefault();
              submitHandle();
            }}
          >
            <Flex direction="row" alignItems="flex-end" >
              <FormControl>
                <FormLabel htmlFor="handle">Handle</FormLabel>
                <Input
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  placeholder="Handle"
                />
                { !!setHandleError && <FormErrorMessage>{setHandleError}</FormErrorMessage> }
              </FormControl>
              { (data?.profile?.handle || '') !== handle && (
                <Button marginLeft={2} onClick={submitHandle}>Save</Button>
              )}
            </Flex>
          </form>
          <FormControl marginTop="1em">
            <FormLabel htmlFor="handle">Settings</FormLabel>
            <DynamicCheckbox
              isChecked={!data?.settings?.private_decks}
              onChange={onPrivateDecksChange}
            >
              Allow people to view my decks
            </DynamicCheckbox>
          </FormControl>
        </Flex>
      )}
    </>
  );
}