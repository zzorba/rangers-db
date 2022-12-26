import React from 'react';
import { Box, Flex, Heading } from '@chakra-ui/react';
import Head from 'next/head';
import { t } from '@lingui/macro';

export default function PageHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>{title} - {t`RangersDB`}</title>
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