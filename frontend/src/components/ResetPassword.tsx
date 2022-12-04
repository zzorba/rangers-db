import React, { useEffect, useState } from 'react';
import Router from 'next/router';
import NextLink from 'next/link';

import { useAuth } from '../lib/AuthContext';
import { Box, Button, Flex, FormControl, FormLabel, Input, Link } from '@chakra-ui/react';

export default function ResetPassword({ redirect }: { redirect: string | undefined }) {
  const [email, setEmail] = useState('');
  const { sendPasswordResetEmail } = useAuth();
  return (
    <Flex direction="column" m="2">
      <form
        onSubmit={e => {
          e.preventDefault();
          sendPasswordResetEmail(email);
        }}
      >
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="E-mail Address"
            autoComplete="email"
          />
        </FormControl>
        <Button w="100%" my="2" type="submit">
          Send password reset email
        </Button>
      </form>
      <Box>
        Don't have an account? <Link as={NextLink} href={redirect ? `/register?redirect=${redirect}` : '/register'}>Register</Link> now.
      </Box>
    </Flex>
  );
}