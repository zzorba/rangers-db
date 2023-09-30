import React from 'react';
import Head from 'next/head'
import { t, Trans } from '@lingui/macro';

import { Box, Container, Heading, Text, Link } from '@chakra-ui/react'
import NextLink from 'next/link';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { loadCatalog } from '../lib/Lingui';

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
          <Heading>
            {t`Welcome to RangersDB`}
          </Heading>
          <Text paddingTop="2em">
            <Trans>This site is a digital companion for the excellent <Link textDecoration="underline" as={NextLink} href="https://earthbornegames.com/">Earthborne Rangers</Link> adventure card game.</Trans>
            </Text>
          <Text paddingTop="2em">
            <Trans>You can view <Link textDecorationLine="underline" as={NextLink} href="/cards">player cards</Link>, <Link textDecorationLine="underline" as={NextLink} href="/decks">build decks</Link>, and use the digital <Link textDecorationLine="underline" as={NextLink} href="/campaigns">campaign tracker</Link>.</Trans>
          </Text>
        </Box>
      </Container>
    </>
  );
}


export default Home;

export async function getServerSideProps(
  ctx: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<any>> {
  // some server side logic

  return {
    props: {
      i18n: await loadCatalog(ctx.locale as string),
    },
  };
}
