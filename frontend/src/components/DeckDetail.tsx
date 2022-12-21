import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  List,
  IconButton,
  Spinner,
  Link,
  Tooltip,
  SimpleGrid,
  Grid,
  GridItem,
  Stack,
  MenuButton,
  Menu,
  MenuList,
  MenuItem,
  ButtonGroup,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import Router from 'next/router';
import NextLink from 'next/link';
import { map, pick, values } from 'lodash';
import { t } from "@lingui/macro"

import { CardFragment, DeckFragment, DeckWithCampaignFragment, useCreateDeckMutation, useDeleteDeckMutation, useUpgradeDeckMutation } from '../generated/graphql/apollo-schema';
import { useAuth } from '../lib/AuthContext';
import AspectCounter from './AspectCounter';
import { AWA, FIT, FOC, SPI } from '../types/types';
import { CardsMap } from '../lib/hooks';
import { CardRow, ShowCard, useCardModal } from './Card';
import DeckProblemComponent from './DeckProblemComponent';
import { useLocale } from '../lib/TranslationProvider';
import CoreIcon from '../icons/CoreIcon';
import parseDeck from '../lib/parseDeck';
import useDeleteDialog from './useDeleteDialog';
import { DeckCountLine, DeckDescription, DeckItemComponent } from './Deck';
import DeckDescriptionView from './DeckDescriptionView';
import { FaCopy, FaEdit, FaMoon, FaTrash } from 'react-icons/fa';
import SolidButton from './SolidButton';

function deleteDeckMessage(d: DeckFragment) {
  return d.previous_deck ?
    t`Are you sure you want to delete the latest day (${d.version}) of this deck?` :
    t`Are you sure you want to delete this deck?`;
}

interface Props {
  deck: DeckWithCampaignFragment;
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
    const r = await doDelete({
      variables: {
        id: d.id,
      },
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    Router.push('/decks');
    return undefined;
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
            <ButtonGroup>
              { authUser?.uid === deck.user_id && !deck.next_deck && (
                <SolidButton
                  color="blue"
                  leftIcon={<FaEdit />}
                  as={NextLink}
                  href={`/decks/edit/${deck.id}`}
                >
                  {t`Edit`}
                </SolidButton>
              ) }
              { authUser && (
                <Menu autoSelect={false}>
                  <MenuButton as={IconButton} aria-label={t`Actions`} icon={<HamburgerIcon />} variant="outline" />
                  <MenuList>

                    { authUser.uid === deck.user_id && !deck.next_deck && (
                      <Tooltip
                        placement="left"
                        label={!!deck.meta.problem ? t`You must correct deck errors before upgrading.` : t`Choosing to camp will make a copy of your deck to let you track deck changes as you play through a campaign.`}
                      >
                        <MenuItem
                          icon={upgrading ? <Spinner size="sm" /> : <FaMoon />}
                          onClick={onUpgradeDeck}
                          disabled={!!deck.meta.problem}
                        >{t`Camp`}</MenuItem>
                      </Tooltip>
                    ) }
                    { !deck.previous_deck && (
                      <Tooltip
                        placement="left"
                        label={authUser.uid === deck.user_id ?
                          t`Duplicate this deck while preserving the original.` :
                          t`Copy this deck to make your own changes.`}
                      >
                        <MenuItem
                          icon={copying ? <Spinner size="sm" /> : <FaCopy />}
                          onClick={onCopyDeck}
                        >
                          {t`Copy`}
                        </MenuItem>
                      </Tooltip>
                    ) }
                    { authUser.uid === deck.user_id && !deck.next_deck && (
                      <MenuItem
                        color="red"
                        icon={<FaTrash />}
                        onClick={onDeleteClick}
                      >
                        {t`Delete`}
                      </MenuItem>
                    ) }
                  </MenuList>
                </Menu>
              ) }
            </ButtonGroup>
          </Flex>
        </Box>
        <Grid templateColumns="repeat(6, 1fr)" gap={6}>
          <GridItem colSpan={deck.description ? [6, 6, 4] : 6}>
            <Box
              borderRightWidth={deck.description ? [0, 0, '1px'] : undefined}
              paddingRight={deck.description ? [0, 0, 6] : undefined}
            >
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
            </Box>
          </GridItem>
          { !!deck.description && (
            <GridItem colSpan={[6, 6, 2]}>
              <Stack>
                <Text fontSize="2xl" fontWeight="600">
                  {t`Description`}
                </Text>
                <DeckDescriptionView description={deck.description} />
              </Stack>
            </GridItem>
          ) }
        </Grid>
        { (!!deck.previous_deck || !!deck.next_deck) && (
          <Flex direction="column" marginTop={8}>
            <Text borderBottomWidth={1} borderColor="gray.500" marginBottom={2} paddingBottom={1} fontWeight="600">{t`Campaign progress`}</Text>
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