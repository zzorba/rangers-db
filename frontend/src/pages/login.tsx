import React from 'react';
import { Container } from '@chakra-ui/react';
import { t } from '@lingui/macro';

import Login from '../components/Login';
import { usePostLoginRedirect } from '../lib/hooks';
import PageHeading from '../components/PageHeading';


function LoginPage() {
  const redirect = usePostLoginRedirect();
  return (
    <Container maxW="container.md" minH="lg">
      <PageHeading title={t`Login`} />
      <Login redirect={redirect} />
    </Container>
  );
}

export default LoginPage;