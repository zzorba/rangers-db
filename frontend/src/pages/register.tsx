import React from 'react';
import Register from '../components/Register';
import { Container, Heading, Text } from '@chakra-ui/react';
import { usePostLoginRedirect } from '../lib/hooks';
import PageHeading from '../components/PageHeading';


function RegisterPage() {
  const redirect = usePostLoginRedirect();
  return (
    <Container maxW="container.md" minH="lg">
      <PageHeading title="Register" />
      <Text fontSize="m" padding={1} paddingTop={4}>
        RangersDB is still under construction, and as a result many features might be added or removed during these early days.
      </Text>
      <Text fontSize="m" padding={1} paddingTop={4}>
        The site is likely to go down for maintenance and data might be lost during these early days.
      </Text>
      <Register redirect={redirect} />
    </Container>
  );
}


export default RegisterPage;