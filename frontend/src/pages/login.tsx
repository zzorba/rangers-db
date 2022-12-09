import React from 'react';
import Login from '../components/Login';
import { Container, Heading } from '@chakra-ui/react';
import { usePostLoginRedirect } from '../lib/hooks';
import PageHeading from '../components/PageHeading';


function LoginPage() {
  const redirect = usePostLoginRedirect();
  return (
    <Container maxW="container.md" minH="lg">
      <PageHeading title="Login" />
      <Login redirect={redirect} />
    </Container>
  );
}

export default LoginPage;