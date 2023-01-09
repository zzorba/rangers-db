import React from 'react';
import { Flex, Link, Text } from '@chakra-ui/react';
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
      <CoreIcon icon="ranger" size={16} />&nbsp;{ user.handle }
    </Link>
  );
}