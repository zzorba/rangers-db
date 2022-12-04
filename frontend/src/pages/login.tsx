import React from 'react';
import Login from '../components/Login';
import { Container } from '@chakra-ui/react';
import { usePostLoginRedirect } from '../lib/hooks';

function LoginPage() {
  const redirect = usePostLoginRedirect();
  return (
    <Container maxW="container.md" minH="lg">
      <Login redirect={redirect} />
    </Container>
  );
}

export default LoginPage;