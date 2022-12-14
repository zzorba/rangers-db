import React, { useState } from 'react';
import { Box, Button, Flex, FormControl, FormLabel, Input, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { t } from '@lingui/macro';

import { useAuth } from '../lib/AuthContext';

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
        {t`Don't have an account?`} <Link as={NextLink} href={redirect ? `/register?redirect=${redirect}` : '/register'}>Register</Link> now.
      </Box>
    </Flex>
  );
}