import React from 'react';
import Register from '../components/Register';
import { Container } from '@chakra-ui/react';
import { usePostLoginRedirect } from '../lib/hooks';

function RegisterPage() {
  const redirect = usePostLoginRedirect();
  return (
    <Container maxW="container.md" minH="lg">
      <Register redirect={redirect} />
    </Container>
  );
}

export default RegisterPage;