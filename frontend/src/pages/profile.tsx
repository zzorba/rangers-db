import React from 'react';
import Head from 'next/head';
import { Container } from '@chakra-ui/react';
import { useRequireAuth } from '../lib/hooks';
import Profile from '../components/Profile';

function ProfilePage() {
  useRequireAuth();
  return (
    <>
      <Head>
        <title>Profile - RangersDB</title>
      </Head>
      <Container maxW="container.md" minH="lg">
        <Profile />
      </Container>
    </>
  );
}

export default ProfilePage;