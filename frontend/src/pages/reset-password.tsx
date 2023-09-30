import React from 'react';
import { Container } from '@chakra-ui/react';

import ResetPassword from '../components/ResetPassword';
import { usePostLoginRedirect } from '../lib/hooks';
import { getLocalizationServerSideProps } from '../lib/Lingui';

function ResetPasswordPage() {
  const redirect = usePostLoginRedirect();
  return (
    <Container maxW="container.md" minH="lg">
      <ResetPassword redirect={redirect} />
    </Container>
  );
}


export default ResetPasswordPage;

export const getServerSideProps = getLocalizationServerSideProps;
