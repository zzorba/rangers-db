import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  Flex,
  Input,
  FormControl,
  FormLabel,
  Text,
  Spinner,
} from '@chakra-ui/react';
import { t } from '@lingui/macro';
import { useAuth } from '../lib/AuthContext';
import { useGetAllPacksQuery, useGetProfileQuery, useSetPackCollectionMutation, useSetPrivateDecksMutation } from '../generated/graphql/apollo-schema';
import useFirebaseFunction from '../lib/useFirebaseFunction';
import LoadingPage from './LoadingPage';
import DynamicCheckbox from './DynamicCheckbox';
import FriendRequestsComponent from './FriendRequests';
import SolidButton from './SolidButton';
import { useLocale } from '../lib/TranslationProvider';
import { map, sortBy } from 'lodash';

export default function ProfileSettings() {
  const { locale } = useLocale();
  const [handle, setHandle] = useState('');
  const { data: packs, loading: packsLoading } = useGetAllPacksQuery({
    variables: {
      locale,
    },
    fetchPolicy: 'no-cache',
  });

  const { authUser } = useAuth();
  const [setPackCollection] = useSetPackCollectionMutation();
  const saveCollectionUpdates = useCallback((collection: string[]) => {
    setPackCollection({
      variables: {
        userId: authUser?.uid || '',
        pack_collection: collection,
      },
    });
  }, [setPackCollection, authUser?.uid]);

  const saveCollectionRef = useRef(saveCollectionUpdates);
  useEffect(() => {
    saveCollectionRef.current = saveCollectionUpdates;
  }, [saveCollectionUpdates]);
  const [currentCollection, updateCollection] = useReducer((state: string[], action: {
    type: 'set',
    packs: string[];
  } | {
    type: 'toggle';
    set: boolean;
    pack: string;
  }): string[] => {
    switch (action.type) {
      case 'set': {
        const newState = [...action.packs];
        return newState;
      }
      case 'toggle': {
        const newState = state.filter(pack => pack !== action.pack);
        if (action.set) {
          newState.push(action.pack);
        }
        const sorted = sortBy(newState, x => x);
        saveCollectionRef.current(sorted);
        return sorted;
      }
    }
  }, []);
  const { data, loading, refetch } = useGetProfileQuery({
    variables: {
      id: authUser?.uid || '',
    },
    skip: !authUser,
    fetchPolicy: 'no-cache',
  });
  useEffect(() => {
    if (!loading) {
      updateCollection({
        type: 'set',
        packs: data?.settings?.pack_collection ?? [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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
      variables: {
        userId: authUser?.uid || '',
        privateDecks: !value,
      },
    });
  }, [authUser, setPrivateDecks]);
  const packCollection = useMemo(() => {
    return new Set<string>(currentCollection);
  },[currentCollection]);

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

          <FormControl marginTop="1em">
            <FormLabel htmlFor="handle">{t`Collection`}</FormLabel>
            <Flex direction="column">
              { packsLoading ? <Spinner size="md" /> : (
                <>
                {map(packs?.packs, pack => {
                  return (
                    <DynamicCheckbox
                      key={pack.id}
                      isChecked={pack.id === 'core' ? true : packCollection.has(pack.id ?? '')}
                      isDisabled={pack.id === 'core'}
                      onChange={async (checked: boolean) => updateCollection({ type: 'toggle', pack: pack.id ?? '', set: checked })}
                    >
                      {pack.name ?? ''}
                    </DynamicCheckbox>
                  );
                })}
              </>
              )}
            </Flex>
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
