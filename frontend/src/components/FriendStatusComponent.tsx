import React, { useCallback, useMemo } from 'react';
import { find } from 'lodash';
import { t } from '@lingui/macro';

import { Friend_Status_Type_Enum, UserProfileFragment } from '../generated/graphql/apollo-schema';
import useFirebaseFunction from '../lib/useFirebaseFunction';
import SubmitButton from './SubmitButton';

interface Props {
  profile?: UserProfileFragment;
  userId: string;
  authUserId: string;
  refreshProfile: () => void;
}

export default function FriendStatusComponent({ profile, userId, authUserId, refreshProfile }: Props) {
  const friendState: Friend_Status_Type_Enum = useMemo(() => {
    if (!profile) {
      return Friend_Status_Type_Enum.None;
    }
    if (find(profile.friends, u => u.user?.id === authUserId)) {
      return Friend_Status_Type_Enum.Friend;
    }
    if (find(profile.sent_requests, u => u.user?.id === authUserId)) {
      return Friend_Status_Type_Enum.Sent;
    }
    if (find(profile.received_requests, u => u.user?.id === authUserId)) {
      return Friend_Status_Type_Enum.Received;
    }
    return Friend_Status_Type_Enum.None;
  }, [profile, authUserId]);
  const [updateFriendRequest] = useFirebaseFunction('social-updateFriendRequest');
  const onSubmit = useCallback(async (action: 'request' | 'revoke') => {
    const response = await updateFriendRequest({ userId, action });
    if (response.error) {
      throw new Error(response.error);
    }
    refreshProfile();
    return undefined;
  }, [updateFriendRequest, refreshProfile, userId]);
  const sendFriendRequest = useCallback(() => {
    return onSubmit('request');
  }, [onSubmit])
  const revokeFriendRequest = useCallback(async() => {
    return onSubmit('revoke');
  }, [onSubmit])
  switch (friendState) {
    case Friend_Status_Type_Enum.None:
      return (
        <SubmitButton onSubmit={sendFriendRequest} color="gray">
          {t`Send Friend Request`}
        </SubmitButton>
      );
    case Friend_Status_Type_Enum.Sent:
      return (
        <SubmitButton onSubmit={sendFriendRequest} color="blue">
          {t`Confirm Friend`}
        </SubmitButton>
      );
    case Friend_Status_Type_Enum.Received:
      return (
        <SubmitButton onSubmit={revokeFriendRequest} color="red">
          {t`Cancel Friend Request`}
        </SubmitButton>
      );
    case Friend_Status_Type_Enum.Friend:
      return (
        <SubmitButton onSubmit={revokeFriendRequest} color="red">
          {t`Cancel Friendship`}
        </SubmitButton>
      );
  }
}
