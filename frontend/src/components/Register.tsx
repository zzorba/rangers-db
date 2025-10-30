import React, { useState } from 'react';
import {
  Flex,
  Box,
  Input,
  FormControl,
  FormLabel,
  Button,
  Link,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { Trans, t } from '@lingui/macro';

import { useAuth } from '../lib/AuthContext';

function Register({ redirect }: { redirect: string | undefined }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { createUserWithEmailAndPassword } = useAuth();
  const register = async () => {
    try {
      setError('');
      await createUserWithEmailAndPassword(email, password);
    } catch (err: any) {
      setError(err.message || t`An error occurred during registration.`);
    }
  };
  return (
    <Flex direction="column" m="2">
      <form
        onSubmit={e => {
          e.preventDefault();
          register();
        }}
      >
        {error && (
          <Alert status="error" mb="4">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FormControl isRequired>
          <FormLabel>{t`Email`}</FormLabel>
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t`E-mail Address`}
            type="email"
            autoComplete="email"
          />
        </FormControl>
        <FormControl isRequired marginTop="1em">
          <FormLabel>{t`Password`}</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t`Password`}
            autoComplete="current-password"
            minLength={6}
          />
        </FormControl>
        <Button w="100%" my="2" type="submit">
          {t`Register`}
        </Button>
      </form>
      <Box>
        <Trans>Already have an account? <Link as={NextLink} href={redirect ? `/login?redirect=${redirect}` : '/login'}>Login</Link> now.</Trans>
      </Box>
    </Flex>
  );
}
export default Register;