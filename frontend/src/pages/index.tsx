import Head from 'next/head'
import React from 'react';
import { Box, Container, Heading, Text, Link } from '@chakra-ui/react'
import NextLink from 'next/link';

export default function Home() {
  return (
    <Container minH="lg">
      <Box
        maxW="64rem"
        marginX="auto"
        py={{ base: "3rem", lg: "4rem" }}
        px={{ base: "1rem", lg: "0" }}
      >
        <Heading>Welcome to RangersDB</Heading>
        <Text paddingTop="2em">This site is still under construction, but you can view the list of <Link as={NextLink} href="/cards">previewed cards</Link>.</Text>
      </Box>
    </Container>
  );
}
