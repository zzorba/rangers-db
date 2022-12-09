import { Box, Text } from '@chakra-ui/react';
import React from 'react';
import PageHeading from '../../components/PageHeading';

export default function Search() {
  return (
    <Box
      maxW="64rem"
      marginX="auto"
      py={{ base: "3rem", lg: "4rem" }}
      px={{ base: "1rem", lg: "0" }}
    >
      <PageHeading title="Decks" />
      <Text>
        Searching decks that have been shared with the community is still under construction.
      </Text>
      <Text>
        However, you can share links to your individual decks to inspire others.
      </Text>
    </Box>
  );
}

