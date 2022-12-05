import React from 'react';
import { List, ListItem, Flex, Tooltip, Text, FormErrorMessage } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons'
import { map, take } from 'lodash';

import { DeckCardError, DeckError } from '../types/types';
import { useTranslations } from '../lib/TranslationProvider';

export default function DeckProblemComponent({ errors, card, limit }: { errors: DeckError[] | undefined; card?: boolean; limit?: number }) {
  const { deckErrors, cardErrors } = useTranslations();
  if (!errors?.length) {
    return null;
  }
  return (
    <List>
      {map(limit ? take(errors, limit) : errors, error => (
        <ListItem key={error}>
          <Flex direction="row" alignItems="center">
            <WarningIcon color="red" />
            <Text marginLeft={2} color="red">{(!!card && cardErrors[error as DeckCardError]) || deckErrors[error]}</Text>
          </Flex>
        </ListItem>
      ))}
    </List>
  );
}

export function DeckProblemFormError({ errors }: { errors: DeckError[] | undefined }) {
  const { deckErrors } = useTranslations();
  if (!errors?.length) {
    return null;
  }
  return (
    <FormErrorMessage>{deckErrors[errors[0]]}</FormErrorMessage>
  );
}


export function DeckCardProblemTooltip({ errors, children }: { errors: DeckCardError[] | undefined;  children: React.ReactNode }) {
  const { cardErrors } = useTranslations();
  return (
    <Tooltip bg="red.400" label={errors?.length ? cardErrors[errors[0]] : undefined} isDisabled={!errors?.length}>
      {children}
    </Tooltip>
  );
}