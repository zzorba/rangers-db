import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  useColorModeValue,
  Textarea,
  Tooltip,
} from '@chakra-ui/react';
import Router from 'next/router';
import NextLink from 'next/link';
import { sumBy, find, keys, union, omit, forEach, map, flatMap, pick, values, sortBy } from 'lodash';
import { t } from '@lingui/macro';
import { ChakraStylesConfig, Select as ChakraReactSelect, chakraComponents, OptionProps, SingleValue } from 'chakra-react-select';

import { CardFragment, DeckFragment, DeckWithFullCampaignFragment, useCreateDeckMutation, useSaveDeckDescriptionMutation, useSaveDeckMutation } from '../generated/graphql/apollo-schema';
import { useAuth } from '../lib/AuthContext';
import AspectCounter from './AspectCounter';
import { AspectStats, AWA, DeckError, DeckMeta, FIT, FOC, Slots, SPI } from '../types/types';
import { CardsMap } from '../lib/hooks';
import { CardRow, ShowCard, useCardModal } from './Card';
import { SimpleCardList, SpoilerCardList } from './CardList';
import { CountControls, IncDecCountControls } from './CardCount';
import DeckProblemComponent from './DeckProblemComponent';
import EditableTextInput from './EditableTextInput';
import SolidButton from './SolidButton';
import { useLocale } from '../lib/TranslationProvider';
import { DeckCountLine, DeckItemComponent, MiniAspect } from './Deck';
import { WarningIcon } from '@chakra-ui/icons';
import parseDeck, { ParsedDeck } from '../lib/parseDeck';
import DeckDescriptionView from './DeckDescriptionView';
import CoreIcon from '../icons/CoreIcon';
import SubmitButton from './SubmitButton';
import { StarterDeck, STARTER_DECKS } from '../lib/starterDeck';
import { RoleImage } from './CardImage';

interface Props {
  deck: DeckWithFullCampaignFragment;
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

interface DeckOption {
  value: string;
  label: string;
  deck: StarterDeck;
  background: string | undefined;
  specialty: string | undefined;
  role: CardFragment | undefined;
}

function StarterDeckOption({ deck, role, background, specialty }: DeckOption) {
  if (!role) {
    return null;
  }
  return (
    <Flex direction="row" width="100%">
      { !!role.imagesrc && <RoleImage name={role.name} url={role.imagesrc} /> }
      <Flex direction="column" flex={1}>
        <Text fontSize="lg">{role.name}</Text>
        <Text>{specialty} - {background}</Text>
      </Flex>
      <SimpleGrid columns={2} marginLeft={2}>
        <MiniAspect extraSmall aspect="AWA" value={deck.awa} />
        <MiniAspect extraSmall aspect="SPI" value={deck.spi} />
        <MiniAspect extraSmall aspect="FIT" value={deck.fit} />
        <MiniAspect extraSmall aspect="FOC" value={deck.foc} />
      </SimpleGrid>
    </Flex>
  );
}
const StarterDeckComponents = {
  Option: ({ data, ...props }: OptionProps<DeckOption, false> ) => (
    <chakraComponents.Option {...props} data={data}>
      <StarterDeckOption {...data} />
    </chakraComponents.Option>
  ),
};

function StarterDeckSelect({ deck, onChange, roleCards }: {
  roleCards: CardsMap;
  deck: StarterDeck | undefined;
  onChange: (starterDeck: StarterDeck | undefined) => void;
}) {
  const { categories } = useLocale();
  const deckToOption = useCallback((deck: StarterDeck) => {
    const role = roleCards[deck.meta.role];
    const background = categories.background?.options[deck.meta.background];
    const specialty = categories.specialty?.options[deck.meta.specialty];
    return {
      value: deck.meta.role,
      label: `${background} / ${specialty}`,
      deck,
      background,
      specialty,
      role,
    };
  }, [categories, roleCards]);
  const options: DeckOption[] = useMemo(() => map(STARTER_DECKS, (d) => deckToOption(d)), [deckToOption]);
  const handleChange = useCallback((option: SingleValue<DeckOption>) => {
    onChange(option?.deck);
  }, [onChange]);
  return (
    <>
      <ChakraReactSelect
        name="deck"
        isRequired
        placeholder={t`Choose starter deck`}
        onChange={handleChange}
        options={options}
        components={StarterDeckComponents}
      />
      { !!deck && <Flex marginTop={3}><StarterDeckOption {...deckToOption(deck) } /></Flex> }
    </>
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
          <WarningIcon color="red.500" />
          <Text marginLeft={2} color="red.500">{aspectError}</Text>
        </Flex>
      ) }
    </Flex>,
    aspectError
  ];
}

function useChooseRoleModal(
  parsedDeck: ParsedDeck,
  cards: CardsMap,
  showCard: ShowCard,
  setRole?: (role: string) => void
): [() => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const onChange = useCallback((role: string) => {
    setRole?.(role);
    onClose();
  }, [setRole, onClose]);
  const showRole = useCallback(() => !!parsedDeck.role && showCard(parsedDeck.role), [showCard, parsedDeck.role])
  if (!setRole) {
    return [showRole, null];
  }
  return [
    onOpen,
    <Modal key="role-modal" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Heading>{t`Choose role`}</Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <RoleRadioChooser
            specialty={parsedDeck.specialty}
            cards={cards}
            role={parsedDeck.role?.id || undefined}
            onChange={onChange}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  ];
}

const icons = ['conflict', 'connection', 'reason', 'exploration', 'harm', 'progress', 'ranger', 'reshuffle', 'guide', 'per_ranger', 'sun', 'crest', 'mountain',
'conditional', 'AWA', 'FIT', 'SPI', 'FOC']
function EditDescriptionTab({ deck }: { deck: DeckFragment }) {
  const { isOpen: editing, onOpen, onClose } = useDisclosure();
  const [saveDescription] = useSaveDeckDescriptionMutation();
  const [liveDescription, setLiveDescription] = useState(deck.description || '');

  const doneEditing = useCallback(async() => {
    const r = await saveDescription({
      variables: {
        id: deck.id,
        description: liveDescription,
      }
    })
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    onClose();
  }, [onClose, liveDescription, saveDescription, deck.id]);
  useEffect(() => {
    setLiveDescription(deck.description || '');
  }, [deck.description, setLiveDescription]);
  const color = useColorModeValue('black', 'white');
  if (editing) {
    return (
      <>
        <SubmitButton color="blue" marginBottom={2} onSubmit={doneEditing}>{t`Done editing`}</SubmitButton>
        <Textarea
          marginBottom={2}
          minH="50vh"
          value={liveDescription}
          onChange={(e) => setLiveDescription(e.target.value)}
        />
        <Text>
          { t`Descriptions support basic markdown and html formatting.` }
        </Text>
        <Text>{t`- Flavor text can be denoted using <f>this is flavor</f> tags, to get card style formatting.`}</Text>
        <Text>{t`- You can use the following game specific icons by enclosing them in square brackets:`}
          <Flex direction="row">
            { map(icons, icon => (
              <Tooltip label={`[${icon}]`} key={icon}>
                <Box marginRight={1}><CoreIcon icon={icon} size={18} color={color} /></Box>
              </Tooltip>
            )) }
          </Flex>
        </Text>

      </>
    );
  }
  return (
    <>
      <Button marginBottom={2} onClick={onOpen}>{t`Edit description`}</Button>
      { !!deck.description && <DeckDescriptionView description={deck.description} /> }
    </>
  )
}

function BaseDeckbuildingTabs({
  renderControl,
  cards,
  stats,
  background,
  specialty,
  showCard,
  deck,
}: {
  cards: CardsMap;
  stats: AspectStats;
  background: string | undefined;
  specialty: string | undefined;
  slots: Slots;
  deck: DeckFragment,
  showCard: ShowCard;
  renderControl: (card: CardFragment) => React.ReactNode;
}) {
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
        <Tab>{t`Description`}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <Text fontSize="md" className='lightText' paddingBottom={2} borderBottomWidth="1px" borderBottomColor="gray.500">
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
          <Text fontSize="md" className='lightText' paddingBottom={2} borderBottomWidth="1px" borderBottomColor="gray.500">
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
          <Text fontSize="md" className='lightText' paddingBottom={2} borderBottomWidth="1px" borderBottomColor="gray.500">
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
          <Text fontSize="md" className='lightText' paddingBottom={1}>
            {t`Select 1 cards from any background of specialty as your outside interest.`}
          </Text>
          <Text fontSize="sm" className='lightText' fontStyle="italic" paddingBottom={2} borderBottomWidth="1px" borderBottomColor="gray.500">
            {t`Note: cards from your chosen specialty/background are not shown here, but your outside interest is allowed to be from your chosen class if you use the other tabs to select it.`}
          </Text>
          <SimpleCardList
            cards={outsideInterestCards}
            showCard={showCard}
            renderControl={renderControl}
          />
        </TabPanel>
        <TabPanel>
          <EditDescriptionTab deck={deck} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

function UpgradeDeckbuildingTabs({ showCard, deck, unlockedRewards, renderControl, sideSlots, stats, cards }: {
  cards: CardsMap;
  stats: AspectStats;
  slots: Slots;
  sideSlots: Slots;
  unlockedRewards: string[] | undefined;
  deck: DeckFragment;
  showCard: ShowCard;
  renderControl: (card: CardFragment) => React.ReactNode;
}) {
  const [rewardCards, maladyCards, sideCards] = useMemo(() => {
    const rc: CardFragment[] = [];
    const mc: CardFragment[] = [];
    const sc: CardFragment[] = [];
    forEach(sortBy(values(cards), c => c?.set_position || 0), c => {
      if (!c) {
        return;
      }
      if (c.type_id === 'role') {
        return;
      }
      if (c.set_id === 'malady') {
        mc.push(c);
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
      if (c.set_id === 'reward') {
        rc.push(c);
        return;
      }
      if (c.id && (sideSlots[c.id] || 0) > 0) {
        sc.push(c);
        return;
      }
    });
    return [rc, mc, sc];
  }, [cards, sideSlots, stats]);
  return (
    <Tabs>
      <TabList overflowX="scroll" overflowY="hidden">
        <Tab>{t`Rewards`}</Tab>
        <Tab>{t`Maladies`}</Tab>
        <Tab>{t`Displaced cards`}</Tab>
        <Tab>{t`Description`}</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <SpoilerCardList
            unlocked={unlockedRewards}
            cards={rewardCards}
            showCard={showCard}
            renderControl={renderControl}
            upsellText={!unlockedRewards ? t`You can add this deck to a campaign to track rewards you have unlocked as a group.` : undefined}
          />
        </TabPanel>
        <TabPanel>
          <SpoilerCardList
            cards={maladyCards}
            showCard={showCard}
            renderControl={renderControl}
          />
        </TabPanel>
        <TabPanel>
          <SimpleCardList
            cards={sideCards}
            showCard={showCard}
            renderControl={renderControl}
            emptyText={t`Cards that are removed from your deck will be stored here. They can be swapped back into your deck when you camp.`}
          />
        </TabPanel>
        <TabPanel>
          <EditDescriptionTab deck={deck} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}

function useSlots(originalSlots: Slots) : [Slots, (card: CardFragment, count: number) => void] {
  const [slots, setSlots] = useState<Slots>(originalSlots);
  const updateSlots = useCallback((card: CardFragment, count: number) => {
    const code = card.id;
    if (!code) {
      return;
    }
    const newSlots = { ...slots };
    if (!count) {
      delete newSlots[code];
      setSlots(newSlots);
    } else {
      newSlots[code] = count;
      setSlots(newSlots);
    }
  }, [slots, setSlots]);
  return [slots, updateSlots];
}

export default function DeckEdit({ deck, cards }: Props) {
  const [stats, setStats] = useState<AspectStats>(pick(deck, ['awa', 'fit', 'foc', 'spi']));
  const [slots, updateSlots] = useSlots(deck.slots || {});
  const [sideSlots, updateSideSlots] = useSlots(deck.side_slots || {});

  const updateUpgradeSlots = useCallback((card: CardFragment, count: number) => {
    if (card.set_id === 'reward' || card.set_id === 'malady') {
      updateSlots(card, count);
    } else if (card.id) {
      const diff = count - (slots[card.id] || 0);
      updateSideSlots(card, (sideSlots[card.id] || 0) - diff);
      updateSlots(card, count);
    }
  }, [slots, sideSlots, updateSlots, updateSideSlots]);
  const isUpgrade = !!deck.previous_deck;
  const renderControl = useCallback((card: CardFragment, onClose?: () => void) => {
    if (card.set_id === 'malady') {
      return (
        <IncDecCountControls
          card={card}
          slots={slots}
          setSlots={updateSlots}
        />
      );
    }
    return (
      <CountControls
        card={card}
        slots={slots}
        setSlots={!isUpgrade ? updateSlots : updateUpgradeSlots}
        countMode={!isUpgrade ? 'noah' : undefined}
        onClose={onClose}
      />
    );
  }, [slots, updateSlots, updateUpgradeSlots, isUpgrade]);

  const [showCard, cardModal] = useCardModal(slots, renderControl);
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
  const [showRole, roleModal] = useChooseRoleModal(
    parsedDeck,
    cards,
    showCard,
    !deck.previous_deck ? setRole : undefined
  );
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
        sideSlots,
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
  }, [saveDeck, stats, meta, slots, sideSlots, name, deck, parsedDeck.problem, parsedDeck.roleProblems, aspectError]);
  const hoverBackground = useColorModeValue('gray.100', 'gray.700');
  return (
    <>
      <SimpleGrid minChildWidth="400px" spacingX={4} spacingY="4rem" columns={[1, 1, 1, 2]}>
        <Box>
          <EditableTextInput
            value={name}
            fontSize="2xl"
            onChange={setName}
          />
          <DeckCountLine parsedDeck={parsedDeck} />
          { !parsedDeck.loading && !!parsedDeck.problem && (
            <Box marginBottom={4}>
              <DeckProblemComponent errors={parsedDeck.problem} limit={1} summarizeOthers />
            </Box>
          )}
          <ButtonGroup paddingBottom={2} paddingTop={2}>
            { !!hasEdits && <SolidButton color="blue" onClick={saveChanges}>{t`Save changes`}</SolidButton> }
            <Button as={NextLink} href={`/decks/view/${deck.id}`}>{hasEdits ? t`Discard changes` : t`Done editing`}</Button>
          </ButtonGroup>
          { !!saveError && <Text color="red.500" paddingTop={2} paddingBottom={4}>{saveError}</Text>}
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
              <Box _hover={{ bg: hoverBackground }} cursor="pointer" onClick={showRole}>
                <CardRow card={parsedDeck.role} includeText last />
              </Box>
              ) : (
              <Input as={Button} disabled={!parsedDeck.specialty} onClick={showRole}>
                {t`Choose role`}
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
              renderControl={renderControl}
              showCard={showCard}
              deck={deck}
            />
          ) : (
            <UpgradeDeckbuildingTabs
              showCard={showCard}
              stats={stats}
              cards={cards}
              slots={slots}
              unlockedRewards={deck.campaign?.rewards}
              sideSlots={sideSlots}
              renderControl={renderControl}
              deck={deck}
            />
          ) }
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
    return t`Name your character`;
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
  const [selectedTab, setSelectedTab] = useState(0);
  const [starter, setStarter] = useState<StarterDeck>();
  const onCreateStarterDeck = useCallback(async() => {
    if (!authUser || !starter) {
      return;
    }
    const background = starter.meta.background && categories.background?.options[starter.meta.background];
    const specialty = starter.meta.specialty && categories.specialty?.options[starter.meta.specialty];
    const deckName = name || t`${background} - ${specialty} (Starter)`;
    setSubmitting(true);
    setError(undefined);
    const result = await createDeck({
      variables: {
        name: deckName,
        foc: starter.foc,
        awa: starter.awa,
        spi: starter.spi,
        fit: starter.fit,
        meta: starter.meta,
        slots: starter.slots,
      },
    });
    setSubmitting(false);
    if (result.errors?.length) {
      setError(result.errors[0].message);
    } else {
      onClose();
      if (result.data?.deck?.id) {
        Router.push(`/decks/view/${result.data.deck.id}`);
      }
    }
  }, [starter, createDeck, categories, authUser, name, onClose]);
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
          <Tabs index={selectedTab} onChange={setSelectedTab}>
            <TabList>
              <Tab>{t`Custom deck`}</Tab>
              <Tab>{t`Starter deck`}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
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
              </TabPanel>
              <TabPanel>
                <form onSubmit={e => {
                  e.preventDefault();
                  onCreateStarterDeck();
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
                  <FormControl marginBottom={4}>
                    <FormLabel>{t`Starter deck`}</FormLabel>
                    <StarterDeckSelect
                      deck={starter}
                      onChange={setStarter}
                      roleCards={roleCards}
                    />
                  </FormControl>
                </form>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          { selectedTab === 0 ? (
            <Flex direction="row" flex={1} justifyContent={errorMessage ? 'space-between' : 'flex-end'}>
              { !!errorMessage && <Text color="red.500">{errorMessage} </Text>}
              <SolidButton
                color="blue"
                isLoading={submitting}
                disabled={(!!aspectError && SHOW_ASPECTS) || !meta.background || !meta.specialty || !meta.role}
                onClick={onCreateDeck}
              >
                {t`Create`}
              </SolidButton>
            </Flex>
          ) : (
            <SolidButton
              color="blue"
              isLoading={submitting}
              disabled={!starter}
              onClick={onCreateStarterDeck}
            >
              {t`Create`}
            </SolidButton>
          ) }
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}

