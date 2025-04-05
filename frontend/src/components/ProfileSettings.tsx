import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  Flex,
  Input,
  FormControl,
  FormLabel,
  Text,
  Spinner,
  Tooltip,
} from '@chakra-ui/react';
import { t } from '@lingui/macro';
import { useAuth } from '../lib/AuthContext';
import { useGetAllPacksQuery, useGetProfileQuery, useSetAdhereTaboosMutation, useSetPackCollectionMutation, useSetPrivateDecksMutation } from '../generated/graphql/apollo-schema';
import useFirebaseFunction from '../lib/useFirebaseFunction';
import LoadingPage from './LoadingPage';
import DynamicCheckbox from './DynamicCheckbox';
import FriendRequestsComponent from './FriendRequests';
import SolidButton from './SolidButton';
import { useLocale } from '../lib/TranslationProvider';
import { map, sortBy } from 'lodash';
import { usePackSettings } from '../lib/PackSettingsContext';

export default function ProfileSettings() {
  const { locale } = useLocale();
  const packContext = usePackSettings();
  const refreshPackCollection = packContext?.refresh;
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
    refreshPackCollection?.()
  }, [setPackCollection, refreshPackCollection, authUser?.uid]);

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
    refreshPackCollection?.();
  }, [authUser, setPrivateDecks, refreshPackCollection]);
  const [setAdhereTaboos] = useSetAdhereTaboosMutation();
  const onTabooChange = useCallback(async(value: boolean) => {
    await setAdhereTaboos({
      variables: {
        userId: authUser?.uid || '',
        adhereTaboos: value,
      },
    });
  }, [authUser, setAdhereTaboos]);
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
            <Flex direction="column">
              <DynamicCheckbox
                isChecked={!data?.settings?.private_decks}
                onChange={onPrivateDecksChange}
              >
                {t`Allow people to view my decks`}
              </DynamicCheckbox>
              <DynamicCheckbox
                isChecked={!!data?.settings?.adhere_taboos}
                onChange={onTabooChange}
              >
                <Tooltip label={t`The Elder's Book of Uncommon Wisdom is a list of rebalanced Ranger cards with optional text changes. These changes are designed to maintain a healthy and balanced cardpool, and to increase deck diversity by encouraging players to build decks with underutilized cards instead of common staples.`}>
                  {t`Follow the Elder's Book of Uncommon Wisdom `}
                </Tooltip>
              </DynamicCheckbox>
            </Flex>
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
