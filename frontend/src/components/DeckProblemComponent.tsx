import React from 'react';
import { List, ListItem, Flex, Tooltip, Text, FormErrorMessage } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons'
import { map, take, drop } from 'lodash';
import { plural } from '@lingui/macro';

import { DeckCardError, DeckError } from '../types/types';
import { useLocale } from '../lib/TranslationProvider';

export default function DeckProblemComponent({ errors, card, limit, summarizeOthers }: { errors: DeckError[] | undefined; card?: boolean; limit?: number; summarizeOthers?: boolean }) {
  const { deckErrors, cardErrors } = useLocale();
  if (!errors?.length) {
    return null;
  }
  const otherErrorCount = errors.length - (limit || 0);
  return (
    <List>
      {map(limit ? take(errors, limit) : errors, error => (
        <ListItem key={error}>
          <Flex direction="row" alignItems="center">
            <WarningIcon color="red" />
            <Text marginLeft={2} color="red">{(!!card && cardErrors[error as DeckCardError]) || deckErrors[error]}</Text>
          </Flex>
          { summarizeOthers && !!limit && errors.length > limit && (
              <Flex direction="row">
                <WarningIcon color="transparent" />
                <Tooltip placement="bottom-start" bg="red" label={map(drop(errors, limit), e => deckErrors[error]).join('\n') }>
                  <Text marginLeft={2} color="red">
                    {plural(otherErrorCount, { one: `+ ${otherErrorCount} more problem`, other: `+ ${otherErrorCount} more problems` }) }
                  </Text>
                </Tooltip>
              </Flex>
          ) }
        </ListItem>
      ))}
    </List>
  );
}

export function DeckProblemFormError({ errors }: { errors: DeckError[] | undefined }) {
  const { deckErrors } = useLocale();
  if (!errors?.length) {
    return null;
  }
  return (
    <FormErrorMessage>{deckErrors[errors[0]]}</FormErrorMessage>
  );
}


export function DeckCardProblemTooltip({ errors, children }: { errors: DeckCardError[] | undefined;  children: React.ReactNode }) {
  const { cardErrors } = useLocale();
  return (
    <Tooltip bg="red.400" label={errors?.length ? cardErrors[errors[0]] : undefined} isDisabled={!errors?.length}>
      {children}
    </Tooltip>
  );
}