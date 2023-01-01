import React, { useCallback, useMemo } from 'react';
import { Flex, ButtonGroup, List, ListItem, Text } from '@chakra-ui/react';
import { map, forEach, flatMap } from 'lodash';
import { t } from '@lingui/macro';

import { UserInfoFragment, UserProfileFragment } from '../generated/graphql/apollo-schema';
import ListHeader from './ListHeader';
import { SubmitIconButton } from './SubmitButton';
import FriendRequestsComponent from './FriendRequests';
import { SlMinus, SlPlus } from 'react-icons/sl';

interface Props {
  selection: string[];
  add: (id: string) => Promise<string | undefined>;
  remove?: (id: string) => Promise<string | undefined>;
  profile?: UserProfileFragment;
  refreshProfile: () => void;
  noBorder?: boolean;
}

function FriendRow({ add, remove, user, paddingLeft }: {
  user: UserInfoFragment;
  paddingLeft?: number;
  add?: (id: string) => Promise<string | undefined>;
  remove?: (id: string) => Promise<string | undefined>;
}) {
  const onAdd = useCallback(async () => {
    if (add) {
      return await add(user.id);
    }
    return undefined;
  }, [add, user]);
  const onRemove = useCallback(async() => {
    if (remove) {
      return await remove(user.id);
    }
    return undefined;
  }, [remove, user]);
  return (
    <ListItem paddingTop={2} paddingBottom={2} paddingLeft={paddingLeft}>
      <Flex direction="row" alignItems="center" justifyContent="space-between">
        <Text paddingLeft={2} paddingRight={2}>{user.handle}</Text>
        <ButtonGroup marginRight={2}>
          { !!add && <SubmitIconButton variant="ghost" aria-label={t`Add`} onSubmit={onAdd} icon={<SlPlus/>} /> }
          { !!remove && <SubmitIconButton variant="ghost" aria-label={t`Remove`} onSubmit={onRemove} icon={<SlMinus />} /> }
        </ButtonGroup>
      </Flex>
    </ListItem>
  );
}

export default function FriendChooser({ noBorder, selection, add, remove, profile, refreshProfile }: Props) {
  const friendsById = useMemo(() => {
    const r: { [id: string]: UserInfoFragment | undefined } = {};
    forEach(profile?.friends, f => {
      if (f.user) {
        r[f.user.id] = f.user;
      }
    });
    return r;
  }, [profile]);
  const selectedFriends = useMemo(() => {
    return flatMap(selection, id => {
      const friend = friendsById[id];
      if (!friend) {
        return [];
      }
      return friend;
    });
  }, [selection, friendsById])
  return (
    <List borderRadius="8px" borderWidth={noBorder ? undefined : '1px'}>
      { !!selectedFriends.length && (
        <>
          { map(selectedFriends, friend => (
            <FriendRow
              key={friend.id}
              remove={remove}
              user={friend}
              paddingLeft={noBorder ? undefined : 2}
            />
          ))}
           <ListItem borderBottomWidth={1} />
        </>
      ) }
      <FriendRequestsComponent
        profile={profile}
        removeIds={selection}
        refreshProfile={refreshProfile}
        friendActions={[{
          title: t`Add to campaign`,
          onPress: add,
          icon: 'add'
        }]}
        paddingLeft={noBorder ? undefined : 2}
      />
    </List>
  )
}