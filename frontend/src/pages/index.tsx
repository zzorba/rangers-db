import Head from 'next/head'
import React from 'react';
import { Box, Container, Heading, Text, Link } from '@chakra-ui/react'
import NextLink from 'next/link';

export default function Home() {
  return (
    <>
     <Head>
        <title>RangersDB</title>
      </Head>
      <Container minH="lg">
        <Box
          maxW="64rem"
          marginX="auto"
          py={{ base: "3rem", lg: "4rem" }}
          px={{ base: "1rem", lg: "0" }}
        >
          <Heading>Welcome to RangersDB</Heading>
          <Text paddingTop="2em">
            This site is still under construction, but you can view the list of <Link textDecorationLine="underline" as={NextLink} href="/cards">previewed cards</Link> and can <Link as={NextLink} href="/register" textDecorationLine="underline">register</Link> and start building <Link textDecorationLine="underline" as={NextLink} href="/decks">decks</Link>.
          </Text>
          <Text fontSize="m" padding={1} paddingTop={4}>
            As the site is still very young, features might be added or removed during these early days, and the site is likely to go down for maintenance and data <b>might be lost</b> during these early days.
          </Text>
          <Text fontSize="m" padding={1} paddingTop={4}>
            Things should stabilize quickly though, and I will take down this notice when I feel confident about the state of things.
          </Text>
        </Box>
      </Container>
    </>
  );
}
