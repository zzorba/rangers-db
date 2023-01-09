import React from 'react';
import { Link, Text } from '@chakra-ui/react';
import NextLink from 'next/link';

import { UserInfoFragment } from '../generated/graphql/apollo-schema';
import CoreIcon from '../icons/CoreIcon';

interface Props {
  user?: UserInfoFragment | null;
}
export default function UserLink({ user }: Props) {
  if (!user?.handle) {
    return null;
  }
  return (
    <Link as={NextLink} href={`/users/${user.handle}`}>
      <Text>
        <CoreIcon icon="ranger" size={18} />&nbsp;
        { user.handle }
      </Text>
    </Link>
  );
}