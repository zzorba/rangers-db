import React, { useCallback, useMemo } from 'react';
import { List, ListItem, IconButton, ButtonGroup, Text, Flex } from '@chakra-ui/react';
import { filter, flatMap, map } from 'lodash';
import { t } from '@lingui/macro';
import { SlPlus, SlMinus, SlCheck } from 'react-icons/sl';

import ListHeader from './ListHeader';
import { UserInfoFragment, UserProfileFragment } from '../generated/graphql/apollo-schema';
import useFirebaseFunction from '../lib/useFirebaseFunction';
import FriendSearch from './FriendSearch';
import { useTheme } from '../lib/ThemeContext';
import { SubmitIconButton } from './SubmitButton';

interface Props {
  profile?: UserProfileFragment;
  removeIds?: string[];
  refreshProfile: () => void;
  friendActions?: FriendAction[];
  paddingLeft?: number;
}

export interface FriendAction {
  title: string;
  icon: 'check' | 'remove' | 'add';
  onPress: (userId: string) => Promise<string | undefined>;
}

function FriendActionButton({ userId, action: { onPress, title, icon } }: { userId: string; action: FriendAction }) {
  const onClick = useCallback(async() => onPress(userId), [onPress, userId]);
  const icons = {
    check: <SlCheck />,
    remove: <SlMinus />,
    add: <SlPlus />,
  }
  return (
    <SubmitIconButton
      aria-label={title}
      onSubmit={onClick}
      icon={icons[icon]}
      variant="ghost"
    />
  );
}

export interface BasicUser {
  id: string;
  handle?: string;
}

export function FriendLine({ user, actions, paddingLeft }: { user: BasicUser | UserInfoFragment; actions: FriendAction[]; paddingLeft?: number }) {
  const { colors } = useTheme();
  return (
    <ListItem paddingTop={2} paddingBottom={2} paddingLeft={paddingLeft} borderBottomWidth="1px" borderBottomColor={colors.divider}>
      <Flex direction="row" justifyContent="space-between">
        <Text padding={2}>{user.handle || user.id}</Text>
        <ButtonGroup marginRight={2}>
          { map(actions, (a, idx) => <FriendActionButton key={idx} userId={user.id} action={a} /> ) }
        </ButtonGroup>
      </Flex>
    </ListItem>
  );
}

function FriendSection({ users, title, actions, removeIds, children, paddingLeft }: {
  users: UserInfoFragment[];
  title: string;
  actions: FriendAction[];
  removeIds?: string[];
  children?: React.ReactNode;
  paddingLeft?: number;
}) {
  const theUsers = useMemo(() => {
    if (!removeIds) {
      return users;
    }
    const removeSet = new Set(removeIds);
    return filter(users, u => !removeSet.has(u.id));
  }, [users, removeIds]);
  if (!theUsers.length && !children) {
    return null;
  }
  return (
    <List>
      <ListHeader title={title} />
      { map(theUsers, user => <FriendLine paddingLeft={paddingLeft} key={user.id} user={user} actions={actions} />) }
      { children }
    </List>
  )
}

export default function FriendRequestsComponent({
  profile,
  refreshProfile,
  removeIds,
  friendActions,
  paddingLeft,
}: Props) {
  const [updateFriendRequest, error] = useFirebaseFunction('social-updateFriendRequest');
  const onSubmit = useCallback(async (userId: string, action: 'request' | 'revoke') => {
    const r = await updateFriendRequest({ userId, action });
    if (r.error) {
      return r.error;
    }
    refreshProfile();
    return undefined;
  }, [updateFriendRequest, refreshProfile]);
  const sendFriendRequest = useCallback((userId: string) => {
    return onSubmit(userId, 'request');
  }, [onSubmit]);
  const revokeFriendRequest = useCallback((userId: string) => {
    return onSubmit(userId, 'revoke');
  }, [onSubmit]);
  const [receivedRequests, sentRequests, friends] = useMemo(() => {
    if (!profile || !profile.friends) {
      return [[], [], [], []];
    }
    const received = flatMap(profile.received_requests, friend => {
      if (friend.user) {
        return [friend.user];
      }
      return [];
    });
    const sent = flatMap(profile.sent_requests, friend => {
      if (friend.user) {
        return [friend.user];
      }
      return [];
    });
    const friends= flatMap(profile.friends, friend => {
      if (friend.user) {
        return [friend.user];
      }
      return [];
    });
    return [received, sent, friends];
  }, [profile]);
  if (!profile) {
    return null;
  }
  return (
    <List>
      <FriendSection
        key="received"
        title={t`Friend Requests`}
        users={receivedRequests}
        actions={[
          {
            title: t`Accept`,
            onPress: sendFriendRequest,
            icon: 'check',
          },
          {
            title: t`Reject`,
            onPress: revokeFriendRequest,
            icon: 'remove',
          },
        ]}
        paddingLeft={paddingLeft}
      />
      <FriendSection
        key="sent"
        title={t`Pending Requests`}
        users={sentRequests}
        actions={[{
          title: t`Revoke`,
          onPress: revokeFriendRequest,
          icon: 'remove',
        }]}
        paddingLeft={paddingLeft}
      />
      <FriendSection
        key="friends"
        title={t`Friends`}
        users={friends}
        removeIds={removeIds}
        actions={friendActions || [{
          title: t`Revoke`,
          onPress: revokeFriendRequest,
          icon: 'remove',
        }]}
        paddingLeft={paddingLeft}
      />
      <FriendSearch
        sendFriendRequest={sendFriendRequest}
        paddingLeft={paddingLeft}
      />
    </List>
  );
}
