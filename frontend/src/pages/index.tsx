import React from 'react';
import Head from 'next/head'
import { t, Trans } from '@lingui/macro';

import { Box, Container, Heading, Text, Link } from '@chakra-ui/react'
import NextLink from 'next/link';

function Home() {
  return (
    <>
      <Head>
        <title>
          {t`RangersDB`}
        </title>
      </Head>
      <Container minH="lg">
        <Box
          maxW="64rem"
          marginX="auto"
          py={{ base: "3rem", lg: "4rem" }}
          px={{ base: "1rem", lg: "0" }}
        >
          <Heading>{t`Welcome to RangersDB`}</Heading>
          <Text paddingTop="2em">
            <Trans>This site is still under construction, but you can view the list of <Link textDecorationLine="underline" as={NextLink} href="/cards">previewed cards</Link> and can <Link as={NextLink} href="/register" textDecorationLine="underline">register</Link> and start building <Link textDecorationLine="underline" as={NextLink} href="/decks">decks</Link>.</Trans>
          </Text>
          <Text paddingTop="1em">
            <Trans>There is also a <Link textDecorationLine="underline" as={NextLink} href="/campaigns">campaign</Link> tracking system that you can share with your friends and track rewards and events as you progress through the valley.</Trans>
          </Text>
        </Box>
      </Container>
    </>
  );
}


export default Home;