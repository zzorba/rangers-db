import React from 'react';
import Head from 'next/head';
import { Box, Flex, Heading } from '@chakra-ui/react';

export default function PageHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>{title} - RangersDB</title>
      </Head>
      <Box paddingTop="2rem" paddingBottom="2em">
        { children ? (
          <Flex direction="row" justifyContent="space-between">
            <Heading>{title}</Heading>
            {children}
          </Flex>
        ) : <Heading>{title}</Heading> }
      </Box>
    </>
  )
}