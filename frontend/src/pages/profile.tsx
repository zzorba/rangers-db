import React from 'react';
import { Container } from '@chakra-ui/react';
import { useRequireAuth } from '../lib/hooks';
import Profile from '../components/Profile';

function ProfilePage() {
  useRequireAuth();
  return (
    <Container maxW="container.md" minH="lg">
      <Profile />
    </Container>
  );
}

export default ProfilePage;