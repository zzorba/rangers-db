import React from 'react';
import { Container } from '@chakra-ui/react';
import ResetPassword from '../components/ResetPassword';
import { usePostLoginRedirect } from '../lib/hooks';

export default function ResetPasswordPage() {
  const redirect = usePostLoginRedirect();
  return (
    <Container maxW="container.md" minH="lg">
      <ResetPassword redirect={redirect} />
    </Container>
  );
}
