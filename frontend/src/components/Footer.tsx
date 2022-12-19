import React from 'react';
import { Link, Text, Box, useColorModeValue } from '@chakra-ui/react'
import { Trans, t } from '@lingui/macro';
import NextLink from 'next/link';

export default function Footer() {
  const patreon = <Link as={NextLink} href="https://www.patreon.com/arkhamcards">Patreon</Link>;
  return (
    <Box
      as="footer"
      className="site-footer"
      borderTop="1px solid"
      borderColor={useColorModeValue('gray.200', 'gray.600')}
      py="1rem"
      fontSize="0.875rem"
    >
      <Box
        maxW="64rem"
        marginX="auto"
        mb="1.5rem"
        px={{ base: "1rem", lg: "0" }}
      >
        <Text fontSize="sm" color="black">
          {t`The information presented on this site about Earthborne Rangers, both literal and graphical, is copyrighted by Earthborne Games. This website is not produced, endorsed, supported, or affiliated with Earthborne Games.`}
        </Text>
        <Text marginTop={2}>
          <Trans>
            If you&lsquo;d like to support the development and maintenance of this site, consider supporting us on {patreon}.
          </Trans>
        </Text>
      </Box>
    </Box>
  );
}