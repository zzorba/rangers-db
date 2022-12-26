import React from 'react';
import { Flex, ListItem, SimpleGrid, Text } from '@chakra-ui/react';

import { DeckError } from '../types/types';
import DeckProblemComponent from './DeckProblemComponent';

export default function ListHeader({ title, problem }: { title: string; problem?: DeckError[] }) {
  return (
    <ListItem padding={2} paddingTop={4} paddingBottom={0} borderBottomWidth={0.5} borderColor="#888888">
      <SimpleGrid columns={2} minChildWidth="200px" spacingX={4} spacingY={2}>
        <Text fontStyle="italic" fontSize="m">{title}</Text>
        <Flex direction="row" justifyContent="flex-end">
          <DeckProblemComponent limit={1} errors={problem} />
        </Flex>
      </SimpleGrid>
    </ListItem>
  );
}