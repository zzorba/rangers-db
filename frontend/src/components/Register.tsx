import React, { useEffect, useState } from 'react';
import {
  Flex,
  Box,
  Input,
  FormControl,
  FormLabel,
  Button,
  Link,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useAuth } from '../lib/AuthContext';

function Register({ redirect }: { redirect: string | undefined }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { createUserWithEmailAndPassword } = useAuth();
  const register = () => {
    createUserWithEmailAndPassword(email, password);
  };
  return (
    <Flex direction="column" m="2">
      <form
        onSubmit={e => {
          e.preventDefault();
          register();
        }}
      >
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="E-mail Address"
            type="email"
            autoComplete="email"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            minLength={6}
          />
        </FormControl>
        <Button w="100%" my="2" type="submit">
          Register
        </Button>
      </form>
      <Box>
        Already have an account? <Link as={NextLink} href={redirect ? `/login?redirect=${redirect}` : '/login'}>Login</Link> now.
      </Box>
    </Flex>
  );
}
export default Register;