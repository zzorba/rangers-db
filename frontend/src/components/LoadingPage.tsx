import React from 'react';
import { Flex, Spinner } from '@chakra-ui/react';

export default function LoadingPage() {
  return (
    <Flex minH="lg" flexDirection="column" alignItems="center" justifyContent="center">
      <Spinner size="xl" />
    </Flex>
  );
}