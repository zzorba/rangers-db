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
  switch (item.type) {
    case 'header':
      return <ListHeader key={item.title} title={item.title} problem={item.problem} />;
    case 'card':
      return <DeckCardRow key={item.card.id} lightCount={lightCount} item={item} showCard={showCard} />;
    case 'description':
      return (
        <ListItem padding={2}>
          <Flex direction="row" alignItems="center">
            <InfoIcon marginRight={2} boxSize="24px" color="gray.500" />
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


function ChosenRole({ role, showCard }: { role: CardFragment; showCard: ShowCard }) {
  const onClick = useCallback(() => showCard(role), [role, showCard]);
  return (
    <CardRow
      onClick={onClick}
      card={role}
      includeSet
    />
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
const SHOW_UPGRADE = true;

function deleteDeckMessage(d: DeckFragment) {
  return d.previous_deck ?
    t`Are you sure you want to delete the latest day (${d.version}) of this deck?` :
    t`Are you sure you want to delete this deck?`;
}

export default function Deck({ deck, cards }: Props & { cards: CardsMap }) {
  const { authUser } = useAuth();
  const { categories } = useLocale();
  const [showCard, cardModal] = useCardModal(deck.slots);
  const specialty: string | undefined = typeof deck.meta.specialty === 'string' ? deck.meta.specialty : undefined;
  const hasCards = useMemo(() => values(cards).length > 0, [cards]);
  const parsedDeck = useMemo(() => parseDeck(deck, deck.meta, deck.slots, cards, categories, deck.previous_deck ? pick(deck.previous_deck, ['meta', 'slots']) : undefined), [deck, cards, categories]);
  const [upgradeDeck] = useUpgradeDeckMutation();
  const [upgrading, setUpgrading] = useState(false);
  const onUpgradeDeck = useCallback(async() => {
    if (authUser) {
      setUpgrading(true);
      const result = await upgradeDeck({
        variables: {
          deckId: deck.id,
        },
      });
      setUpgrading(false);
      if (result.errors?.length) {
        // TODO: handle error
      } else {
        if (result.data?.deck?.next_deck_id) {
          Router.push(`/decks/edit/${result.data.deck.next_deck_id}`);
        }
      }
    }
  }, [authUser, deck.id, upgradeDeck, setUpgrading]);

  const [createDeck] = useCreateDeckMutation();
  const [copying, setCopying] = useState(false);
  const onCopyDeck = useCallback(async() => {
    if (authUser) {
      setCopying(true);
      const result = await createDeck({
        variables: {
          name: `${deck.name} (Copy)`,
          foc: deck.foc,
          fit: deck.fit,
          awa: deck.awa,
          spi: deck.spi,
          meta: deck.meta,
          slots: deck.slots,
        },
      });
      setCopying(false);
      if (result.errors?.length) {
        // TODO: handle error
      } else {
        if (result.data?.deck?.id) {
          Router.push(`/decks/view/${result.data.deck.id}`);
        }
      }
    }
  }, [createDeck, authUser, deck]);

  const [doDelete] = useDeleteDeckMutation();
  const deleteDeck = useCallback(async(d: DeckFragment) => {
    await doDelete({
      variables: {
        id: d.id,
      },
    });
    Router.push('/decks');
  }, [doDelete]);
  const [onDelete, deleteDialog] = useDeleteDialog(
    t`Delete deck?`,
    deleteDeckMessage,
    deleteDeck
  );
  const onDeleteClick = useCallback(() => onDelete(deck), [onDelete, deck]);

  return (
    <>
      <Box>
        <Box paddingTop="2rem" paddingBottom="2em">
          <Flex direction="row" justifyContent="space-between">
            <Flex direction="column">
              <Heading>{deck?.name || 'Deck'}</Heading>
              { authUser?.uid !== deck.user_id && deck.user.handle && (
                <Text fontSize="lg">
                  <CoreIcon icon="ranger" size={18}/>&nbsp;{deck.user.handle}
                </Text>
              ) }
              { !!deck.campaign && <Flex direction="row" alignItems="center"><CoreIcon icon="guide" size={18} /><Link marginLeft={1} as={NextLink} href={`/campaigns/${deck.campaign.id}`}>{deck.campaign.name}</Link></Flex>}
              <DeckCountLine parsedDeck={parsedDeck} />
            </Flex>
            { authUser && (
              <ButtonGroup paddingTop={2} paddingBottom={4}>
                { authUser.uid === deck.user_id && !deck.next_deck && (
                  <SolidButton
                    color="blue"
                    leftIcon={<EditIcon />}
                    as={NextLink}
                    href={`/decks/edit/${deck.id}`}
                  >
                    {t`Edit`}
                  </SolidButton>
                ) }
                { authUser.uid === deck.user_id && !deck.next_deck && SHOW_UPGRADE && (
                  <Tooltip label={!!deck.meta.problem ? t`You must correct deck errors before upgrading.` : t`Choosing to camp will make a copy of your deck to let you track deck changes as you play through a campaign.`}>
                    <SolidButton
                      color="green"
                      leftIcon={<ArrowUpIcon />}
                      onClick={onUpgradeDeck}
                      isLoading={upgrading}
                      disabled={!!deck.meta.problem}
                    >
                      {t`Camp`}
                    </SolidButton>
                  </Tooltip>
                ) }
                { authUser.uid === deck.user_id && !deck.next_deck && (
                  <SolidButton
                    color="red"
                    leftIcon={<DeleteIcon />}
                    onClick={onDeleteClick}
                    isLoading={copying}
                  >
                    {t`Delete`}
                  </SolidButton>
                ) }
                { !deck.previous_deck && (
                  <Tooltip label={authUser.uid === deck.user_id ?
                      t`Duplicate this deck while preserving the original.` :
                      t`Copy this deck to make your own changes.`}>
                    <SolidButton
                      color="orange"
                      leftIcon={<CopyIcon />}
                      onClick={onCopyDeck}
                      isLoading={copying}
                    >
                      {t`Copy`}
                    </SolidButton>
                  </Tooltip>
                ) }
              </ButtonGroup>
            ) }
          </Flex>
        </Box>
        <DeckDescription deck={deck} />
        { !!parsedDeck.role ? (
          <ChosenRole role={parsedDeck.role} showCard={showCard} />
        ) : (
          <Text>
            <i>{categories.specialty?.name}:&nbsp;</i>
            {
              specialty && categories.specialty ?
              categories.specialty.options[specialty] :
              t`Not set`
            }
          </Text>
        ) }
        { !!parsedDeck.problem?.length && hasCards && (
          <Box marginTop={2} marginBottom={2}>
            <DeckProblemComponent
              limit={1}
              summarizeOthers
              errors={parsedDeck.problem}
            />
          </Box>
        ) }
        <Flex direction="row" maxW="24rem" marginTop={2}>
          <AspectCounter aspect={AWA} count={deck.awa} />
          <AspectCounter aspect={SPI} count={deck.spi} />
          <AspectCounter aspect={FIT} count={deck.fit} />
          <AspectCounter aspect={FOC} count={deck.foc} />
        </Flex>
        { hasCards ? (
          <List>
            {map(parsedDeck.cards, item => <DeckItemComponent lightCount key={item.id} item={item} showCard={showCard} />)}
          </List>
        ) : <Spinner size="md" /> }
        { (!!deck.previous_deck || !!deck.next_deck) && (
          <Flex direction="column" marginTop={8}>
            <Text borderBottomWidth={1} borderColor="gray.100" marginBottom={2} paddingBottom={1} fontWeight="600">{t`Campaign progress`}</Text>
            { !!deck.previous_deck && (
              <Link as={NextLink} href={`/decks/view/${deck.previous_deck.id}`}>{t`Previous deck (${deck.previous_deck.version})`}</Link>
            )}
            { !!deck.next_deck && (
              <Link as={NextLink} href={`/decks/view/${deck.next_deck.id}`}>{t`Next deck (${deck.next_deck.version})`}</Link>
            )}
          </Flex>
        )}
      </Box>
      {cardModal}
      {deleteDialog}
    </>
  );
}

export function MiniAspect({ value, aspect }: { value: number; aspect: string }) {
  const { aspects } = useLocale();
  return (
    <AspectRatio width="40px" ratio={1}>
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

export function CompactDeckRow({ deck, roleCards, onClick, children, buttons }: Props & { roleCards: CardsMap; onClick?: (deck: DeckFragment) => void; children?: React.ReactNode; buttons?: React.ReactNode }) {
  const role = useMemo(() => {
    return typeof deck.meta.role === 'string' && roleCards[deck.meta.role];
  }, [deck.meta, roleCards]);
  const handleClick = useCallback(() => {
    onClick?.(deck);
  }, [onClick, deck]);
  return (
    <ListItem
      paddingTop={2}
      paddingBottom={2}
      borderBottomColor="gray.100"
      borderBottomWidth="1px"
      onClick={onClick ? handleClick : undefined}
      cursor={onClick ? 'pointer' : undefined}
    >
      <Flex direction="row">
        <Flex flex={[1.2, 1.25, 1.5, 2]} direction="row" alignItems="flex-start">
          { !!role && !!role.imagesrc && <RoleImage large name={role.name} url={role.imagesrc} /> }
          <Flex direction="column">
            <Text fontSize={['md', 'md', 'lg']}>{deck.name}</Text>
            { children }
            <DeckDescription fontSize={['xs', 's', 'm']}deck={deck} roleCards={roleCards} />
          </Flex>
        </Flex>
        <Flex marginLeft={2} direction="row" alignItems="flex-start" justifyContent="space-between">
          <SimpleGrid columns={2} marginRight={1}>
            <MiniAspect aspect="AWA" value={deck.awa} />
            <MiniAspect aspect="SPI" value={deck.spi} />
            <MiniAspect aspect="FIT" value={deck.fit} />
            <MiniAspect aspect="FOC" value={deck.foc} />
          </SimpleGrid>
        </Flex>
        { buttons }
      </Flex>
    </ListItem>
  );
}
