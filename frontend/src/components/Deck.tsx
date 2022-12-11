import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  List,
  ListItem,
  IconButton,
  SimpleGrid,
  ButtonGroup,
  Spinner,
  TextProps,
  AspectRatio,
  useBreakpointValue,
  Link,
} from '@chakra-ui/react';
import { ArrowUpIcon, CopyIcon, DeleteIcon, EditIcon, InfoIcon, PlusSquareIcon } from '@chakra-ui/icons';
import Router from 'next/router';
import NextLink from 'next/link';
import { filter, forEach, map, flatMap, uniq, pick, values } from 'lodash';
import { t } from "@lingui/macro"

import { CardFragment, DeckFragment, useCreateDeckMutation, useUpgradeDeckMutation } from '../generated/graphql/apollo-schema';
import { useAuth } from '../lib/AuthContext';
import AspectCounter from './AspectCounter';
import { AspectStats, AWA, DeckCardError, DeckError, DeckMeta, FIT, FOC, Slots, SPI } from '../types/types';
import { CardsMap, CategoryTranslations } from '../lib/hooks';
import { CardRow, ShowCard, useCardModal } from './Card';
import ListHeader from './ListHeader';
import CardCount from './CardCount';
import DeckProblemComponent from './DeckProblemComponent';
import SolidButton from './SolidButton';
import { useLocale } from '../lib/TranslationProvider';
import { RoleImage } from './CardImage';
import CoreIcon from '../icons/CoreIcon';

interface Props {
  deck: DeckFragment;
}

interface HeaderItem {
  type: 'header';
  id: string;
  title: string;
  problem: DeckError[] | undefined;
}
interface CardItem {
  type: 'card';
  id: string;
  card: CardFragment;
  count: number;
  problem: DeckCardError[] | undefined;
}
interface DescriptionItem {
  type: 'description';
  id: string;
  description: string;
  problem?: undefined;
}
type Item = HeaderItem | CardItem | DescriptionItem;

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

interface ParsedDeck {
  stats: AspectStats;
  background: string | undefined;
  specialty: string | undefined;
  role: CardFragment | undefined;

  problem: DeckError[] | undefined;
  roleProblems: DeckError[] | undefined;
  cards: Item[];
  loading: boolean;
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

export function parseDeck(
  aspects: AspectStats,
  meta: DeckMeta,
  slots: Slots,
  cards: CardsMap,
  categoryTranslations: CategoryTranslations,
  previousDeck: { meta?: DeckMeta; slots?: Slots } | undefined
): ParsedDeck {
  const missingCards: string[] = [];
  const stats: { [key: string]: number } = {
    [AWA]: aspects.awa,
    [FIT]: aspects.fit,
    [FOC]: aspects.foc,
    [SPI]: aspects.spi,
  };
  const role = typeof meta.role === 'string' ? meta.role : '';
  const roleCard = role ? cards[role] : undefined;
  const background = typeof meta.background === 'string' ? meta.background : undefined;
  const specialty = typeof meta.specialty === 'string' ? meta.specialty : undefined;
  let items: CardItem[] = flatMap(slots, (count, code) => {
    if (typeof count !== 'number' || count === 0) {
      return [];
    }
    const card = cards[code];
    if (!card) {
      missingCards.push(code);
      return [];
    }
    const problems: DeckCardError[] = [];
    if (count > 2) {
      problems.push('too_many_duplicates');
    } else if (!previousDeck && count !== 2) {
      problems.push('need_two_cards');
    }
    if (card.aspect_id && card.level !== null && card.level !== undefined) {
      if (stats[card.aspect_id] < card.level) {
        problems.push('invalid_aspect_levels');
      }
    }
    return {
      type: 'card',
      id: code,
      card,
      count,
      problem: problems.length ? problems : undefined,
    };
  });
  const globalProblems: DeckError[] = [];
  const roleProblems: DeckError[] = [];

  if (!roleCard) {
    roleProblems.push('role');
  } else if (roleCard.set_type_id !== 'specialty' || roleCard.type_id !== 'role' || roleCard.set_id !== specialty) {
    roleProblems.push('invalid_role');
  }
  const backgroundErrors: DeckError[] = [];
  const specialtyErrors: DeckError[] = [];
  const outsideInterestErrors: DeckError[] = [];
  const personalityErrors: DeckError[] = [];
  let splashFaction: 'background' | 'specialty' | undefined = undefined;
  if (!previousDeck) {
    // Starting decks have more rules.
    let backgroundNonExpert = 0;
    let backgroundCount = 0;
    let specialtyNonExpert = 0;
    let specialtyCount = 0;
    let splashCount = 0;
    let personalityCount: {
      [aspect: string]: number;
    } = { [AWA]: 0, [FIT]: 0, [FOC]: 0, [SPI]: 0 };
    items = map(items, i => {
      if (i.type !== 'card') {
        return i;
      }
      const problems = i.problem || [];
      if (i.card.set_id === 'personality') {
        if (i.card.aspect_id) {
          switch (i.card.aspect_id) {
            case AWA: {
              personalityCount.AWA += 2;
              if (personalityCount.AWA > 2) {
                personalityErrors.push('too_many_awa_personality');
              }
              break;
            }
            case FOC: {
              personalityCount.FOC += 2;
              if (personalityCount.FOC > 2) {
                personalityErrors.push('too_many_foc_personality');
              }
              break;
            }
            case FIT: {
              personalityCount.FIT += 2;
              if (personalityCount.FIT > 2) {
                personalityErrors.push('too_many_fit_personality');
              }
              break;
            }
            case SPI: {
              personalityCount.SPI += 2;
              if (personalityCount.SPI > 2) {
                personalityErrors.push('too_many_spi_personality');
              }
              break;
            }
          }
        }
      } else {
        switch (i.card.set_type_id) {
          case 'background':
            if (i.card.set_id === background) {
              backgroundCount += i.count;
              if (!i.card.real_traits || i.card.real_traits.indexOf('Expert') === -1) {
                backgroundNonExpert += i.count;
              }
              if (backgroundCount > 10) {
                if (backgroundCount > 12 || splashCount >= 2) {
                  backgroundErrors.push('too_many_background')
                } else if (backgroundNonExpert < 2) {
                  backgroundErrors.push('invalid_outside_interest');
                } else {
                  splashFaction = 'background';
                  splashCount += i.count;
                }
              }
            } else {
              if (i.card.real_traits && i.card.real_traits.indexOf('Expert') !== -1) {
                problems.push('invalid_outside_interest');
              } else {
                splashCount += i.count;
                if (splashCount > 2){
                  outsideInterestErrors.push('too_many_outside_interest');
                }
              }
            }
            break;
          case 'specialty':
            if (i.card.set_id === specialty) {
              specialtyCount += i.count;
              if (!i.card.real_traits || i.card.real_traits.indexOf('Expert') === -1) {
                specialtyNonExpert += i.count;
              }
              if (specialtyCount > 10) {
                if (specialtyCount > 12 || splashCount >= 2) {
                  specialtyErrors.push('too_many_specialty')
                } else if (specialtyNonExpert < 2) {
                  specialtyErrors.push('invalid_outside_interest');
                } else {
                  splashFaction = 'specialty';
                  splashCount += i.count;
                }
              }
            } else {
              if (i.card.real_traits && i.card.real_traits.indexOf('Expert') !== -1) {
                problems.push('invalid_outside_interest');
              } else {
                splashCount += i.count;
                if (splashCount > 2){
                  outsideInterestErrors.push('too_many_outside_interest');
                }
              }
            }
            break;
        }
      }
      return {
        ...i,
        problem: problems.length ? problems : undefined,
      };
    });
    if (
      personalityCount.AWA !== 2 ||
      personalityCount.FIT !== 2 ||
      personalityCount.FOC !== 2 ||
      personalityCount.SPI !== 2
    ) {
      personalityErrors.push('personality')
    }
    if (specialtyCount < 10) {
      specialtyErrors.push('specialty');
    }
    if (backgroundCount < 10) {
      backgroundErrors.push('background');
    }
    if (splashCount < 2) {
      outsideInterestErrors.push('outside_interest');
    }
  }
  const backgroundName = background && categoryTranslations.background?.options[background];
  const specialtyName = specialty && categoryTranslations.specialty?.options[specialty];
  const personalityCards: Item[] = [
    {
      type: 'header',
      id: 'personality',
      title: t`Personality`,
      problem: personalityErrors.length ? uniq(personalityErrors) : undefined,
    },
  ];
  const backgroundCards: Item[] = [
    {
      type: 'header',
      id: 'background',
      title: backgroundName ? t`Background: ${backgroundName}` : t`Background`,
      problem: backgroundErrors.length ? uniq(backgroundErrors) : undefined,
    },
  ];
  const specialtyCards: Item[] = [
    {
      type: 'header',
      id: 'specialty',
      title: specialtyName ? t`Specialty: ${specialtyName}` : t`Specialty`,
      problem: specialtyErrors.length ? uniq(specialtyErrors) : undefined,
    },
  ];
  const outsideInterestCards: Item[] = [
    {
      type: 'header',
      title: t`Outside Interest`,
      id: 'outside_interest',
      problem: outsideInterestErrors.length ? uniq(outsideInterestErrors) : undefined,
    },
  ];
  const otherCards: Item[] = [
    {
      type: 'header',
      id: 'other',
      title: t`Other`,
      problem: undefined,
    },
  ];
  forEach(items, i => {
    if (i.type === 'card') {
      if (i.card.set_id === 'personality') {
        personalityCards.push(i);
        return;
      }
      if (i.card.set_type_id === 'background') {
        if (i.card.set_id === background) {
          backgroundCards.push(i);
        } else {
          outsideInterestCards.push(i);
        }
        return;
      }
      if (i.card.set_type_id === 'specialty') {
        if (i.card.set_id === specialty) {
          specialtyCards.push(i);
        } else {
          outsideInterestCards.push(i);
        }
        return;
      }
      otherCards.push(i);
    }
  });
  if (splashFaction) {
    switch (splashFaction) {
      case 'background':
        outsideInterestCards.push({
          type: 'description',
          id: 'splash',
          description: t`One of the chosen background cards is counting towards outside interest.`,
        });
        break;
      case 'specialty':
        outsideInterestCards.push({
          type: 'description',
          id: 'splash',
          description: t`One of the chosen specialty cards is counting towards outside interest.`,
        });
        break;
    }
  }

  const result = [
    ...personalityCards,
    ...backgroundCards,
    ...specialtyCards,
    ...outsideInterestCards,
    ...(otherCards.length > 1 || otherCards[0].problem?.length ? otherCards : []),
  ];
  return {
    stats: aspects,
    background,
    specialty,
    role: roleCard,
    problem: uniq([
      ...globalProblems,
      ...flatMap(result, i => i.problem || []),
    ]),
    roleProblems,
    cards: result,
    loading: missingCards.length > 0,
  };
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

const SHOW_UPGRADE = false;
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
  }, [upgradeDeck, setUpgrading]);

  const [createDeck] = useCreateDeckMutation();
  const [copying, setCopying] = useState(false);
  const onCopyDeck = useCallback(async() => {
    if (authUser) {
      setCopying(true);
      const result = await createDeck({
        variables: {
          userId: authUser?.uid,
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
              { (!!deck.previous_deck || !!deck.next_deck) && (
                <Flex direction="column">
                  <Text textDecorationLine="underline">{t`Progress`}</Text>
                  <Text>{`Current: Day ${deck.version}`}</Text>
                  { !!deck.previous_deck && (
                    <Link as={NextLink} href={`/decks/view/${deck.previous_deck.id}`}>{t`Previous day (${deck.previous_deck.version})`}</Link>
                  )}
                  { !!deck.next_deck && (
                    <Link as={NextLink} href={`/decks/view/${deck.next_deck.id}`}>{t`Next day (${deck.next_deck.version})`}</Link>
                  )}
                </Flex>
              )}
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
                  <SolidButton
                    color="yellow"
                    leftIcon={<ArrowUpIcon />}
                    onClick={onUpgradeDeck}
                    isLoading={upgrading}
                  >
                    {t`Camp`}
                  </SolidButton>
                ) }
                { !deck.previous_deck && (
                  <SolidButton
                    color="orange"
                    leftIcon={<CopyIcon />}
                    onClick={onCopyDeck}
                    isLoading={copying}
                  >
                    {t`Copy`}
                  </SolidButton>
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
            <DeckProblemComponent limit={1} summarizeOthers errors={parsedDeck.problem} />
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
      {cardModal}
    </>
  );
}

function MiniAspect({ value, aspect }: { value: number; aspect: string }) {
  const { aspects } = useLocale();
  return (
    <AspectRatio width={['30px', '44px', '50px']} ratio={1}>
      <Box bg={`aspect.${aspect}`} flexDirection="column" alignItems="center" position="relative">
        <Flex direction="column" alignItems="center" justifyContent="center" position="absolute" top="0" left="0" height="100%" width="100%" >
          <AspectRatio width="90%" ratio={1}>
            <CoreIcon icon={`${aspect.toLowerCase()}_chakra`} size={50} color="#FFFFFF66" />
          </AspectRatio>
        </Flex>

        <Text color="white" textAlign="center" fontWeight={900} lineHeight={1.1}>{value}</Text>
        <Text color="white" textAlign="center" fontSize={['3xs', '2xs', 'xs']} lineHeight={1} fontWeight={200} letterSpacing={0.1}>{aspects[aspect]?.short_name}</Text>
      </Box>
    </AspectRatio>
  );
}

function DeckDescription({ deck, roleCards, ...textProps }: {
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

export function DeckRow({ deck, roleCards, onDelete }: Props & {
  roleCards: CardsMap;
  onDelete: (deck: DeckFragment) => void;
}) {
  const { authUser } = useAuth();
  const doDelete = useCallback(() => {
    onDelete(deck);
  }, [onDelete, deck]);
  const buttonOrientation = useBreakpointValue<'vertical' | 'horizontal'>(['vertical', 'vertical', 'horizontal']);
  const problem = !!deck.meta.problem && Array.isArray(deck.meta.problem) ? (deck.meta.problem as DeckError[])  : undefined;
  const role = useMemo(() => {
    return typeof deck.meta.role === 'string' && roleCards[deck.meta.role];
  }, [deck.meta, roleCards]);
  return (
    <ListItem paddingTop={3} paddingBottom={3} borderBottomColor="gray.100" borderBottomWidth="1px">
      <Flex direction="row">
        <Flex flex={[1.2, 1.25, 1.5, 2]} direction="row" alignItems="flex-start" as={NextLink} href={`/decks/view/${deck.id}`}>
          { !!role && !!role.imagesrc && <RoleImage name={role.name} url={role.imagesrc} /> }
          <Flex direction="column">
            <Text fontSize={['m', 'l', 'xl']}>{deck.name}</Text>
            <DeckDescription fontSize={['xs', 's', 'm']}deck={deck} roleCards={roleCards} />
          </Flex>
        </Flex>
        <Flex marginLeft={[1, 1, 2]} direction="row" alignItems="flex-start" justifyContent="space-between">
          <SimpleGrid columns={[2, 2, 4]} marginRight={1}>
            <MiniAspect aspect="AWA" value={deck.awa} />
            <MiniAspect aspect="SPI" value={deck.spi} />
            <MiniAspect aspect="FIT" value={deck.fit} />
            <MiniAspect aspect="FOC" value={deck.foc} />
          </SimpleGrid>
          { authUser?.uid === deck.user_id && (
            <ButtonGroup marginLeft={[1, 2, "2em"]} orientation={buttonOrientation || 'horizontal'}>
              <IconButton aria-label={t`Edit`} color="gray.600" icon={<EditIcon />} as={NextLink} href={`/decks/edit/${deck.id}`} />
              <IconButton aria-label={t`Delete`} color="red.400" icon={<DeleteIcon />} onClick={doDelete} />
            </ButtonGroup>
          )}
        </Flex>
      </Flex>
      { !!problem && <DeckProblemComponent errors={problem} limit={1} />}
    </ListItem>
  );
}