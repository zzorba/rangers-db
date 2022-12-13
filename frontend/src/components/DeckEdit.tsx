import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  List,
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
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  SimpleGrid,
  ButtonGroup,
  RadioGroup,
} from '@chakra-ui/react';
import Router from 'next/router';
import NextLink from 'next/link';
import { sumBy, find, keys, union, omit, forEach, map, flatMap, pick, values, sortBy } from 'lodash';
import { t } from '@lingui/macro';

import { CardFragment, DeckFragment, useCreateDeckMutation, useSaveDeckMutation } from '../generated/graphql/apollo-schema';
import { useAuth } from '../lib/AuthContext';
import AspectCounter from './AspectCounter';
import { AspectStats, AWA, DeckError, DeckMeta, FIT, FOC, Slots, SPI } from '../types/types';
import { CardsMap } from '../lib/hooks';
import { CardRow, ShowCard, useCardModal } from './Card';
import { SimpleCardList } from './CardList';
import { CountControls, CountToggle } from './CardCount';
import DeckProblemComponent from './DeckProblemComponent';
import EditableTextInput from './EditableTextInput';
import SolidButton from './SolidButton';
import { useLocale } from '../lib/TranslationProvider';
import { DeckItemComponent, parseDeck } from './Deck';
import { WarningIcon } from '@chakra-ui/icons';

interface Props {
  deck: DeckFragment;
  cards: CardsMap;
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


function MetaControls({ meta, setMeta, disabled, hideLabels }: { meta: DeckMeta; setMeta: (meta: DeckMeta) => void; disabled?: boolean; hideLabels?: boolean }) {
  const { categories } = useLocale();
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
        category: categories.background,
      },
      {
        id: 'specialty',
        category: categories.specialty,
      }], ({ category, id }) => !!category && (
        <FormControl marginBottom={4} key={id} isRequired={!hideLabels}>
          <FormLabel>{category.name}</FormLabel>
          <Select
            onChange={(event) => setMetaField(id, event.target.value)}
            placeholder={t`Choose ${category.name}`}
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
      <FormLabel>{t`Aspects`}</FormLabel>
      <Flex direction="row">
        <AspectCounter aspect={AWA} count={stats.awa} onChange={setAwa} />
        <AspectCounter aspect={SPI} count={stats.spi} onChange={setSpi} />
        <AspectCounter aspect={FIT} count={stats.fit} onChange={setFit} />
        <AspectCounter aspect={FOC} count={stats.foc} onChange={setFoc} />
      </Flex>
      { !!aspectError && (
        <Flex direction="row" alignItems="center">
          <WarningIcon color="red" />
          <Text marginLeft={2} color="red">{aspectError}</Text>
        </Flex>
      ) }
    </Flex>,
    aspectError
  ];
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

function BaseDeckbuildingTabs({ cards, stats, background, specialty, showCard, slots, updateSlots }: { cards: CardsMap; stats: AspectStats; background: string | undefined; specialty: string | undefined; showCard: ShowCard; slots: Slots; updateSlots: (code: string, count: number) => void }) {
  const renderControl = useCallback((code: string) => {
    return (
      <CountControls code={code} slots={slots} setSlots={updateSlots} countMode="noah" />
    );
  }, [slots, updateSlots]);
  const [personalityCards, backgroundCards, specialtyCards, outsideInterestCards] = useMemo(() => {
    const pc: CardFragment[] = [];
    const bc: CardFragment[] = [];
    const sc: CardFragment[] = [];
    const oic: CardFragment[] = [];
    forEach(sortBy(values(cards), c => c?.set_position || 0), c => {
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
  return (
    <Tabs>
      <TabList overflowX="scroll" overflowY="hidden">
        <Tab>{t`Personality`}</Tab>
        <Tab>{t`Background`}</Tab>
        <Tab>{t`Specialty`}</Tab>
        <Tab>{t`Outside Interest`}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Text fontSize="md" color="gray.600" paddingBottom={2} borderBottomWidth="1px" borderBottomColor="gray.100">
            {t`Select 4 different personality cards, 1 from each aspect.`}
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
            {t`Select 5 different cards from your chosen background.`}
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
            {t`Select 5 different cards from your chosen specialty.`}
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
            {t`Select 1 cards from any background of specialty as your outside interest.`}
          </Text>
          <Text fontSize="sm" color="gray.600" fontStyle="italic" paddingBottom={2} borderBottomWidth="1px" borderBottomColor="gray.100">
            {t`Note: cards from your chosen specialty/background are not shown here, but your outside interest is allowed to be from your chosen class if you use the other tabs to select it.`}
          </Text>
          <SimpleCardList
            cards={outsideInterestCards}
            showCard={showCard}
            renderControl={renderControl}
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

function UpgradeDeckbuildingTabs({ }: { showCard: ShowCard }) {
  return (
    <Tabs>
      <TabList overflowX="scroll" overflowY="hidden">
        <Tab>{t`Unlocked rewards`}</Tab>
        <Tab>{t`Displaced cards`}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Text>Rewards you unlock will go here.</Text>
        </TabPanel>
        <TabPanel>
          <Text>Cards you take out of your deck will go here.</Text>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

export default function DeckEdit({ deck, cards }: Props) {
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
  const { categories } = useLocale();
  const parsedDeck = useMemo(() => {
    return parseDeck(
      stats,
      meta,
      slots,
      cards,
      categories,
      deck.previous_deck ? pick(deck.previous_deck, ['meta', 'slots']) : undefined
    );
  }, [stats, deck.previous_deck, categories, meta, slots, cards]);
  const setRole = useCallback((role: string) => {
    setMeta({
      ...meta,
      role,
    });
  }, [meta, setMeta]);
  const [showRole, roleModal] = useChooseRoleModal(parsedDeck.specialty, cards, setRole, parsedDeck.role?.id || undefined);
  const [aspectEditor, aspectError] = useAspectEditor(stats, setStats);

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
            fontSize="2xl"
            onChange={setName}
          />
          { !!hasEdits && (
            <ButtonGroup paddingBottom={2} paddingTop={2}>
              <SolidButton color="blue" onClick={saveChanges}>{t`Save Changes`}</SolidButton>
              <Button as={NextLink} href={`/decks/view/${deck.id}`}>{t`Discard Changes`}</Button>
            </ButtonGroup>
          ) }
          { !!saveError && <Text color="red" paddingTop={2} paddingBottom={4}>{saveError}</Text>}
          { !parsedDeck.loading && !!parsedDeck.problem && (
            <Box marginBottom={4}>
              <DeckProblemComponent errors={parsedDeck.problem} />
            </Box>
          )}
          <MetaControls
            meta={meta}
            setMeta={setMeta}
            disabled={!!deck.previous_deck}
            hideLabels
          />
          <FormControl>
            <FormLabel>{t`Role`}</FormLabel>
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
          </FormControl>
          { deck.previous_deck ? (
            <Flex direction="row" marginTop={2}>
              <AspectCounter aspect={AWA} count={deck.awa} />
              <AspectCounter aspect={SPI} count={deck.spi} />
              <AspectCounter aspect={FIT} count={deck.fit} />
              <AspectCounter aspect={FOC} count={deck.foc} />
            </Flex>
          ) : <Box maxW="md">{aspectEditor}</Box> }
          <List>
            {map(parsedDeck.cards, item => (
              <DeckItemComponent key={item.id} item={item} showCard={showCard} />
            ))}
          </List>
        </Box>
        <Box>
          { !deck.previous_deck ? (
            <BaseDeckbuildingTabs
              cards={cards}
              background={background}
              specialty={specialty}
              stats={stats}
              slots={slots}
              updateSlots={updateSlots}
              showCard={showCard}
            />
          ) : (
            <UpgradeDeckbuildingTabs showCard={showCard} />
          )}
        </Box>
      </SimpleGrid>
      { cardModal }
      { roleModal }
    </>
  );
}

const SHOW_ASPECTS = false;
export function useNewDeckModal(roleCards: CardsMap): [() => void, React.ReactNode] {
  const { categories } = useLocale();

  const { authUser } = useAuth();
  const [name, setName] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [stats, setStats] = useState<AspectStats>({ awa: 3, fit: 3, foc: 3, spi: 3 })

  const [createDeck] = useCreateDeckMutation();

  const [meta, setMeta] = useState<DeckMeta>({});
  const [aspectEditor, aspectError] = useAspectEditor(stats, setStats);
  const placeholderDeckName = useMemo(() => {
    const background = meta.background && categories.background?.options[meta.background];
    const specialty = meta.specialty && categories.specialty?.options[meta.specialty];
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
  }, [meta, categories]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const onCreateDeck = useCallback(async() => {
    if (!authUser) {
      return;
    }
    const deckName = name || placeholderDeckName;
    setSubmitting(true);
    setError(undefined);
    const aspectsProblem: DeckError[] = SHOW_ASPECTS ? [] : ['invalid_aspects'];
    const problem: DeckError[] = [
      ...aspectsProblem,
      'specialty',
      'background',
    ];
    const result = await createDeck({
      variables: {
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
  }, [createDeck, onClose, placeholderDeckName, authUser, stats, meta, name]);
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
    if (aspectError && SHOW_ASPECTS) {
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
            <Heading>{t`New deck`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={e => {
            e.preventDefault();
            onCreateDeck();
          }}>
            <FormControl marginBottom={4}>
              <FormLabel>{t`Name`}</FormLabel>
              <Input
                type="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={placeholderDeckName}
              />
            </FormControl>
            { SHOW_ASPECTS && aspectEditor }
            <MetaControls
              meta={meta}
              setMeta={setMeta}
            />
            { !!meta.specialty && typeof meta.specialty === 'string' && (
              <FormControl marginBottom={4} isRequired>
                <FormLabel>{t`Role`}</FormLabel>
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
              disabled={(!!aspectError && SHOW_ASPECTS) || !meta.background || !meta.specialty || !meta.role}
              onClick={onCreateDeck}
            >
              {t`Create`}
            </SolidButton>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}

