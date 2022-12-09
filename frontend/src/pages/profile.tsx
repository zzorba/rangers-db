import React from 'react';
import Head from 'next/head';
import { Container } from '@chakra-ui/react';
import { useRequireAuth } from '../lib/hooks';
import Profile from '../components/Profile';
import PageHeading from '../components/PageHeading';


function ProfilePage() {
  useRequireAuth();
  return (
    <Container maxW="container.md" minH="lg">
      <PageHeading title="Profile" />
      <Profile />
    </Container>
  );
}


export default ProfilePage;