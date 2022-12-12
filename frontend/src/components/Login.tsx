import React, { useEffect, useState } from 'react';
import {
  Button,
  Flex,
  Input,
  Box,
  FormControl,
  FormLabel,
  Link,
} from '@chakra-ui/react';
import { t } from '@lingui/macro';
import NextLink from 'next/link';
import { useAuth } from '../lib/AuthContext';

export default function Login({ redirect }: { redirect: string | undefined }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmailAndPassword } = useAuth();
  return (
    <Flex direction="column" m="2">
      <form
        onSubmit={e => {
          e.preventDefault();
          signInWithEmailAndPassword(email, password);
        }}
      >
        <FormControl isRequired>
          <FormLabel htmlFor="email">{t`Email`}</FormLabel>
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t`E-mail Address`}
            type="email"
            autoComplete="email"
          />
        </FormControl>
        <FormControl isRequired marginTop="1em">
          <FormLabel htmlFor="password">{t`Password`}</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t`Password`}
            autoComplete="current-password"
          />
        </FormControl>
        <Button w="100%" my="2" type="submit">
          {t`Login`}
        </Button>
      </form>
      <Link as={NextLink} href="/reset-password">{t`Forgot Password`}</Link>
      <Box>
        {t`Don't have an account?`} <Link as={NextLink} href={redirect ? `/register?redirect=${redirect}` : '/register'}>{t`Register now`}</Link>.
      </Box>
    </Flex>
  );
}
