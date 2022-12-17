import React, { useCallback, useState, useMemo } from 'react';
import { FormControl, Text, Flex, IconButton, Input, useDisclosure, Spinner, List, ListItem, FormErrorMessage } from '@chakra-ui/react';
import { t } from '@lingui/macro';
import useFirebaseFunction from '../lib/useFirebaseFunction';
import { SearchIcon } from '@chakra-ui/icons';
import { map } from 'lodash';
import { BasicUser, FriendAction, FriendLine } from './FriendRequests';

interface SearchResults {
  users: BasicUser[];
  fuzzyUsers: BasicUser[];
  hasMore: boolean;
}
const EMPTY_ACTIONS: FriendAction[] = [];
export default function FriendSearch({ sendFriendRequest }: { sendFriendRequest: (userId: string) => Promise<void>}) {
  const [searchFriends, searchError] = useFirebaseFunction<{ search: string }, SearchResults>('social-searchUsers');
  const [liveFriendRequests, setLiveFriendRequests] = useState<{[userId: string]: boolean | undefined}>({});
  const sendRequest = useCallback(async (userId: string) => {
    await sendFriendRequest(userId);
    setLiveFriendRequests({
      ...liveFriendRequests,
      [userId]: true,
    });
  }, [sendFriendRequest, liveFriendRequests, setLiveFriendRequests]);
  const friendActions: FriendAction[] = useMemo(() => {
    return [
      {
        title: t`Request friend`,
        onPress: sendRequest,
        icon: 'check',
      },
    ]
  }, [sendRequest])
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResults | undefined>();
  const doSearch = useCallback(async () => {
    setSearching(true);
    const r = await searchFriends({ search });
    if (r.success) {
      setResults(r.data);
    }
    setSearching(false);
  }, [search, setResults, searchFriends]);
  return (
    <Flex direction="column">
      <form onSubmit={e => {
        e.preventDefault();
        doSearch();
      }}>
        <FormControl marginTop={2}>
          <Flex direction="row">
            <Input
              placeholder={t`Find new friends`}
              value={search}
              type="search"
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={e=> {
                if (e.key === 'Enter') {
                  doSearch();
                  e.preventDefault();
                }
              }}
            />
            { !!search && <IconButton marginLeft={2} aria-label='Search' onClick={doSearch} icon={<SearchIcon />} />}
          </Flex>
          { !!searchError && <Text color="red">{searchError}</Text> }
        </FormControl>
      </form>
      <List>
        { searching && (
          <ListItem padding={2}>
            <Flex direction="row" justifyContent="center">
              <Spinner margin={2} size="md" />
            </Flex>
          </ListItem>
        ) }
        { !!results && (
          (results.users.length || results.fuzzyUsers.length) ? (
            <>
              { map(results.users, u => (
                <FriendLine key={u.id} user={u} actions={liveFriendRequests[u.id] ? EMPTY_ACTIONS : friendActions} />
              )) }
              { map(results.fuzzyUsers, u => (
                <FriendLine key={u.id} user={u} actions={liveFriendRequests[u.id] ? EMPTY_ACTIONS : friendActions} />
              )) }
            </>
          ) : (
            <ListItem paddingTop={2} paddingBottom={2}><Text>{t`No results`}</Text></ListItem>
        ))}
      </List>
    </Flex>
  )
}
