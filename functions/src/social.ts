import * as admin from 'firebase-admin';
import { forEach, map, trim } from 'lodash';
import { t } from 'ttag';

import { ADMIN_USER } from './schema';
import { onCallAuth, RequestData } from './core';
import client from './graphql/client';
import { Rangers_Friend_Status_Type_Enum } from './graphql/schema';

function normalizeHandle(handle: string) {
  return trim(handle.replace(/[.$[\]#\/]/g, '_').toLowerCase());
}

interface UpdateEmailData extends RequestData {
  userId?: string;
  email?: string;
}
export const updateEmail = onCallAuth(async (data: UpdateEmailData, context) => {
  const isAdmin = context.auth.uid === ADMIN_USER;
  if (!isAdmin) {
    return {
      error: 'Request not authorized.',
    };
  }
  if (!data.userId || !data.email) {
    return {
      error: 'Missing userId/email',
    };
  }
  await admin.auth().updateUser(data.userId, { email: data.email });
  return {
    success: true,
  };
});


interface UpdatePasswordData extends RequestData {
  userId?: string;
  password?: string;
}
export const updatePassword = onCallAuth(async (data: UpdatePasswordData, context) => {
  const isAdmin = context.auth.uid === ADMIN_USER;
  if (!isAdmin) {
    return {
      error: 'Request not authorized.',
    };
  }
  if (!data.userId || !data.password) {
    return {
      error: 'Missing userId/email',
    };
  }
  await admin.auth().updateUser(data.userId, { password: data.password });
  return {
    success: true,
  };
});

interface UpdateHandleData extends RequestData {
  userId?: string;
  handle?: string;
}

export const updateHandle = onCallAuth(async (data: UpdateHandleData, context) => {
  const isAdmin = context.auth.uid === ADMIN_USER;
  const userId = data.userId || context.auth.uid;
  if (!isAdmin && userId !== context.auth.uid) {
    return {
      error: 'Request not authorized. You can only edit your own profile.',
    };
  }
  if (!data.handle || data.handle.length < 3 || data.handle.length > 22) {
    return {
      error: 'Handle must consist of only letters and numbers, and be between 2 and 22 characters long.',
    };
  }
  const normalizedHandle = normalizeHandle(data.handle);
  const currentHandle = await client.getUserByNormalizedHandle({ normalizedHandle });
  if (currentHandle.rangers_users.length && currentHandle.rangers_users[0].id !== userId) {
    return {
      error: t`Sorry, this handle has already been taken.`,
    };
  }

  await client.updateHandle({ userId, handle: trim(data.handle), normalizedHandle });
  return {
    success: true,
  };
});


interface RequestFriendData extends RequestData {
  userId: string;
  action: 'request' | 'revoke';
}
export const updateFriendRequest = onCallAuth(async (data: RequestFriendData, context) => {
  if (!data.userId) {
    return {
      error: 'Must specify user to request friendship from.',
    };
  }
  if (context.auth.uid === data.userId) {
    return {
      error: 'You cannot friend request yourself.',
    };
  }
  const requestUserId = context.auth.uid;
  const selfUser = await client.getUser({ id: requestUserId });
  if (!selfUser.rangers_users_by_pk || !selfUser.rangers_users_by_pk.handle) {
    return {
      error: 'You have not set a handle yet.',
    };

  }
  const fromUserId = context.auth.uid;
  const toUserId = data.userId;
  const friendStatusObj = await client.friendStatus({ fromUserId, toUserId });
  const friendStatus: Rangers_Friend_Status_Type_Enum = (friendStatusObj.rangers_friend_status_by_pk?.status || Rangers_Friend_Status_Type_Enum.None);
  switch (data.action) {
    case 'request':
      switch (friendStatus) {
        case Rangers_Friend_Status_Type_Enum.None:
          await client.sendFriendRequest({ fromUserId, toUserId });
          break;
        case Rangers_Friend_Status_Type_Enum.Received:
          await client.acceptFriendRequest({ fromUserId, toUserId });
          break;
        case Rangers_Friend_Status_Type_Enum.Friend:
        case Rangers_Friend_Status_Type_Enum.Sent:
          // NOOP
          break;
      }
      break;
    case 'revoke':
      switch (friendStatus) {
        case Rangers_Friend_Status_Type_Enum.Friend:
        case Rangers_Friend_Status_Type_Enum.Received:
        case Rangers_Friend_Status_Type_Enum.Sent:
          await client.rejectFriendRequest({ fromUserId, toUserId });
          break;
        case Rangers_Friend_Status_Type_Enum.None:
          break;
      }
      break;
  }
  return {
    success: true,
  };
});

export const deleteAccount = onCallAuth(async (data: {}, context) => {
  await admin.auth().deleteUser(context.auth.uid);
  return {
    success: true,
  };
});

interface SearchUsersData extends RequestData {
  search: string;
  offset?: number;
}
export const searchUsers = onCallAuth(async (data: SearchUsersData, context) => {
  if (data.search.length < 2) {
    return {
      error: t`Minimum search size is 2 characters.`,
    };
  }
  const normalizedSearch = normalizeHandle(data.search);
  const results = await client.searchHandles({
    normalizedHandle: `%${normalizedSearch}%`,
    normalizedHandleStart: `${normalizedSearch}%`,
    offset: data.offset
  });
  const users: { id: string; handle: string | undefined }[] = [];
  forEach(results.startMatch, (user) => {
    users.push({
      id: user.id,
      handle: user.handle || undefined,
    });
  });
  const alreadyFound = new Set(map(users, u => u.id));
  const fuzzyUsers: { id: string; handle: string | undefined }[] = [];
  forEach(results.looseMatch, (user) => {
    if (!alreadyFound.has(user.id)) {
      fuzzyUsers.push({
        id: user.id,
        handle: user.handle || undefined,
      });
    }
  });

  return {
    users,
    fuzzyUsers,
    hasMore: users.length === 20,
  };
});
