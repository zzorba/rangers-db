import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  List,
  ListItem,
  FormControl,
  FormLabel,
  Stack,
  Radio,
  Select,
  Input,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  IconButton,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  SimpleGrid,
  ButtonGroup,
  CardBody,
  RadioGroup,
  FormErrorMessage,
  Spinner,
  Tr,
  Td,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { t } from 'ttag';
import { CardFragment, DeckFragment, useCreateDeckMutation, useGetRoleCardsLazyQuery, useGetRoleCardsQuery, useSaveDeckMutation } from '../generated/graphql/apollo-schema';
import { useAuth } from '../lib/AuthContext';
import AspectCounter from './AspectCounter';
import { AspectMap, AspectStats, AWA, DeckCardError, DeckError, DeckMeta, FIT, FOC, Slots, SPI } from '../types/types';
import { sumBy, filter, find, keys, union, omit, forEach, map, flatMap, uniq, pick, values, sortBy } from 'lodash';
import { CardsMap, CategoryTranslations, useCardsMap } from '../lib/hooks';
import Card, { CardRow, ShowCard, useCardModal } from './Card';
import ListHeader from './ListHeader';
import { CopyIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { SimpleCardList } from './CardList';
import Router from 'next/router';
import CardCount, { CountControls, CountToggle } from './CardCount';
import DeckProblemComponent, { DeckProblemFormError } from './DeckProblemComponent';
import EditableTextInput from './EditableTextInput';
import LoadingPage from './LoadingPage';
import PageHeading from './PageHeading';
import SolidButton from './SolidButton';
import { useTranslations } from '../lib/TranslationProvider';

interface Props {
  deck: DeckFragment;
  categoryTranslations: CategoryTranslations;
}

interface HeaderItem {
  type: 'header';
  title: string;
  problem: DeckError[] | undefined;
}
interface CardItem {
  type: 'card',
  card: CardFragment;
  count: number;
  problem: DeckCardError[] | undefined;
}
type Item = HeaderItem | CardItem;

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

function DeckCardRow({ item, showCard }: { item: CardItem; showCard: (card: CardFragment, problem?: DeckCardError[]) => void }) {
  const onClick = useCallback(() => showCard(item.card, item.problem), [item, showCard]);
  return (
    <ListItem key={item.card.id} >
      <Flex direction="row" alignItems="center">
        <CardRow card={item.card} problem={item.problem} onClick={onClick}>
          <CardCount count={item.count} marginLeft={2} />
        </CardRow>
      </Flex>
    </ListItem>
  );
}


function parseDeck(
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
                if (backgroundCount > 12) {
                  backgroundErrors.push('too_many_background')
                } else if (backgroundNonExpert < 2) {
                  backgroundErrors.push('invalid_outside_interest');
                } else {
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
                if (specialtyCount > 12) {
                  specialtyErrors.push('too_many_specialty')
                } else if (specialtyNonExpert < 2) {
                  specialtyErrors.push('invalid_outside_interest');
                } else {
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
      title: t`Personality`,
      problem: personalityErrors.length ? uniq(personalityErrors) : undefined,
    },
  ];
  const backgroundCards: Item[] = [
    {
      type: 'header',
      title: backgroundName ? t`Background: ${backgroundName}` : t`Background`,
      problem: backgroundErrors.length ? uniq(backgroundErrors) : undefined,
    },
  ];
  const specialtyCards: Item[] = [
    {
      type: 'header',
      title: specialtyName ? t`Specialty: ${specialtyName}` : t`Specialty`,
      problem: specialtyErrors.length ? uniq(specialtyErrors) : undefined,
    },
  ];
  const outsideInterestCards: Item[] = [
    {
      type: 'header',
      title: t`Outside Interest`,
      problem: outsideInterestErrors.length ? uniq(outsideInterestErrors) : undefined,
    },
  ];
  const otherCards: Item[] = [
    { type: 'header', title: t`Other`, problem: undefined },
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
export default function Deck({ deck, categoryTranslations, cards }: Props & { cards: CardsMap }) {
  const { authUser } = useAuth();
  const [showCard, cardModal] = useCardModal(deck.slots);
  const specialty: string | undefined = typeof deck.meta.specialty === 'string' ? deck.meta.specialty : undefined;
  const hasCards = useMemo(() => values(cards).length > 0, [cards]);
  const parsedDeck = useMemo(() => parseDeck(deck, deck.meta, deck.slots, cards, categoryTranslations, deck.previous_deck ? pick(deck.previous_deck, ['meta', 'slots']) : undefined), [deck, cards, categoryTranslations]);
  const [createDeck] = useCreateDeckMutation();
  const [copying, setCopying] = useState(false);
  const onCopyDeck = useCallback(async() => {
    if (authUser) {
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
        <PageHeading title={deck?.name || 'Deck'}>
          { authUser && (
            <Flex direction="row" paddingTop={2} paddingBottom={4}>
              { authUser.uid === deck.user_id ? (
                <SolidButton
                  color="blue"
                  leftIcon={<EditIcon />}
                  as={NextLink}
                  href={`/decks/edit/${deck.id}`}
                >
                  Edit
                </SolidButton>
              ) : (
                !deck.previous_deck && (
                  <SolidButton
                    color="orange"
                    leftIcon={<CopyIcon />}
                    onClick={onCopyDeck}
                    isLoading={copying}
                  >
                    Copy
                  </SolidButton>
                )
              ) }
            </Flex>
          ) }
        </PageHeading>
        <DeckDescription deck={deck} categoryTranslations={categoryTranslations} />
        { !!parsedDeck.role ? (
          <ChosenRole role={parsedDeck.role} showCard={showCard} />
        ) : (
          <Text>
            <i>{categoryTranslations.specialty?.name}:&nbsp;</i>
            {
              specialty && categoryTranslations.specialty ?
              categoryTranslations.specialty.options[specialty] :
              'Not set'
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
            {map(parsedDeck.cards, item => (
              item.type === 'header' ? (
                <ListHeader key={item.title} title={item.title} problem={item.problem} />
              ) : (
                <DeckCardRow key={item.card.id} item={item} showCard={showCard} />
              )))}
          </List>
        ) : <Spinner size="md" /> }
      </Box>
      {cardModal}
    </>
  );
}

function RoleRadioChooser({ specialty, cards, role, onChange }: { specialty: string | undefined; cards: CardsMap; role: string | undefined; onChange: (role: string) => void }) {
  const possibleRoles = useMemo(() => {
    return flatMap(values(cards), c => !!c && c.type_id === 'role' && c.set_type_id === 'specialty' && c.set_id === specialty ? c : [])
  }, [cards, specialty])

  return (
    <RadioGroup defaultValue={role} onChange={onChange}>
      <Stack>
        { map(possibleRoles, (roleCard, idx) => (
          <Radio key={roleCard.id} value={roleCard.id || ''}>
            <CardRow card={roleCard} includeText last={idx === possibleRoles.length - 1} />
          </Radio>
        )) }
      </Stack>
    </RadioGroup>
  );
}

function useChooseRoleModal(
  specialty: string | undefined,
  cards: CardsMap,
  setRole: (role: string) => void,
  role: string | undefined
): [() => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const onChange = useCallback((role: string) => {
    setRole(role);
    onClose();
  }, [setRole, onClose]);
  return [
    onOpen,
    <Modal key="role-modal" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading>Choose role</Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <RoleRadioChooser specialty={specialty} cards={cards} role={role} onChange={onChange} />
        </ModalBody>
      </ModalContent>
    </Modal>
  ];
}

export function DeckEdit({ deck, categoryTranslations, cards }: Props & { cards: CardsMap }) {
  const [stats, setStats] = useState<AspectStats>(pick(deck, ['awa', 'fit', 'foc', 'spi']));
  const [slots, setSlots] = useState<Slots>(deck.slots || {});
  const updateSlots = useCallback((code: string, count: number) => {
    const newSlots = { ...slots };
    if (!count) {
      delete newSlots[code];
      setSlots(newSlots);
    } else {
      newSlots[code] = count;
      setSlots(newSlots);
    }
  }, [slots, setSlots]);
  const [showCard, cardModal] = useCardModal(slots, updateSlots, !deck.previous_deck ? 'noah' : undefined);
  const [meta, setMeta] = useState<DeckMeta>(deck.meta || {});
  const background: string | undefined = typeof meta.background === 'string' ? meta.background : undefined;
  const specialty: string | undefined = typeof meta.specialty === 'string' ? meta.specialty : undefined;
  const parsedDeck = useMemo(() => {
    return parseDeck(
      stats,
      meta,
      slots,
      cards,
      categoryTranslations,
      deck.previous_deck ? pick(deck.previous_deck, ['meta', 'slots']) : undefined
    );
  }, [stats, deck.previous_deck, categoryTranslations, meta, slots, cards]);
  const setRole = useCallback((role: string) => {
    setMeta({
      ...meta,
      role,
    });
  }, [meta, setMeta]);
  const [showRole, roleModal] = useChooseRoleModal(parsedDeck.specialty, cards, setRole, parsedDeck.role?.id || undefined);
  const [aspectEditor, aspectError] = useAspectEditor(stats, setStats);

  const [personalityCards, backgroundCards, specialtyCards, outsideInterestCards] = useMemo(() => {
    const pc: CardFragment[] = [];
    const bc: CardFragment[] = [];
    const sc: CardFragment[] = [];
    const oic: CardFragment[] = [];
    forEach(values(cards), c => {
      if (!c) {
        return;
      }
      if (c.type_id === 'role') {
        return;
      }
      if (c.aspect_id) {
        const aspect = c.aspect_id.toLowerCase();
        if (aspect === 'awa' || aspect == 'spi' || aspect === 'fit' || aspect === 'foc') {
          if (stats[aspect] < (c.level || 0)) {
            // Outside your level
            return;
          }
        }
      }
      if (c.set_id === 'personality') {
        pc.push(c);
        return
      }
      if (c.set_type_id === 'background') {
        if (c.set_id === background) {
          bc.push(c);
        } else if (!c.real_traits || c.real_traits.indexOf('Expert') === -1) {
          oic.push(c);
        }
        return;
      }
      if (c.set_type_id === 'specialty') {
        if (c.set_id == specialty) {
          sc.push(c);
        } else if (!c.real_traits || c.real_traits.indexOf('Expert') === -1) {
          oic.push(c);
        }
      }
    });
    return [pc, bc, sc, oic];
  }, [cards, specialty, background, stats]);
  const [name, setName] = useState(deck.name);

  const hasEdits: boolean = useMemo(() => {
    const statChange = !!find(stats, (value, stat) => {
      switch (stat) {
        case 'awa': return deck.awa !== value;
        case 'spi': return deck.spi !== value;
        case 'foc': return deck.foc !== value;
        case 'fit': return deck.fit !== value;
        default: return false;
      }
    });
    const metaChange = !!find(union(keys(deck.meta), keys(meta)), (key) => {
      return (!!deck.meta[key] !== !!meta[key]) || deck.meta[key] !== meta[key];
    });
    const slotChange = !!find(union(keys(deck.slots), keys(slots)), (key) => {
      return (!!deck.slots[key] !== !!slots[key]) || deck.slots[key] !== slots[key];
    })
    return statChange || metaChange || slotChange || name !== deck.name;
  }, [deck, stats, meta, slots, name]);
  const [saveDeck] = useSaveDeckMutation();
  const [saveError, setSaveError] = useState<string | undefined>();
  const saveChanges = useCallback(async() => {
    setSaveError(undefined);
    const invalidAspectError: DeckError[] = aspectError ? ['invalid_aspects'] : [];
    const problem: DeckError[] | undefined = aspectError || parsedDeck.problem?.length ?
      sortBy([
        ...(invalidAspectError),
        ...(parsedDeck.problem || []),
        ...(parsedDeck.roleProblems || []),
      ], x => x) : undefined;
    const r = await saveDeck({
      variables: {
        id: deck.id,
        meta: {
          ...omit(meta, ['problem']),
          problem,
        },
        slots,
        name,
        awa: stats.awa,
        foc: stats.foc,
        fit: stats.fit,
        spi: stats.spi,
      },
    });
    if (!r.errors) {
      Router.push(`/decks/view/${deck.id}`);
      return;
    }
    setSaveError(r.errors[0].message);
  }, [saveDeck, stats, meta, slots, name, deck, parsedDeck.problem, parsedDeck.roleProblems, aspectError]);

  const renderControl = useCallback((code: string) => {
    if (!deck.previous_deck) {
      return <Box marginLeft={2}><CountToggle code={code} slots={slots} setSlots={updateSlots} /></Box>;
    }
    return (
      <CountControls code={code} slots={slots} setSlots={updateSlots} />
    );
  }, [deck.previous_deck, slots, updateSlots]);
  return (
    <>
      <SimpleGrid minChildWidth="300px" spacingX={4} columns={2}>
        <Box>
          <EditableTextInput
            value={name}
            onChange={setName}
          />
          { !!hasEdits && (
            <ButtonGroup paddingBottom={2} paddingTop={2}>
              <SolidButton color="blue" onClick={saveChanges}>Save Changes</SolidButton>
              <Button as={NextLink} href={`/decks/view/${deck.id}`}>Discard Changes</Button>
            </ButtonGroup>
          ) }
          { !!saveError && <Text color="red" paddingTop={2} paddingBottom={4}>{saveError}</Text>}
          { !parsedDeck.loading && !!parsedDeck.problem && (
            <Box marginBottom={4}>
              <DeckProblemComponent errors={parsedDeck.problem} />
            </Box>
          )}
          <MetaControls
            categoryTranslations={categoryTranslations}
            meta={meta}
            setMeta={setMeta}
            disabled={!!deck.previous_deck}
            hideLabels
          />
          <FormControl>
            <FormLabel>Role</FormLabel>
            <DeckProblemComponent limit={1} errors={parsedDeck.roleProblems} />
            { parsedDeck.role ? (
              <Box _hover={{ bg: "gray.50" }} cursor="pointer" onClick={showRole}>
                <CardRow card={parsedDeck.role} includeText last />
              </Box>
              ) : (
              <Input as={Button} disabled={!parsedDeck.specialty} onClick={showRole}>
                Choose role
              </Input>
              ) }
            <FormErrorMessage>Foo</FormErrorMessage>
          </FormControl>
          { deck.previous_deck ? (
            <Flex direction="row" marginTop={2}>
              <AspectCounter aspect={AWA} count={deck.awa} />
              <AspectCounter aspect={FIT} count={deck.fit} />
              <AspectCounter aspect={FOC} count={deck.foc} />
              <AspectCounter aspect={SPI} count={deck.spi} />
            </Flex>
          ) : <Box maxW="md">{aspectEditor}</Box> }
          <List>
            {map(parsedDeck.cards, item => (
              item.type === 'header' ? (
                <ListHeader
                  key={item.title}
                  title={item.title}
                  problem={parsedDeck.loading ? undefined : item.problem}
                />
              ) : (
                <DeckCardRow
                  item={item}
                  key={item.card.id}
                  showCard={showCard}
                />
              )))}
          </List>
        </Box>
        <Box>
          <Tabs>
            <TabList overflowX="scroll" overflowY="hidden">
              <Tab>Personality</Tab>
              <Tab>Background</Tab>
              <Tab>Specialty</Tab>
              <Tab>Outside Interest</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Text fontSize="md" color="gray.600" paddingBottom={2} borderBottomWidth="1px" borderBottomColor="gray.100">
                  Select 4 different personality cards, 1 from each aspect.
                </Text>
                <SimpleCardList
                  cards={personalityCards}
                  showCard={showCard}
                  header="none"
                  renderControl={renderControl}
                />
              </TabPanel>
              <TabPanel>
                <Text fontSize="md" color="gray.600" paddingBottom={2} borderBottomWidth="1px" borderBottomColor="gray.100">
                  Select 5 different cards from your chosen background.
                </Text>
                <SimpleCardList
                  cards={backgroundCards}
                  showCard={showCard}
                  header="aspect"
                  renderControl={renderControl}
                />
              </TabPanel>
              <TabPanel>
                <Text fontSize="md" color="gray.600" paddingBottom={2} borderBottomWidth="1px" borderBottomColor="gray.100">
                  Select 5 different cards from your chosen specialty.
                </Text>
                <SimpleCardList
                  cards={specialtyCards}
                  showCard={showCard}
                  header="aspect"
                  renderControl={renderControl}
                />
              </TabPanel>
              <TabPanel>
                <Text fontSize="md" color="gray.600" paddingBottom={1}>
                  Select 1 cards from any background of specialty as your outside interest.
                </Text>
                <Text fontSize="sm" color="gray.600" fontStyle="italic" paddingBottom={2} borderBottomWidth="1px" borderBottomColor="gray.100">
                  Note: cards from your chosen specialty/background are not shown here, but your outside interest is allowed to be from your chosen class if you use the other tabs to select it.
                </Text>
                <SimpleCardList
                  cards={outsideInterestCards}
                  showCard={showCard}
                  renderControl={renderControl}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </SimpleGrid>
      { cardModal }
      { roleModal }
    </>
  );
}

function MiniAspect({ value, aspect }: { value: number; aspect: string }) {
  const { aspects } = useTranslations();
  return (
    <Box bg={`aspect.${aspect}`} flexDirection="column" alignItems="center" padding={2} >
      <Text color="white" textAlign="center" fontWeight={900} lineHeight={1.1}>{value}</Text>
      <Text color="white" textAlign="center" fontSize="xs" lineHeight={1} fontWeight={200} letterSpacing={0.1}>{aspects[aspect]?.short_name}</Text>
    </Box>
  );
}

function DeckDescription({ deck, categoryTranslations, roleCards }: {
  deck: DeckFragment;
  categoryTranslations: CategoryTranslations;
  roleCards?: CardsMap;
}) {
  const background: string | undefined = typeof deck.meta.background === 'string' ? deck.meta.background : undefined;
  const specialty: string | undefined = typeof deck.meta.specialty === 'string' ? deck.meta.specialty : undefined;
  const role: string | undefined = typeof deck.meta.role === 'string' ? deck.meta.role : undefined;
  const description = useMemo(() => {
    return filter([
      background && categoryTranslations.background?.options?.[background],
      specialty && categoryTranslations.specialty?.options?.[specialty],
      roleCards && role && roleCards[role]?.name,
    ], x => !!x).join(' - ');
  }, [categoryTranslations, roleCards, background, specialty, role]);
  return <Text>{description}</Text>
}

export function DeckRow({ deck, categoryTranslations, roleCards, onDelete }: Props & {
  roleCards: CardsMap;
  onDelete: (deck: DeckFragment) => void;
}) {
  const { authUser } = useAuth();
  const doDelete = useCallback(() => {
    onDelete(deck);
  }, [onDelete, deck]);
  const problem = !!deck.meta.problem && Array.isArray(deck.meta.problem) ? (deck.meta.problem as DeckError[])  : undefined;
  return (
    <ListItem paddingTop={3} paddingBottom={3} borderBottomColor="gray.100" borderBottomWidth="1px">
      <Flex direction="row">
        <Flex flex={[1.2, 1.25, 1.5, 2]} direction="column" as={NextLink} href={`/decks/view/${deck.id}`}>
          <Text fontSize="xl">{deck.name}</Text>
          <DeckDescription deck={deck} categoryTranslations={categoryTranslations} roleCards={roleCards} />
        </Flex>
        <Flex marginLeft={[1, 1, 2]} flex={1} direction="row" alignItems="flex-start" justifyContent="space-between">
          <SimpleGrid columns={[2, 2, 4]}>
            <MiniAspect aspect="AWA" value={deck.awa} />
            <MiniAspect aspect="SPI" value={deck.spi} />
            <MiniAspect aspect="FIT" value={deck.fit} />
            <MiniAspect aspect="FOC" value={deck.foc} />
          </SimpleGrid>
          { authUser?.uid === deck.user_id && (
            <ButtonGroup marginLeft={[1, 2, "2em"]}>
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

function useAspectEditor(stats: AspectStats, setStats: (stats: AspectStats) => void): [React.ReactNode, string | undefined] {
  const setAwa = useCallback((value: number) => {
    setStats({
      ...stats,
      awa: value,
    });
  }, [setStats, stats]);
  const setFoc = useCallback((value: number) => {
    setStats({
      ...stats,
      foc: value,
    });
  }, [setStats, stats]);
  const setFit = useCallback((value: number) => {
    setStats({
      ...stats,
      fit: value,
    });
  }, [setStats, stats]);
  const setSpi = useCallback((value: number) => {
    setStats({
      ...stats,
      spi: value,
    });
  }, [setStats, stats]);

  const aspectError = useMemo(() => {
    const attrs = [stats.awa, stats.fit, stats.foc, stats.spi];
    const numOnes = sumBy(attrs, x => x === 1 ? 1 : 0);
    if (numOnes !== 1) {
      if (numOnes < 1) {
        return t`One aspect must be set to 1.`
      }
      return t`Only one aspect can be set to 1.`;
    }
    const numThrees = sumBy(attrs, x => x === 3 ? 1 : 0);
    if (numThrees !== 1) {
      if (numThrees < 1) {
        return t`One aspect must be set to 3.`
      }
      return t`Only one aspect can be set to 3.`;
    }
    if (sumBy(attrs, x => x === 2 ? 1 : 0) !== 2) {
      return t`Two aspects must be set to 2.`
    }
    return undefined;
  }, [stats]);
  return [
    <Flex direction="column" key="aspects" marginBottom={3}>
      <FormLabel>Aspects</FormLabel>
      <Flex direction="row">
        <AspectCounter aspect={AWA} count={stats.awa} onChange={setAwa} />
        <AspectCounter aspect={SPI} count={stats.spi} onChange={setSpi} />
        <AspectCounter aspect={FIT} count={stats.fit} onChange={setFit} />
        <AspectCounter aspect={FOC} count={stats.foc} onChange={setFoc} />
      </Flex>
      { !!aspectError && <Text color="red">{aspectError}</Text> }
    </Flex>,
    aspectError
  ];
}

function MetaControls({ meta, setMeta, categoryTranslations, disabled, hideLabels }: { categoryTranslations: CategoryTranslations; meta: DeckMeta; setMeta: (meta: DeckMeta) => void; disabled?: boolean; hideLabels?: boolean }) {
  const setMetaField = useCallback((category: string | undefined | null, value: string) => {
    if (category) {
      const newMeta: DeckMeta = {
        ...meta,
        [category]: value,
      };
      if (category === 'specialty' && meta.specialty !== newMeta.specialty) {
        newMeta.role = undefined;
      }
      setMeta(newMeta);
    }
  }, [setMeta, meta]);
  return (
    <>
      { map([{
        id: 'background',
        category: categoryTranslations.background,
      },
      {
        id: 'specialty',
        category: categoryTranslations.specialty,
      }], ({ category, id }) => !!category && (
        <FormControl marginBottom={4} key={id} isRequired={!hideLabels}>
          <FormLabel>{category.name}</FormLabel>
          <Select
            onChange={(event) => setMetaField(id, event.target.value)}
            placeholder={`Choose ${category.name}`}
            value={meta[id] || undefined}
            disabled={disabled}
          >
            { map(category.options, (name, setId) => (
              <option key={setId} value={setId || ''}>{name}</option>
            ))}
          </Select>
        </FormControl>
      ))}
    </>
  );
}

export function useNewDeckModal(categoryTranslations: CategoryTranslations, roleCards: CardsMap): [() => void, React.ReactNode] {
  const { authUser } = useAuth();
  const [name, setName] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [stats, setStats] = useState<AspectStats>({ awa: 2, fit: 2, foc: 2, spi: 2 })

  const [createDeck] = useCreateDeckMutation();

  const [meta, setMeta] = useState<DeckMeta>({});
  const [aspectEditor, aspectError] = useAspectEditor(stats, setStats);
  const placeholderDeckName = useMemo(() => {
    const background = meta.background && categoryTranslations.background?.options[meta.background];
    const specialty = meta.specialty && categoryTranslations.specialty?.options[meta.specialty];
    if (background && specialty) {
      return `${background} - ${specialty}`;
    }
    if (background) {
      return background;
    }
    if (specialty) {
      return specialty;
    }
    return 'Name your character';
  }, [meta, categoryTranslations]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const onCreateDeck = useCallback(async() => {
    if (aspectError || !authUser) {
      return;
    }
    const deckName = name || placeholderDeckName;
    setSubmitting(true);
    setError(undefined);
    const problem: DeckError[] = [
      'specialty',
      'background',
    ];
    const result = await createDeck({
      variables: {
        userId: authUser?.uid,
        name: deckName,
        ...stats,
        meta: {
          ...meta,
          problem,
        },
        slots: {},
      },
    });
    setSubmitting(false);
    if (result.errors?.length) {
      setError(result.errors[0].message);
    } else {
      onClose();
      if (result.data?.deck?.id) {
        Router.push(`/decks/edit/${result.data.deck.id}`);
      }
    }
  }, [createDeck, onClose, placeholderDeckName, authUser, stats, aspectError, meta, name]);
  const showModal = useCallback(() => {
    onOpen();
  }, [onOpen]);
  const setRole = useCallback((role: string) => {
    setMeta({
      ...meta,
      role,
    });
  }, [setMeta, meta]);
  const errorMessage = useMemo(() => {
    if (error) {
      return error;
    }
    if (aspectError) {
      return aspectError;
    }
    if (!meta.background) {
      return t`You must choose a background.`
    }
    if (!meta.specialty) {
      return t`You must choose a specialty.`
    }
    if (!meta.role) {
      return t`You must choose a role.`
    }
  }, [meta, aspectError, error]);
  return [
    showModal,
    <Modal key="modal" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>New deck</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={e => {
            e.preventDefault();
            onCreateDeck();
          }}>
            <FormControl marginBottom={4}>
              <FormLabel>Name</FormLabel>
              <Input
                type="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={placeholderDeckName}
              />
            </FormControl>
            { aspectEditor }
            <MetaControls
              categoryTranslations={categoryTranslations}
              meta={meta}
              setMeta={setMeta}
            />
            { !!meta.specialty && typeof meta.specialty === 'string' && (
              <FormControl marginBottom={4} isRequired>
                <FormLabel>Role</FormLabel>
                <RoleRadioChooser
                  key={meta.specialty}
                  specialty={meta.specialty}
                  cards={roleCards}
                  role={typeof meta.role === 'string' ? meta.role : undefined}
                  onChange={setRole}
                />
              </FormControl>
            )}
          </form>
        </ModalBody>
        <ModalFooter>
          <Flex direction="row" flex={1} justifyContent={errorMessage ? 'space-between' : 'flex-end'}>
            { !!errorMessage && <Text color="red">{errorMessage} </Text>}
            <SolidButton
              color="blue"
              isLoading={submitting}
              disabled={!!aspectError || !meta.background || !meta.specialty || !meta.role}
              onClick={onCreateDeck}
            >
              Create
            </SolidButton>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}

