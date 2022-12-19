import React from 'react';
import { Text, Box, useColorModeValue } from '@chakra-ui/react'
import { t } from '@lingui/macro';

export default function Footer() {
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
      </Box>
    </Box>
  );
}