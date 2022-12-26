import React from 'react';
import { Link, Text, Box, useColorModeValue } from '@chakra-ui/react'
import { Trans, t } from '@lingui/macro';
import NextLink from 'next/link';
import { useTheme } from '../lib/ThemeContext';

export default function Footer() {
  const patreon = <a href="https://www.patreon.com/arkhamcards">Patreon</a>;
  const { colors } = useTheme();
  return (
    <Box
      as="footer"
      className="site-footer"
      borderTop="1px solid"
      borderColor={colors.divider}
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