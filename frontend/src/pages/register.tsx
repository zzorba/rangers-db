import React from 'react';
import { Container, Text } from '@chakra-ui/react';
import { t } from '@lingui/macro';

import Register from '../components/Register';
import { usePostLoginRedirect } from '../lib/hooks';
import PageHeading from '../components/PageHeading';
import { getLocalizationServerSideProps } from '../lib/Lingui';


function RegisterPage() {
  const redirect = usePostLoginRedirect();
  return (
    <Container maxW="container.md" minH="lg">
      <PageHeading title={t`Register`} />
      <Text fontSize="m" padding={1} paddingTop={4}>
        {t`RangersDB is still under construction, and as a result many features might be added or removed during these early days.`}
      </Text>
      <Text fontSize="m" padding={1} paddingTop={4}>
        {t`The site is likely to go down for maintenance and data might be lost during these early days.`}
      </Text>
      <Register redirect={redirect} />
    </Container>
  );
}


export default RegisterPage;

export const getServerSideProps = getLocalizationServerSideProps;
