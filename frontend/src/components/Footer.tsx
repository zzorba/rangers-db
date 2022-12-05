import React from 'react';
import { Button, Text, Box } from '@chakra-ui/react'
import { t } from 'ttag';
import { useGraphql } from '../lib/GraphqlContext';

export default function Footer() {
  const { purge } = useGraphql();
  return (
    <Box
      as="footer"
      bg="gray.100"
      borderTop="1px solid"
      borderColor="gray.300"
      py="2.5rem"
      fontSize="0.875rem"
    >
      <Box
        maxW="64rem"
        marginX="auto"
        pb="2rem"
        mb="1.5rem"
        px={{ base: "1rem", lg: "0" }}
        borderBottom="1px solid"
        borderColor="gray.300"
      >
        <Text fontSize="sm" color="subtle">
          {t`The information presented on this site about Earthborne Rangers, both literal and graphical, is copyrighted by Earthborne Games. This website is not produced, endorsed, supported, or affiliated with Earthborne Games.`}
        </Text>
      </Box>
      <Button variant="ghost" onClick={purge}>Empty cache</Button>
    </Box>
  );
}