import React, { FormEvent, useCallback, useState } from 'react';
import {
  Button,
  Flex,
  Input,
  Box,
  FormControl,
  FormLabel,
  Link,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import { t } from '@lingui/macro';
import NextLink from 'next/link';

import { useAuth } from '../lib/AuthContext';

export default function Login({ redirect }: { redirect: string | undefined }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signInWithEmailAndPassword } = useAuth();
  const onSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      setError(error.message || t`An error occurred during login.`);
    }
  }, [email, password, signInWithEmailAndPassword]);
  return (
    <Flex direction="column" m="2">
      <form onSubmit={onSubmit}>
        {error && (
          <Alert status="error" mb="4">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
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
