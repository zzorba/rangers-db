import React from 'react';
import { t } from '@lingui/macro';
import { Container } from '@chakra-ui/react';

import { useRequireAuth } from '../lib/hooks';
import PageHeading from '../components/PageHeading';
import ProfileSettings from '../components/ProfileSettings';
import { getLocalizationServerSideProps } from '../lib/Lingui';

function ProfilePage() {
  useRequireAuth();
  return (
    <Container maxW="container.md" minH="lg">
      <PageHeading title={t`Account Settings`} />
      <ProfileSettings />
    </Container>
  );
}

export default ProfilePage;

export const getServerSideProps = getLocalizationServerSideProps;
