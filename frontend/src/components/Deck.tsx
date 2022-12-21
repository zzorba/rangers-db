import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  List,
  ListItem,
  SimpleGrid,
  ButtonGroup,
  Spinner,
  TextProps,
  AspectRatio,
  Link,
  Tooltip,
  useColorMode,
} from '@chakra-ui/react';
import { ArrowUpIcon, CopyIcon, DeleteIcon, EditIcon, InfoIcon } from '@chakra-ui/icons';
import Router from 'next/router';
import NextLink from 'next/link';
import { filter, map, pick, values } from 'lodash';
import { plural, t } from "@lingui/macro"

import { CardFragment, DeckFragment, DeckWithCampaignFragment, useCreateDeckMutation, useDeleteDeckMutation, useUpgradeDeckMutation } from '../generated/graphql/apollo-schema';
import { useAuth } from '../lib/AuthContext';
import AspectCounter from './AspectCounter';
import { DeckCardError, AWA, FIT, FOC, SPI } from '../types/types';
import { CardsMap } from '../lib/hooks';
import { CardRow, ShowCard, useCardModal } from './Card';
import ListHeader from './ListHeader';
import CardCount from './CardCount';
import DeckProblemComponent from './DeckProblemComponent';
import SolidButton from './SolidButton';
import { useLocale } from '../lib/TranslationProvider';
import { RoleImage } from './CardImage';
import CoreIcon from '../icons/CoreIcon';
import parseDeck, { CardItem, Item, ParsedDeck } from '../lib/parseDeck';
import useDeleteDialog from './useDeleteDialog';

interface Props {
  deck: DeckWithCampaignFragment;
}

export function DeckItemComponent({ item, showCard, lightCount }: { item: Item; showCard: ShowCard; lightCount?: boolean }) {
  const { colorMode } = useColorMode();
  switch (item.type) {
    case 'header':
      return <ListHeader key={item.title} title={item.title} problem={item.problem} />;
    case 'card':
      return <DeckCardRow key={item.card.id} lightCount={lightCount} item={item} showCard={showCard} />;
    case 'description':
      return (
        <ListItem padding={2}>
          <Flex direction="row" alignItems="center">
            <InfoIcon marginRight={2} boxSize="24px" color={`${colorMode}.lightText`} />
            <Text fontSize="md">{item.description}</Text>
          </Flex>
        </ListItem>
      );
  }
}

function DeckCardRow({ item, lightCount, showCard }: { item: CardItem; lightCount: boolean | undefined; showCard: (card: CardFragment, problem?: DeckCardError[]) => void }) {
  const onClick = useCallback(() => showCard(item.card, item.problem), [item, showCard]);
  return (
    <ListItem key={item.card.id} >
      <Flex direction="row" alignItems="center">
        <CardRow card={item.card} problem={item.problem} onClick={onClick}>
          <CardCount count={item.count} light={lightCount} marginLeft={2} />
        </CardRow>
      </Flex>
    </ListItem>
  );
}

export function DeckCountLine({ parsedDeck }: { parsedDeck: ParsedDeck }) {
  if (parsedDeck.maladyCount === 0 && parsedDeck.deckSize === 30) {
    return null;
  }
  const deckCountLine = parsedDeck.deckSize === 30 ? t`30 Cards` : t`${parsedDeck.deckSize} / 30 Cards`;
  const maladyLine = parsedDeck.maladyCount > 0 ? plural(parsedDeck.maladyCount, { one: `(${parsedDeck.maladyCount} Malady)`, other: `(${parsedDeck.maladyCount} Maladies)`}) : '';
  return (
    <Text>
      { filter([deckCountLine, maladyLine], x => !!x).join(' ') }
    </Text>
  );
}

export function MiniAspect({ value, aspect, extraSmall }: { value: number; aspect: string; extraSmall?: boolean }) {
  const { aspects } = useLocale();
  return (
    <AspectRatio width={extraSmall ? '30px' : '40px'} ratio={1}>
      <Box bg={`aspect.${aspect}`} flexDirection="column" alignItems="center" position="relative">
        <Flex direction="column" alignItems="center" justifyContent="center" position="absolute" top="0" left="0" height="100%" width="100%" >
          <AspectRatio width="90%" ratio={1}>
            <CoreIcon icon={`${aspect.toLowerCase()}_chakra`} size={50} color="#FFFFFF66" />
          </AspectRatio>
        </Flex>
        <Text color="white" textAlign="center" fontWeight={900} lineHeight={1.1}>{value}</Text>
        <Text color="white" textAlign="center" fontSize="2xs" lineHeight={1} fontWeight={200} letterSpacing={0.1}>{aspects[aspect]?.short_name}</Text>
      </Box>
    </AspectRatio>
  );
}

export function DeckDescription({ deck, roleCards, ...textProps }: {
  deck: DeckFragment;
  roleCards?: CardsMap;
} & Omit<TextProps, 'text'>) {
  const { categories } = useLocale();
  const background: string | undefined = typeof deck.meta.background === 'string' ? deck.meta.background : undefined;
  const specialty: string | undefined = typeof deck.meta.specialty === 'string' ? deck.meta.specialty : undefined;
  const role: string | undefined = typeof deck.meta.role === 'string' ? deck.meta.role : undefined;
  const description = useMemo(() => {
    return filter([
      background && categories.background?.options?.[background],
      specialty && categories.specialty?.options?.[specialty],
      roleCards && role && roleCards[role]?.name,
    ], x => !!x).join(' - ');
  }, [categories, roleCards, background, specialty, role]);
  return <Text {...textProps}>{description}</Text>
}

export function CompactDeckRow({ deck, roleCards, onClick, children, buttons, href }: Props & {
  roleCards: CardsMap;
  onClick?: (deck: DeckFragment) => void;
  children?: React.ReactNode;
  buttons?: React.ReactNode;
  href?: string;
}) {
  const role = useMemo(() => {
    return typeof deck.meta.role === 'string' && roleCards[deck.meta.role];
  }, [deck.meta, roleCards]);
  const handleClick = useCallback(() => {
    onClick?.(deck);
  }, [onClick, deck]);
  return (
    <Flex
      flex={1}
      paddingTop={2}
      paddingBottom={2}
      borderBottomColor="gray.500"
      borderBottomWidth="1px"
      onClick={onClick ? handleClick : undefined}
      cursor={onClick ? 'pointer' : undefined}
      flexDirection="column"
    >
      <Flex direction="row">
        { !!role && !!role.imagesrc && <RoleImage large name={role.name} url={role.imagesrc} /> }
        <Flex direction="column" flex={1}>
          { href ? (
            <Text fontSize={['md', 'md', 'lg']} as={NextLink} href={href}>{deck.name}</Text>
          ) : (
            <Text fontSize={['md', 'md', 'lg']}>{deck.name}</Text>
          ) }
          { children }
          <DeckDescription fontSize={['xs', 's', 'm']} deck={deck} roleCards={roleCards} />
          { !!deck.meta.problem && <DeckProblemComponent errors={deck.meta.problem} limit={1} /> }
        </Flex>
        <SimpleGrid columns={2} marginRight={1}>
          <MiniAspect aspect="AWA" value={deck.awa} />
          <MiniAspect aspect="SPI" value={deck.spi} />
          <MiniAspect aspect="FIT" value={deck.fit} />
          <MiniAspect aspect="FOC" value={deck.foc} />
        </SimpleGrid>
      </Flex>
      { buttons }
    </Flex>
  );
}
