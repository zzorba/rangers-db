import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Stack, Button, Box, Select, Tabs, TabList, Tab, TabPanels, TabPanel, Text, Tr, Td, Flex, FormControl, FormLabel, Heading, Input, List, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, IconButton, ButtonGroup, SimpleGrid, TableContainer, Table, Thead, Th, Tbody, AspectRatio, Checkbox, useColorMode, useColorModeValue, Tooltip, useBreakpointValue } from '@chakra-ui/react';
import { t } from '@lingui/macro';
import { head, forEach, uniq, filter, map, find, flatMap, difference, values, sortBy, range, trim, last, sumBy, slice, zip, findIndex, extend } from 'lodash';
import NextLink from 'next/link';
import Router from 'next/router';

import {
  CampaignFragment, CardFragment, DeckFragment, useCampaignTravelMutation, useAddCampaignEventMutation,
  useAddCampaignMissionMutation, useAddCampaignRemovedMutation, useAddFriendToCampaignMutation,
  useCreateCampaignMutation, useDeleteCampaignMutation, useGetMyCampaignDecksQuery,
  useGetMyCampaignDecksTotalQuery, useGetProfileQuery, useLeaveCampaignMutation,
  useRemoveDeckCampaignMutation, UserInfoFragment, useSetCampaignCalendarMutation,
  useSetCampaignDayMutation, useSetCampaignMissionsMutation, useSetDeckCampaignMutation,
  useUpdateCampaignEventsMutation, useUpdateCampaignRemovedMutation, useUpdateCampaignRewardsMutation,
  useAddCampaignHistoryMutation, useSetCampaignTitleMutation, useCampaignUndoTravelMutation,
  useUpdateCampaignNotesMutation, useAddCampaignNoteMutation, useExtendCampaignMutation,
} from '../generated/graphql/apollo-schema';
import { useAuth } from '../lib/AuthContext';
import FriendChooser from './FriendChooser';
import ListHeader from './ListHeader';
import CoreIcon from '../icons/CoreIcon';
import { CompactDeckRow } from './Deck';
import { CardsMap } from '../lib/hooks';
import SubmitButton, { SubmitIconButton } from './SubmitButton';
import { SlCheck, SlClose, SlMinus, SlPlus } from 'react-icons/sl';
import { useLocale } from '../lib/TranslationProvider';
import { CardRow } from './Card';
import EditableTextInput from './EditableTextInput';
import PageHeading from './PageHeading';
import PaginationWrapper from './PaginationWrapper';
import { AuthUser } from '../lib/useFirebaseAuth';
import { RoleImage } from './CardImage';
import useDeleteDialog from './useDeleteDialog';
import { FaArrowRight, FaCalendar, FaMoon, FaSort, FaSun, FaTrash, FaUndo, FaWalking } from 'react-icons/fa';
import { GiCampingTent } from 'react-icons/gi';
import { useTheme } from '../lib/ThemeContext';
import PathTypeSelect from './PathTypeSelect';
import { LocationIcon, PathIcon } from '../icons/LocationIcon';
import MapLocationSelect from './MapLocationSelect';
import CardSetSelect from './CardSetSelect';
import { CampaignCycle, MapLocation } from '../types/types';
import MoonIconWithDate, { MoonIcon } from '../icons/MoonIcon';
import SolidButton from './SolidButton';

const STARTING_LOCATIONS: { [campaign: string]: string } = {
  demo: 'lone_tree_station',
  core: 'lone_tree_station',
};

interface MissionEntry {
  day: number;
  name: string;
  progress?: number;
  completed?: boolean;
  checks?: boolean[];
}

interface LatestDeck {
  user: UserInfoFragment;
  deck: DeckFragment;
}

interface NotableEvent {
  event: string;
  crossed_out?: boolean;
}

interface CampaignNote {
  note: string;
  day: number;
  crossed_out?: boolean;
}

interface RemovedEntry {
  set_id?: string;
  name: string;
}

interface HistoryEntry {
  day: number;
  location?: string;
  path_terrain?: string;
  camped?: boolean;
}

export interface ParsedCampaign {
  id: number;
  name: string;
  day: number;
  user_id: string;
  cycle_id: string;
  extended_calendar: boolean;

  access: UserInfoFragment[];

  missions: MissionEntry[];
  calendar: CalendarEntry[];
  events: NotableEvent[];
  notes: CampaignNote[];
  history: HistoryEntry[];
  rewards: string[];
  removed: RemovedEntry[];
  latest_decks: LatestDeck[];
  current_location: string | undefined;
  current_path_terrain: string | undefined;
}

export class CampaignWrapper implements ParsedCampaign {
  id: number;
  user_id: string;
  name: string;
  day: number;
  cycle_id: string;
  extended_calendar: boolean;

  access: UserInfoFragment[];

  events: NotableEvent[];
  notes: CampaignNote[];
  history: HistoryEntry[];
  missions: MissionEntry[];
  calendar: CalendarEntry[];
  removed: RemovedEntry[];
  rewards: string[];
  latest_decks: LatestDeck[];
  current_location: string | undefined;
  current_path_terrain: string | undefined;

  constructor(campaign: CampaignFragment) {
    this.id = campaign.id;
    this.user_id = campaign.user_id;
    this.name = campaign.name;
    this.day = campaign.day;
    this.cycle_id = campaign.cycle_id;
    this.extended_calendar = campaign.extended_calendar ?? false;

    this.missions = Array.isArray(campaign.missions) ? (campaign.missions as MissionEntry[]) : [];
    this.calendar = Array.isArray(campaign.calendar) ? (campaign.calendar as CalendarEntry[]) : [];
    this.rewards = Array.isArray(campaign.rewards) ? (campaign.rewards as string[]) : [];
    this.notes = Array.isArray(campaign.notes) ? (campaign.notes as CampaignNote[]) : [];
    this.events = Array.isArray(campaign.events) ? (campaign.events as NotableEvent[]) : [];
    this.history = Array.isArray(campaign.history) ? (campaign.history as HistoryEntry[]) : [];
    this.removed = Array.isArray(campaign.removed) ? (campaign.removed as RemovedEntry[]) : [];
    this.current_location = campaign.current_location || undefined;
    this.current_path_terrain = campaign.current_path_terrain || undefined;

    this.access = flatMap(campaign.access, a => {
      if (a.user) {
        return a.user;
      }
      return [];
    });
    this.latest_decks = flatMap(campaign.latest_decks, ld => {
      if (ld.deck && ld.user) {
        return {
          deck: ld.deck,
          user: ld.user,
        };
      }
      return [];
    });
  }
}

function CampaignRow({ campaign, roleCards, onDelete }: {
  campaign: ParsedCampaign;
  roleCards: CardsMap;
  onDelete?: (campaign: ParsedCampaign) => void;
}) {
  const roleImageSize = useBreakpointValue<'small' | 'medium'>(['small', 'small', 'medium']);
  const { locations } = useLocale();
  const currentLocation = useMemo(() => find(locations, loc => loc?.id === campaign.current_location), [campaign.current_location, locations])
  const roles = useMemo(() => {
    return flatMap(campaign.latest_decks, d => {
      const role = d.deck?.meta.role;
      if (typeof role === 'string') {
        return roleCards[role] || [];
      }
      return [];
    })
  }, [campaign.latest_decks, roleCards]);
  const onDeleteClick = useCallback(() => onDelete?.(campaign), [onDelete, campaign]);
  const day = campaign.day;
  return (
    <Tr>
      <Td>
        <SimpleGrid columns={[1,1,2]} spacingY="2" as={NextLink} href={`/campaigns/${campaign.id}`}>
          <Flex direction="column">
            <Text fontSize="lg" fontWeight="600" marginBottom={2}>
              {campaign.name}
            </Text>
            <Flex direction="row">
              <CoreIcon icon="ranger" size="22" />
              <Text marginLeft={2}>
                {filter(map(campaign.access, a => a.handle || ''), x => !!x).join(', ')}
              </Text>
            </Flex>
          </Flex>
          { !!currentLocation && (
            <Flex direction="row" alignItems="center">
              <LocationIcon location={currentLocation} size={58} />
              <Flex direction="column" marginLeft={2}>
                <Text>{currentLocation.name}</Text>
                <Text>{t`Day ${day}`}</Text>
              </Flex>
            </Flex>
          ) }
        </SimpleGrid>
      </Td>
      <Td>
        <Flex direction="row" justifyContent="space-between">
          <SimpleGrid columns={[2, 2, 4]} as={NextLink} href={`/campaigns/${campaign.id}`}>
            { flatMap(roles, card => card.imagesrc ? (
              <RoleImage key={card.id} name={card.name} url={card.imagesrc} size={roleImageSize} />
            ) : [])}
          </SimpleGrid>
          <ButtonGroup>
            { !!onDelete ? <IconButton aria-label={t`Delete`} icon={<FaTrash />} color="red.500" variant="ghost" onClick={onDeleteClick} /> : <IconButton aria-label={t`Delete`} disabled color="transparent" variant="ghost" /> }
          </ButtonGroup>
        </Flex>
      </Td>
    </Tr>
  );
}

function deleteCampaignMessage(campaign: ParsedCampaign) {
  return t`Are you sure you want to delete your campaign: ${campaign.name}? This action cannot be undone.`
}
export function CampaignList({ campaigns, roleCards, refetch }: { campaigns: ParsedCampaign[]; roleCards: CardsMap; refetch: () => void; }) {
  const { authUser } = useAuth();
  const [doDelete] = useDeleteCampaignMutation();
  const deleteCampaign = useCallback(async(c: ParsedCampaign) => {
    const r = await doDelete({
      variables: {
        campaignId: c.id,
      },
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    refetch();
    return undefined;
  }, [doDelete, refetch]);
  const [onDelete, deleteDialog] = useDeleteDialog(
    t`Delete campaign?`,
    deleteCampaignMessage,
    deleteCampaign
  );
  return (
    <>
      <TableContainer marginBottom={2}>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>{t`Name`}</Th>
              <Th>{t`Rangers`}</Th>
            </Tr>
          </Thead>
          <Tbody>
            { map(campaigns, c => (
              <CampaignRow
                key={c.id}
                campaign={c}
                roleCards={roleCards}
                onDelete={authUser?.uid === c.user_id ? onDelete : undefined}
              />)
            ) }
          </Tbody>
        </Table>
      </TableContainer>
      { deleteDialog }
    </>
  )
}

function CampaignUser({ user, campaign, roleCards, showChooseDeck, removeDeck }: { user: UserInfoFragment; campaign: ParsedCampaign; roleCards: CardsMap; showChooseDeck: () => void; removeDeck: (deck: DeckFragment) => void }) {
  const { authUser } = useAuth();
  const decks = useMemo(() => map(filter(campaign.latest_decks, d => d.user?.id === user.id), d => d.deck), [campaign.latest_decks, user.id]);
  const [doLeaveCampaign] = useLeaveCampaignMutation();
  const leaveCampaign = useCallback(async() => {
    if (authUser?.uid) {
      await doLeaveCampaign({
        variables: {
          userId: authUser.uid,
          campaignId: campaign.id,
        },
      });
      Router.push('/campaigns');
    }
  }, [doLeaveCampaign, authUser, campaign.id]);
  return (
    <ListItem key={user.id} padding={2} flexDirection="column">
      <Flex direction="column">
        { !!decks.length  ? map(decks, deck => (
          <Flex direction="row" key={deck.id}>
            <CompactDeckRow
              deck={deck}
              roleCards={roleCards}
              href={`/decks/view/${deck.id}`}
              buttons={authUser?.uid === deck.user_id && (
                <ButtonGroup marginTop={1}>
                  <Button onClick={() => removeDeck(deck)} variant="ghost">
                    { t`Remove deck` }
                  </Button>
                </ButtonGroup>
              )}
            >
              <Text>
                <CoreIcon icon="ranger" size={18} />&nbsp;
                { user.handle || (user.id === authUser?.uid ? t`You` : user.id) }
              </Text>
            </CompactDeckRow>
          </Flex>
        )) : (
          <Flex direction="row">
            <Text>
              <CoreIcon icon="ranger" size={18} />&nbsp;
              { user.handle || (user.id === authUser?.uid ? t`You` : user.id) }
            </Text>
          </Flex>
        ) }
      </Flex>
      { authUser?.uid === user.id && (
        <ButtonGroup marginTop={1}>
          { decks.length ? (
            <Button onClick={showChooseDeck} variant="ghost">
              { t`Add additional deck` }
            </Button>
          ) : <>
            <Button onClick={showChooseDeck} variant="ghost">
              { t`Choose deck` }
            </Button>
            { authUser.uid !== campaign.user_id && (
              <Button onClick={leaveCampaign} variant="ghost" color="red.500">
                { t`Leave campaign` }
              </Button>
            ) }
          </> }
        </ButtonGroup>
      ) }
    </ListItem>
  );
}

function RewardRow({ card, unlocked, onUpdate }: { card: CardFragment; unlocked: boolean; onUpdate: (code: string, unlocked: boolean) => Promise<string | undefined> }) {
  const onSubmit = useCallback(async () => {
    if (card.id) {
      return await onUpdate(card.id, !unlocked);
    }
  }, [unlocked, onUpdate, card]);
  return (
    <CardRow card={card}>
      <Box marginLeft={2}>
        <SubmitIconButton
          variant="ghost"
          onSubmit={onSubmit}
          aria-label={unlocked ? t`Remove reward` : t`Add reward`}
          icon={unlocked ? <SlMinus /> : <SlPlus />}
        />
      </Box>
    </CardRow>
  );
}


function RewardsTab({ campaign, cards }: { campaign: ParsedCampaign; cards: CardsMap }) {
  const { locale } = useLocale();
  const rewardCards = useMemo(() =>
    sortBy(flatMap(values(cards), c => c?.set_id === 'reward' ? c : []), c => c.set_position),
  [cards]);
  const [search, setSearch] = useState('');
  const { isOpen: showAll, onOpen: onShow, onClose: onHide } = useDisclosure();
  const [unlockedRewards, unlockedCodes] = useMemo(() => {
    const unlockedList: string[] = [];
    const unlockedCards = flatMap(campaign.rewards, (code) => {
      unlockedList.push(code);
      return cards[code] || [];
    });

    return [unlockedCards, new Set(unlockedList)];
  }, [campaign.rewards, cards]);
  const visibleCards = useMemo(() => {
    const lowerSearch = search.toLocaleLowerCase(locale);
    return filter(rewardCards, c => !!showAll || !!(
      c.name && search.length >= 2 && c.name.toLocaleLowerCase(locale).indexOf(lowerSearch) !== -1)
    );
  }, [rewardCards, search, showAll, locale]);
  const [updateRewards] = useUpdateCampaignRewardsMutation();
  const toggleReward = useCallback(async(code: string, unlocked: boolean) => {
    if (unlocked) {
      if (!find(campaign.rewards, c => c === code)) {
        const r = await updateRewards({
          variables: {
            campaignId: campaign.id,
            rewards: [...campaign.rewards, code],
          },
        });
        if (r.errors?.length) {
          return r.errors[0].message;
        }
      }
    } else {
      if (find(campaign.rewards, c => c === code)) {
        const r = await updateRewards({
          variables: {
            campaignId: campaign.id,
            rewards: filter(campaign.rewards, c => c !== code),
          },
        });
        if (r.errors?.length) {
          return r.errors[0].message;
        }
      }
    }
    return undefined;
  }, [updateRewards, campaign.id, campaign.rewards]);
  return (
    <List>
      <ListHeader title={t`Available`} />
      { map(unlockedRewards, c => <RewardRow key={c.id} unlocked card={c} onUpdate={toggleReward} />)}
      <ListHeader title={t`All`} />
      <ListItem padding={2}>
        <form onSubmit={e => {
          e.preventDefault();
        }}>
          <Flex direction="row">
            <Input
              type="search"
              value={search}
              placeholder={t`Search by name`}
              onChange={e => setSearch(e.target.value)}
            />
            <ButtonGroup marginLeft={2}>
              <Button onClick={showAll ? onHide : onShow}>{showAll ? t`Hide spoilers` : t`Show all` }</Button>
            </ButtonGroup>
          </Flex>
        </form>
      </ListItem>
      { map(visibleCards, c => (
        <RewardRow
          key={c.id}
          card={c}
          unlocked={!!c.id && unlockedCodes.has(c.id)}
          onUpdate={toggleReward}
        />
      )) }
    </List>
  );
}

function EditableGuideNumber({ index, value, onUpdate, disabled }: { index: number; value: string; onUpdate: (index: number, value: string) => Promise<string | undefined>; disabled?: boolean }) {
  const onChange = useCallback((newValue: string) => {
    if (newValue !== value) {
      onUpdate(index, newValue);
    }
  }, [value, index, onUpdate]);
  return (
    <ListItem paddingTop={2}>
      <EditableTextInput
        value={value}
        hideEditButton
        onChange={onChange}
        disabled={disabled}
      />
    </ListItem>
  );
}

function useEditDayModal(campaign: ParsedCampaign): [(day: number) => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [setCalendar] = useSetCampaignCalendarMutation();
  const [day, setDay] = useState<number>(1);
  const [entries, setEntries] = useState<string[]>([]);
  const onShow = useCallback((day: number) => {
    setDay(day);
    setEntries(find(campaign.calendar, e => e.day === day)?.guides || []);
    onOpen();
  }, [campaign, setDay, setEntries, onOpen]);
  const [newEntry, setNewEntry] = useState('');
  const onSubmitNewGuide = useCallback(async() => {
    const currentDay: CalendarEntry = {
      day,
      guides: uniq([
        ...filter(map(entries, e => trim(e)), x => !!x),
        newEntry,
      ]),
    };
    const calendar: CalendarEntry[] = [
      ...flatMap(campaign.calendar, c => {
        if (c.day === day) {
          return [];
        }
        return c;
      }),
      ...(currentDay.guides.length ? [currentDay] : []),
    ];

    const result = await setCalendar({
      variables: {
        campaignId: campaign.id,
        calendar,
      },
    });
    if (result.errors?.length) {
      return result.errors[0].message;
    }
    setNewEntry('');
    setEntries(currentDay.guides);
  }, [campaign.id, entries, setCalendar, campaign.calendar, day, newEntry]);
  const onUpdateGuideEntry = useCallback(async(index: number, entry: string) => {
    const currentDay: CalendarEntry = {
      day,
      guides: uniq(filter(
        map(entries, (e, idx) => trim(idx === index ? entry : e)),
        x => !!x
      )),
    };
    const calendar: CalendarEntry[] = [
      ...flatMap(campaign.calendar, c => {
        if (c.day === day) {
          return [];
        }
        return c;
      }),
      ...(currentDay.guides.length ? [currentDay] : []),
    ];

    const result = await setCalendar({
      variables: {
        campaignId: campaign.id,
        calendar,
      },
    });
    if (result.errors?.length) {
      return result.errors[0].message;
    }
    setEntries(currentDay.guides);
  }, [campaign.id, entries, setCalendar, campaign.calendar, day]);
  const editable = day >= campaign.day;
  return [
    onShow,
    <Modal key="mission" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`Day ${day}`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column">
            { !editable &&  (
              <Text>{t`This day is in the past. It is currently day ${campaign.day}.`}</Text>
            ) }
            { (editable || entries.length > 0 || FIXED_GUIDE_ENTRIES[day]?.length) && (
              <Flex direction="row">
                <CoreIcon icon="guide" size={22} />
                <Text verticalAlign="center" marginLeft={1}>
                  { t`Guide entries` }
                </Text>
              </Flex>
            ) }
            <List>
              { map(FIXED_GUIDE_ENTRIES[day] || [], (e, idx) => (
                <EditableGuideNumber
                  key={idx}
                  index={idx}
                  value={e}
                  onUpdate={onUpdateGuideEntry}
                  disabled
                />
              ))}
              { map(entries, (e, idx) => (
                <EditableGuideNumber
                  key={idx}
                  index={idx}
                  value={e}
                  onUpdate={onUpdateGuideEntry}
                  disabled={day < campaign.day}
                />
              )) }
              { editable && (
                <ListItem marginTop={2} marginBottom={2}>
                  <form onSubmit={e => {
                    e.preventDefault();
                    onSubmitNewGuide();
                  }}>
                    <Flex direction="row">
                      <Input
                        value={newEntry}
                        type="number"
                        placeholder={t`Record guide entry`}
                        onChange={e => setNewEntry(e.target.value)}
                      />
                      { !!newEntry && (
                        <ButtonGroup marginLeft={2}>
                          <SubmitIconButton aria-label={t`Save`} onSubmit={onSubmitNewGuide} icon={<SlCheck />} />
                        </ButtonGroup>
                      ) }
                    </Flex>
                  </form>
                </ListItem>
              ) }
            </List>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  ];
}

function useAddMissionModal(campaign: ParsedCampaign): [() => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [addMission] = useAddCampaignMissionMutation();
  const [name, setName] = useState('');
  const [day, setDay] = useState(campaign.day);
  const onSubmit = useCallback(async() => {
    if (!name || !day) {
      return t`Name and day are required.`
    }
    const mission: MissionEntry = {
      name,
      day,
    };
    const result = await addMission({
      variables: {
        campaignId: campaign.id,
        mission,
      },
    });
    if (result.errors?.length) {
      return result.errors[0].message;
    }
    onClose();
    return undefined;
  }, [campaign.id, addMission, name, day, onClose]);
  const onShow = useCallback(() => {
    setDay(campaign.day);
    onOpen();
  }, [campaign.day, setDay, onOpen])
  return [
    onShow,
    <Modal key="mission" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>
              {t`Add mission`}
            </Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={e => {
            e.preventDefault();
            onSubmit();
          }}>
            <FormControl>
              <FormLabel>{t`Day`}</FormLabel>
              <Input
                value={day}
                type="number"
                onChange={e => setDay(parseInt(e.target.value))}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t`Name`}</FormLabel>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </FormControl>
          </form>
        </ModalBody>
        <ModalFooter>
          {!!name && !!day && <SubmitButton color="blue" onSubmit={onSubmit}>{t`Add`}</SubmitButton> }
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}

function progressToChecks(progress: number | undefined): boolean[] {
  const checks = [false, false, false];
  forEach(range(0, progress || 0), (idx) => {
    checks[idx] = true;
  });
  return checks;
}

function useEditMissionModal(campaign: ParsedCampaign): [(mission: MissionEntry, index: number) => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [current, setCurrent] = useState<{ mission: MissionEntry; index: number } | undefined>();

  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [progress, setProgress] = useState<boolean[]>([false, false, false]);
  const [completed, setCompleted] = useState<boolean>(false);

  const showModal = useCallback(async(mission: MissionEntry, index: number) => {
    setCurrent({ mission, index });
    setName(mission.name);
    setDay(`${mission.day}`);
    if (mission.checks) {
      setProgress(mission.checks);
    } else {
      setProgress(progressToChecks(mission.progress));
    }
    setCompleted(mission.completed || false);
    onOpen();
  }, [setName, setDay, setProgress, setCompleted, setCurrent, onOpen]);

  const hasChanges = useMemo(() => {
    if (!current) {
      return false;
    }
    const currentChecks = current.mission.checks ?? progressToChecks(current?.mission.progress);
    const checksChanged = findIndex(range(0, 3), (index) => currentChecks[index] !== progress[index]) !== -1;
    return (
      trim(current.mission.name) !== trim(name) ||
      current.mission.day !== parseInt(trim(day)) ||
      checksChanged ||
      (current.mission.completed || false) !== completed
    );
  }, [current, name, day, progress, completed]);

  const [setMissions] = useSetCampaignMissionsMutation();
  const onDelete = useCallback(async() => {
    if (!current) {
      return;
    }
    const r = await setMissions({
      variables: {
        campaignId: campaign.id,
        missions: filter(campaign.missions, (m, idx) => idx !== current.index),
      }
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    setCurrent(undefined);
    onClose();
  }, [current, campaign.id, campaign.missions, setMissions, setCurrent, onClose]);

  const onSubmit = useCallback(async() => {
    if (!current) {
      return;
    }
    if (!name || !parseInt(day)) {
      return t`Name and day are required.`
    }
    const mission: MissionEntry = {
      name,
      day: parseInt(day),
      completed,
      checks: progress,
    };
    const result = await setMissions({
      variables: {
        campaignId: campaign.id,
        missions: map(campaign.missions, (m, idx) => idx !== current.index ? m : mission),
      },
    });
    if (result.errors?.length) {
      return result.errors[0].message;
    }
    onClose();
    return undefined;
  }, [setMissions, campaign.id, campaign.missions, current, name, day, completed, progress, onClose]);
  return [
    showModal,
    <Modal key="access" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`Edit mission`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={e => {
            e.preventDefault();
            onSubmit();
          }}>
            <FormControl marginBottom={2}>
              <FormLabel>{t`Day`}</FormLabel>
              <Input
                value={day}
                type="number"
                onChange={e => setDay(e.target.value)}
              />
            </FormControl>
            <FormControl marginBottom={2}>
              <FormLabel>{t`Name`}</FormLabel>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>{t`Progress`}</FormLabel>
              <ButtonGroup>
                { map(range(0, 3), p => {
                  const progressNumber = p + 1;
                  const checked = progress[p];
                  return (
                    <IconButton
                      key={p}
                      aria-label={t`Progress ${progressNumber}`}
                      variant="ghost"
                      icon={<ProgressChit filled={checked} />}
                      onClick={() => setProgress(progress.map((value, index) => {
                        if (index !== p) {
                          return value;
                        }
                        return !value;
                      }))}
                    />
                  );
                }) }
              </ButtonGroup>
            </FormControl>
            <FormControl>
              <Checkbox isChecked={completed} onChange={(event) => setCompleted(event.target.checked)}>
                {t`Completed`}
              </Checkbox>
            </FormControl>
          </form>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <SubmitButton color="red" onSubmit={onDelete}>{t`Delete`}</SubmitButton>
            <SubmitButton color="blue" disabled={!hasChanges} onSubmit={onSubmit}>{t`Save`}</SubmitButton>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}


function ProgressChit({ filled, marginRight }: { filled?: boolean; marginRight?: number | string }) {
  const fillColor = useColorModeValue('gray.600', 'gray.100');
  return (
    <AspectRatio width="16px" ratio={1} marginRight={marginRight}>
      <Box borderRadius="3px" borderColor="gray.500" borderWidth="2px" transform="rotate(45deg)">
        { !!filled && (
          <AspectRatio width="10px" ratio={1}>
            <Box borderRadius="1px" backgroundColor={fillColor} />
          </AspectRatio>
        )}
      </Box>
    </AspectRatio>
  )
}

function MissionRow({ mission, index, showEdit }: { mission: MissionEntry; index: number; showEdit: (mission: MissionEntry, index: number) => void }) {
  const onClick = useCallback(() => showEdit(mission, index), [showEdit, mission, index]);
  return (
    <Tr cursor="pointer" onClick={onClick}>
      <Td>
        <AspectRatio width="40px" ratio={1}>
          <Box borderRadius="12px" borderColor="gray.500" borderWidth="2px">
            <AspectRatio width="34px" ratio={1}>
              <Box borderRadius="10px" borderColor="gray.500" borderWidth="1px" marginRight={1}>
                <Text textAlign="center" fontWeight="600">
                  {mission.day || ' '}
                </Text>
              </Box>
            </AspectRatio>
          </Box>
        </AspectRatio>
      </Td>
      <Td>
        <Text fontSize="lg" textDecorationLine={mission.completed ? 'line-through' : undefined}>
          { mission.name }
        </Text>
      </Td>
      <Td>
        <Flex direction="row">
          { mission.completed ? (
            <Text fontSize="sm">{t`Completed`}</Text>
          ) : map(range(0, 3), (idx) => <ProgressChit marginRight="6px" key={idx} filled={mission.checks ? mission.checks[idx] : ((mission.progress || 0) > idx)} />)}
        </Flex>
      </Td>
    </Tr>
  );
}

interface CampaignMission {
  mission: MissionEntry;
  index: number;
}

function MissionsTab({ campaign }: { campaign: ParsedCampaign }) {
  const [showAddMission, addMissionModal] = useAddMissionModal(campaign);
  const [showEditMission, editMissionModal] = useEditMissionModal(campaign);
  const [sort, setSort] = useState(false);
  const toggleSort = useCallback(() => setSort(!sort), [setSort, sort]);
  const missions: CampaignMission[] = useMemo(() =>
    sortBy(
      map(campaign.missions, (mission, index) => {
        return { mission, index };
      }),
      mission => sort ? mission.index : (mission.mission.completed ? 1 : 0),
    ), [campaign.missions, sort]);

  return (
    <>
      <Flex justifyContent="space-between">
        <Button leftIcon={<SlPlus />} onClick={showAddMission} marginBottom={2}>{t`Add mission`}</Button>
        <IconButton icon={<FaSort />} aria-label={t`Sort`} onClick={toggleSort} />
      </Flex>
      <TableContainer marginBottom={2}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>{t`Day`}</Th>
              <Th>{t`Name`}</Th>
              <Th>{t`Progress`}</Th>
            </Tr>
          </Thead>
          <Tbody>
            { map(missions, (mission) => (
              <MissionRow key={mission.index} mission={mission.mission} index={mission.index} showEdit={showEditMission} />
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      { addMissionModal }
      { editMissionModal }
    </>
  );
}

function RemoveRow({ remove, index, onRemove }: { remove: RemovedEntry; index: number; onRemove: (index: number) => Promise<string | undefined> }) {
  const { paths, generalSets, locations } = useLocale();
  const removeEntry = useCallback(() => {
    return onRemove(index);
  }, [index, onRemove]);
  const path = remove.set_id && paths[remove.set_id];
  const generalSet = remove.set_id && generalSets[remove.set_id];
  const location = remove.set_id && locations[remove.set_id];
  return (
    <Tr>
      <Td>
        { !!path && (
          <Flex direction="row" alignItems="center">
            <PathIcon path={path} size={42} />
            <Text marginLeft={3} fontSize="sm">{path.name}</Text>
          </Flex>
        )}
        { !!generalSet && (
          <Flex direction="row" alignItems="center">
            <LocationIcon location={generalSet} size={48} />
            <Text marginLeft={2} fontSize="sm">{generalSet.name}</Text>
          </Flex>
        )}
        { !!location && (
          <Flex direction="row" alignItems="center">
            <LocationIcon location={location} size={48} />
            <Text marginLeft={2} fontSize="sm">{location.name}</Text>
          </Flex>
        ) }
      </Td>
      <Td>
        <Text fontSize="lg">
          { remove.name }
        </Text>
      </Td>
      <Td>
        <SubmitIconButton
          variant="ghost"
          onSubmit={removeEntry}
          icon={<SlMinus />}
          aria-label={t`Delete`}
        />
      </Td>
    </Tr>
  );
}

function RemovedTab({ campaign }: { campaign: ParsedCampaign }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [cardSet, setCardSet] = useState<string>();
  const [name, setName] = useState<string>();
  const [submitEntry] = useAddCampaignRemovedMutation();
  const [updateRemoved] = useUpdateCampaignRemovedMutation();
  const onSubmitEntry = useCallback(async() => {
    if (!name) {
      return;
    }

    const entry: RemovedEntry = {
      set_id: cardSet || undefined,
      name,
    };

    const r = await submitEntry({
      variables: {
        campaignId: campaign.id,
        removed: entry,
      },
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    setName('');
    setCardSet('');
    onClose();
    return undefined;
  }, [onClose, submitEntry, setName, setCardSet, name, cardSet, campaign.id]);

  const onRemove = useCallback(async(index: number) => {
    const r = await updateRemoved({
      variables: {
        campaignId: campaign.id,
        removed: filter(campaign.removed, (_, idx) => idx !== index),
      },
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    return undefined;
  }, [campaign.removed, campaign.id, updateRemoved]);
  return (
    <>
      <Text marginBottom={2}>
        { t`Track cards that are removed permanently from the path deck here.` }
      </Text>
      <Box marginBottom={2}>
        { isOpen ? (
          <>
            <form onSubmit={e => {
              e.preventDefault();
              onSubmitEntry();
            }}>
              <FormControl marginTop={4} isRequired>
                <FormLabel>{t`Name`}</FormLabel>
                <Input
                  type="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </FormControl>
              <FormControl marginTop={4}>
                <FormLabel>{t`Set`}</FormLabel>
                <CardSetSelect value={cardSet} setValue={setCardSet} />
              </FormControl>
              <ButtonGroup marginTop={2}>
                <SubmitButton color="blue" disabled={!trim(name)} onSubmit={onSubmitEntry}>
                  { t`Save` }
                </SubmitButton>
                <Button onClick={onClose}>{t`Cancel`}</Button>
              </ButtonGroup>
            </form>
          </>
        ) : (
          <Button leftIcon={<SlPlus />} onClick={onOpen}>{t`Remove card`}</Button>
        ) }
      </Box>
      <TableContainer marginBottom={2}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>{t`Set`}</Th>
              <Th>{t`Name`}</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            { map(campaign.removed, (remove, idx) => (
              <RemoveRow key={idx} remove={remove} index={idx} onRemove={onRemove} />
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}

interface TravelDay {
  day: number;
  startingLocation: string | undefined;
  travel: HistoryEntry[];
}

function TravelDayRow({ entry: { day, startingLocation, travel }, currentDay }: { entry: TravelDay; currentDay: number }) {
  const { locations, paths } = useLocale();
  const start = startingLocation ? locations[startingLocation] : undefined;
  const finalLocationId = last(travel)?.location || startingLocation;
  const finalLocation = finalLocationId ? locations[finalLocationId] : undefined;
  const camped = !!last(travel)?.camped;
  return (
    <ListItem>
      <Flex direction="row" alignItems="flex-start" padding={2} flexWrap="wrap">
        { !!start && (
          <>
            <Flex direction="column" width="75px" alignItems="center">
              <LocationIcon location={start} size={58} />
              <Text textAlign="center" fontSize="xs">{start.name}</Text>
            </Flex>
          </>
        ) }
        { map(travel, ({ day, location, path_terrain, camped }, idx) => {
          const path = path_terrain ? paths[path_terrain] : undefined;
          const current: MapLocation | undefined = location ? locations[location] : undefined;
          return (
            <>
              { !!path && (
                <Flex minHeight={58} direction="row" alignItems="center" marginRight={2}>
                  <FaArrowRight />
                </Flex>
              ) }
              { !!path && (
                <Flex minHeight={58} direction="row" alignItems="center" marginRight={2}>
                  <Box margin={2}>
                    <PathIcon key={`${day}-path-${idx}`} path={path} size={42} />
                  </Box>
                </Flex>
              ) }
              { !camped && (
                <Flex minHeight={58} direction="row" alignItems="center" marginRight={2}>
                  <FaArrowRight />
                </Flex>
              ) }
              { !!current && !camped && (
                <Flex direction="column" width="75px" marginRight={2} alignItems="center">
                  <LocationIcon key={`${day}-location-${idx}`} location={current} size={58} />
                  <Text textAlign="center" fontSize="xs">{current.name}</Text>
                </Flex>
              )}
            </>
          );
        }) }
        { !!finalLocation && day < currentDay && (
          <>
            <Flex minHeight={58} direction="row" alignItems="center" marginRight={2}>
              <FaArrowRight />
            </Flex>
            <Flex direction="column" width="75px" marginRight={2} alignItems="center">
              <Flex height="58px" direction="column" justifyContent="center">
                { camped ? <GiCampingTent size={48} /> :  <FaMoon size={36} /> }
              </Flex>
              <Text textAlign="center" fontSize="xs">
                {camped ? t`En route to ${finalLocation.name}` : t`Stayed at ${finalLocation.name}`}
              </Text>
            </Flex>
          </>
        ) }
      </Flex>
    </ListItem>
  );
}

function TravelSummary({ historyEntry }: { historyEntry: HistoryEntry }) {
  const { locations } = useLocale();
  const destination = historyEntry.location ? locations[historyEntry.location] : undefined;
  if (historyEntry.camped) {
    return (
      <Flex direction="row" alignItems="center">
        <Box marginRight={2}>
          <GiCampingTent size={48} />
        </Box>
        { !!destination && <LocationIcon location={destination} size={60} /> }
        <Text marginLeft={2}>{t`Camped while travelling to ${destination?.name}.`}</Text>
      </Flex>
    );
  }
  return (
    <Flex direction="row" alignItems="center">
      { !!destination && <LocationIcon location={destination} size={60} /> }
      <Text marginLeft={2}>{t`Traveled to ${destination?.name}.`}</Text>
    </Flex>
  );
}


function EndDaySummary({ historyEntry, cycleId }: { historyEntry?: HistoryEntry; cycleId: string }) {
  const { locations } = useLocale();
  const destination = locations[historyEntry?.location ?? STARTING_LOCATIONS[cycleId]];
  return (
    <Flex direction="row" alignItems="center">
      <Box marginRight={2}>
        <FaMoon size={36} />
      </Box>
      { !!destination && <LocationIcon location={destination} size={60} /> }
      <Text marginLeft={2}>{t`Ended the day at ${destination?.name}.`}</Text>
    </Flex>
  );
}

function useUndoModal(campaign: ParsedCampaign): [() => void, boolean, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [setCampaignDay] = useSetCampaignDayMutation();
  const onUndoEndDay = useCallback(async() => {
    if (campaign.day > 0) {
      const r = await setCampaignDay({
        variables: {
          campaignId: campaign.id,
          day: campaign.day - 1,
        }
      });
      if (r.errors?.length) {
        return r.errors[0].message;
      }
      onClose();
    }
    return undefined;
  }, [campaign, setCampaignDay, onClose]);
  const lastTravel = last(campaign.history);
  const [undoCampaignTravel] = useCampaignUndoTravelMutation();
  const onUndoTravel = useCallback(async() => {
    const lastTravel = last(campaign.history);
    if (lastTravel) {
      let previousLocation: string = STARTING_LOCATIONS[campaign.cycle_id];
      let previousPathTerrain: string | undefined = undefined;
      if (campaign.history.length >= 2) {
        const penultimateEntry = campaign.history[campaign.history.length - 2];
        if (penultimateEntry.location) {
          previousLocation = penultimateEntry.location;
        }
        previousPathTerrain = penultimateEntry.path_terrain;
      }
      const newHistory = slice(campaign.history, 0, campaign.history.length - 1);
      const r = await undoCampaignTravel({
        variables: {
          campaignId: campaign.id,
          previousDay: campaign.day - (lastTravel?.camped ? 1 : 0),
          previousLocation,
          previousPathTerrain,
          history: newHistory,
        }
      });
      if (r.errors?.length) {
        return r.errors[0].message;
      }
      onClose();
    }
    return undefined;
  }, [campaign, onClose, undoCampaignTravel]);
  const canUndoEndDay = campaign.day > 1 && (lastTravel == null || (lastTravel.camped ? (lastTravel.day + 1) : lastTravel.day)  < campaign.day);
  return [
    onOpen,
    !!lastTravel || canUndoEndDay,
    <Modal key="undo" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`Undo travel changes`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text marginBottom={2}>
            { t`If you made a mistake when travelling or ending the day, you can undo your recent edits here. Decks will not be changed.` }
          </Text>
          { canUndoEndDay && (
            <>
              <EndDaySummary historyEntry={lastTravel} cycleId={campaign.cycle_id} />
              <SolidButton marginTop={1} color="orange" variant="ghost" leftIcon={<FaMoon />} onClick={onUndoEndDay}>{t`Undo`}</SolidButton>
            </>
          ) }
          { !!lastTravel && !canUndoEndDay && (
            <>
              <TravelSummary historyEntry={lastTravel} />
              <SolidButton marginTop={2} color="orange" variant="ghost" leftIcon={<FaWalking />} onClick={onUndoTravel}>{t`Undo travel`}</SolidButton>
            </>
          ) }

        </ModalBody>
      </ModalContent>
    </Modal>
  ];
}

function useEndDayModal(campaign: ParsedCampaign): [() => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { locations } = useLocale();
  const showModal = useCallback(() => {
    onOpen();
  }, [onOpen]);
  const [setCampaignDay] = useSetCampaignDayMutation();
  const onEndDay = useCallback(async() => {
    const r = await setCampaignDay({
      variables: {
        campaignId: campaign.id,
        day: campaign.day + 1,
      }
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    onClose();
    return undefined;
  }, [campaign, setCampaignDay, onClose]);
  const currentLocation = campaign.current_location ? locations[campaign.current_location] : undefined;
  return [
    showModal,
    <Modal key="end-day" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`End the day`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          { !!currentLocation && (
            <Flex direction="column" alignItems="center">
              <LocationIcon location={currentLocation} size={58} />
              <Text>{t`Current location: ${currentLocation.name}`}</Text>
            </Flex>
          ) }
          <Text marginBottom={2}>
            { t`This will end day ${campaign.day}.`}
          </Text>
          <Text fontStyle="italic">
            { t`This option should be used if a ranger is too fatigued, too injured, or if instructed by the campaign guide or a mission.`}
          </Text>
          <Text fontStyle="italic">
            {t`If you intend to Camp while travelling to a new location, please use the Travel button instead.`}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Flex direction="row" flex={1} justifyContent="flex-end">
            <SubmitButton leftIcon={<FaMoon />} color="blue" onSubmit={onEndDay}>
              { t`End the day` }
            </SubmitButton>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}

function useJourneyModal(campaign: ParsedCampaign): [() => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const weatherLabels = useWeather();
  const hasOldData = useMemo(() => {
    const firstEntry = head(campaign.history);
    return !!firstEntry && !firstEntry.path_terrain && firstEntry.location === 'lone_tree_station';
  }, [campaign.history]);
  const travelHistory = useMemo(() => {
    const days: {
      [day: string]: HistoryEntry[] | undefined;
    } = {};
    let currentLocation: string | undefined = undefined;
    forEach(campaign.history, entry => {
      if (!currentLocation) {
        currentLocation = entry.location;
      }
      const day = `${entry.day}`;
      days[day] = [
        ...(days[day] || []),
        entry,
      ];
    });

    if (!currentLocation) {
      currentLocation = campaign.current_location;
    }
    const result: TravelDay[] = [];
    let liveLocation: string | undefined = STARTING_LOCATIONS[campaign.cycle_id];
    forEach(range(1, campaign.day + 1), day => {
      const dayString = `${day}`;
      const travel = days[dayString];
      if (travel?.length) {
        result.push({
          day,
          startingLocation: liveLocation,
          travel,
        });
        const end = last(travel);
        if (end?.location) {
          liveLocation = end.location;
        }
      } else {
        if (currentLocation) {
          result.push({
            day,
            startingLocation: liveLocation,
            travel: [],
          });
        }
      }
    });
    return result;
  }, [campaign.history, campaign.cycle_id, campaign.current_location, campaign.day]);
  return [
    onOpen,
    <Modal key="journey" scrollBehavior="inside" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <Heading>{t`Journey`}</Heading>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          { !!hasOldData && (
            <>
              <Text fontStyle="italic">
                { t`Note: this campaign was created before the website recorded enough information to show the travel history correclty.` }
              </Text>
              <Text fontStyle="italic">
                { t`If you would like it to be corrected, send me a link to your campaign and what the correct journey was to arkhamcards@gmail.com, and I will get it fixed for you.` }
              </Text>
            </>
          ) }
          <List>
            { map(travelHistory, (entry) => {
              const day = entry.day;
              const weather = find(weatherLabels, e => (e.start <= day && e.end >= day));
              return (
                <>
                  <ListItem  key={`day-${day}`} padding={2} paddingTop={4} paddingBottom={0} borderBottomWidth={0.5} borderColor="#888888">
                    <Flex direction="row" flex={1} alignItems="center" justifyContent="space-between">
                      <Flex direction="row" alignItems="center" justifyContent="flex-start">
                        <Box marginRight={2} marginBottom={0.5}>
                          { day < campaign.day ? <MoonIcon day={day} size={18} /> : <FaSun /> }
                        </Box>
                        <Text fontSize="m">{t`Day ${day}`}</Text>
                      </Flex>
                      { !!weather && <Text fontSize="sm" fontStyle="italic">{weather.name}</Text> }
                    </Flex>
                  </ListItem>
                  <TravelDayRow
                    key={`day-${day}-locs`}
                    entry={entry}
                    currentDay={campaign.day}
                  />
                </>
              )
            }) }
          </List>
        </ModalBody>
      </ModalContent>
    </Modal>
  ];
}

function useEditEventModal(onUpdate: (idx: number, event: NotableEvent) => Promise<void>): [(index: number, event: NotableEvent) => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [index, setIndex] = useState<number>(0);
  const [text, setText] = useState('');
  const [crossedOut, setCrossedOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showModal = useCallback((index: number, event: NotableEvent) => {
    setText(event.event);
    setIndex(index);
    setCrossedOut(event.crossed_out || false);
    onOpen();
  }, [onOpen, setText, setIndex, setCrossedOut]);
  const onSaveEvent = useCallback(async() => {
    setSubmitting(true);
    await onUpdate(index, { event: text, crossed_out: crossedOut });
    setSubmitting(false);
    onClose();
    return undefined;
  }, [onUpdate, onClose, index, text, crossedOut, setSubmitting]);
  return [
    showModal,
    <Modal key="event" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`Edit notable event`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={e => {
            e.preventDefault();
            onSaveEvent();
          }}>
            <FormControl marginBottom={4}>
              <FormLabel>{t`What happened?`}</FormLabel>
              <Input
                type="text"
                textDecorationLine={crossedOut ? 'line-through' : undefined}
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <Checkbox isChecked={crossedOut} onChange={(event) => setCrossedOut(event.target.checked)}>
                { t`Crossed-out` }
              </Checkbox>
            </FormControl>
          </form>
        </ModalBody>
        <ModalFooter>
          <Flex direction="row" flex={1} justifyContent="flex-end">
            <SubmitButton color="blue" onSubmit={onSaveEvent}>
              { t`Save` }
            </SubmitButton>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}

function EventLine({ event, idx, onClick }: {
  event: NotableEvent;
  idx: number;
  onClick: (idx: number, event: NotableEvent) => void;
}) {
  const handleClick = useCallback(() => onClick(idx, event), [onClick, idx, event]);
  return (
    <ListItem key={idx} paddingTop={2} paddingBottom={2} onClick={handleClick} cursor="pointer">
      <Text padding={2} borderBottomWidth={1} borderColor="gray.500" textDecorationLine={event.crossed_out ? 'line-through' : undefined}>
        { event.event }
      </Text>
    </ListItem>
  );
}


function EventsTab({ campaign }: { campaign: ParsedCampaign }) {
  const [event, setEvent] = useState('');
  const [addEvent] = useAddCampaignEventMutation();
  const onSubmitNewEvent = useCallback(async() => {
    if (event) {
      const newEvent: NotableEvent = {
        event: trim(event),
      };
      const r = await addEvent({
        variables: {
          campaignId: campaign.id,
          event: newEvent,
        }
      });
      if (r.errors?.length) {
        return r.errors[0].message;
      }
    }
    setEvent('');
    return undefined;
  }, [event, campaign.id, setEvent, addEvent]);
  const [updateEvents] = useUpdateCampaignEventsMutation();
  const onUpdateEvent = useCallback(async(idx: number, value: NotableEvent) => {
    const newEvents = flatMap(campaign.events, (e, i) => {
      if (idx === i) {
        if (value.event) {
          return value;
        }
        return [];
      }
      return e;
    });
    await updateEvents({
      variables: {
        campaignId: campaign.id,
        events: newEvents,
      }
    });
  }, [updateEvents, campaign.events, campaign.id]);
  const { onOpen, onClose, isOpen } = useDisclosure();
  const [showEditEvent, eventModal] = useEditEventModal(onUpdateEvent);
  return (
    <>
      <List>
        { isOpen ? (
          <form onSubmit={e => {
            e.preventDefault();
            onSubmitNewEvent();
          }}>
            <Flex direction="row">
              <FormControl>
                <Input
                  value={event}
                  autoFocus
                  placeholder={t`What happened?`}
                  onChange={e => setEvent(e.target.value)}
                />
              </FormControl>
              <ButtonGroup marginLeft={2}>
                { !!event && <SubmitIconButton aria-label={t`Save`} onSubmit={onSubmitNewEvent} icon={<SlCheck />} /> }
                <IconButton aria-label={t`Cancel`} icon={<SlClose />} onClick={onClose} />
              </ButtonGroup>
            </Flex>
          </form>
        ) : <Button leftIcon={<SlPlus />} onClick={onOpen}>{t`Record event`}</Button>}
        { map(campaign.events, (event, idx) => (
          <EventLine
            key={idx}
            idx={idx}
            event={event}
            onClick={showEditEvent}
          />)) }
      </List>
      { eventModal }
    </>
  );
}
function useEditNoteModal(onUpdate: (idx: number, note: CampaignNote) => Promise<void>): [(index: number, note: CampaignNote) => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [index, setIndex] = useState<number>(0);
  const [day, setDay] = useState<number>(0);
  const [text, setText] = useState('');
  const [crossedOut, setCrossedOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showModal = useCallback((index: number, note: CampaignNote) => {
    setText(note.note);
    setIndex(index);
    setDay(note.day);
    setCrossedOut(note.crossed_out || false);
    onOpen();
  }, [onOpen, setText, setDay, setIndex, setCrossedOut]);
  const onSaveNote = useCallback(async() => {
    setSubmitting(true);
    await onUpdate(index, { note: text, day, crossed_out: crossedOut });
    setSubmitting(false);
    onClose();
    return undefined;
  }, [onUpdate, onClose, day, index, text, crossedOut, setSubmitting]);
  return [
    showModal,
    <Modal key="note" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`Edit note`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={e => {
            e.preventDefault();
            onSaveNote();
          }}>
            <FormControl marginBottom={4}>
              <FormLabel>{t`What happened?`}</FormLabel>
              <Input
                type="text"
                textDecorationLine={crossedOut ? 'line-through' : undefined}
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <Checkbox isChecked={crossedOut} onChange={(event) => setCrossedOut(event.target.checked)}>
                { t`Crossed-out` }
              </Checkbox>
            </FormControl>
          </form>
        </ModalBody>
        <ModalFooter>
          <Flex direction="row" flex={1} justifyContent="flex-end">
            <SubmitButton color="blue" onSubmit={onSaveNote}>
              { t`Save` }
            </SubmitButton>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}

function NoteLine({ note, idx, onClick }: {
  note: CampaignNote;
  idx: number;
  onClick: (idx: number, event: CampaignNote) => void;
}) {
  const handleClick = useCallback(() => onClick(idx, note), [onClick, idx, note]);
  return (
    <ListItem key={idx} paddingTop={2} paddingBottom={2} onClick={handleClick} cursor="pointer">
      <Text padding={2} borderBottomWidth={1} borderColor="gray.500" textDecorationLine={note.crossed_out ? 'line-through' : undefined}>
        { note.note }
      </Text>
    </ListItem>
  );
}

function NotesTab({ campaign }: { campaign: ParsedCampaign }) {
  const [note, setNote] = useState('');
  const [addNote] = useAddCampaignNoteMutation();
  const onSubmitNewNote = useCallback(async() => {
    if (note) {
      const newNote: CampaignNote = {
        note: trim(note),
        day: campaign.day,
      };
      const r = await addNote({
        variables: {
          campaignId: campaign.id,
          note: newNote,
        }
      });
      if (r.errors?.length) {
        return r.errors[0].message;
      }
    }
    setNote('');
    return undefined;
  }, [note, campaign.id, campaign.day, setNote, addNote]);
  const [updateNotes] = useUpdateCampaignNotesMutation();
  const onUpdateNote = useCallback(async(idx: number, value: CampaignNote) => {
    const newNotes = flatMap(campaign.notes, (n, i) => {
      if (idx === i) {
        if (value.note) {
          return value;
        }
        return [];
      }
      return n;
    });
    await updateNotes({
      variables: {
        campaignId: campaign.id,
        notes: newNotes,
      }
    });
  }, [updateNotes, campaign.notes, campaign.id]);
  const { onOpen, onClose, isOpen } = useDisclosure();
  const [showEditNote, noteModal] = useEditNoteModal(onUpdateNote);
  return (
    <>
      <Flex direction="column">
        <Text fontSize="md">{t`Notes`}</Text>
        <List key="notes-list">
          { map(campaign.notes, (n, idx) => (
            <NoteLine
              key={idx}
              idx={idx}
              note={n}
              onClick={showEditNote}
            />)) }
          { isOpen ? (
            <form onSubmit={e => {
              e.preventDefault();
              onSubmitNewNote();
            }}>
              <Flex direction="row">
                <FormControl>
                  <Input
                    value={note}
                    autoFocus
                    placeholder={t`What happened?`}
                    onChange={e => setNote(e.target.value)}
                  />
                </FormControl>
                <ButtonGroup marginLeft={2}>
                  { !!note && <SubmitIconButton aria-label={t`Save`} onSubmit={onSubmitNewNote} icon={<SlCheck />} /> }
                  <IconButton aria-label={t`Cancel`} icon={<SlClose />} onClick={onClose} />
                </ButtonGroup>
              </Flex>
            </form>
          ) : <Button leftIcon={<SlPlus />} onClick={onOpen}>{t`Add note`}</Button>}
        </List>
      </Flex>
      { noteModal }
    </>
  );
}

interface CalendarEntry {
  day: number;
  guides: string[];
}
const size = 40;

function DayButton({ day, currentDay, onClick }: { day: number; currentDay: number; onClick: (day: number) => void }) {
  const handleClick = useCallback(() => onClick(day), [onClick, day]);
  return (
    <IconButton
      onClick={handleClick}
      borderRadius={`${size / 2}px`}
      variant="ghost"
      aria-label={t`Day ${day}`}
      icon={
        <MoonIconWithDate day={day} currentDay={currentDay} size={size} />
      }
    />
  );
}
interface Weather {
  start: number;
  end: number;
  name: string;
}
function useWeather(): Weather[] {
  return useMemo(() => {
    return [
      {
        start: 1,
        end: 3,
        name: t`A Perfect Day`,
      },
      {
        start: 4,
        end: 7,
        name: t`Downpour`,
      },
      {
        start: 8,
        end: 9,
        name: t`A Perfect Day`,
      },
      {
        start: 10,
        end: 12,
        name: t`Downpour`,
      },
      {
        start: 13,
        end: 14,
        name: t`Howling Winds`,
      },
      {
        start: 15,
        end: 17,
        name: t`Downpour`,
      },
      {
        start: 18,
        end: 20,
        name: t`Howling Winds`,
      },
      {
        start: 21,
        end: 22,
        name: t`A Perfect Day`,
      },
      {
        start: 23,
        end: 25,
        name: t`Downpour`,
      },
      {
        start: 26,
        end: 28,
        name: t`Howling Winds`,
      },
      {
        start: 29,
        end: 30,
        name: t`A Perfect Day`,
      }
    ]
  }, []);
}
const FIXED_GUIDE_ENTRIES: { [day: string]: string[] | undefined } = {
  '1': ['1'],
  '3': ['94.1'],
  '4': ['1.04'],
};

function Timeline({ campaign }: { campaign: ParsedCampaign }) {
  const singleWeatherLabels = useWeather();
  const weatherLabels = useMemo(() => {
    return [
      ...singleWeatherLabels,
      ...(campaign.extended_calendar ?
        singleWeatherLabels.map(weather => {
          return {
            start: weather.start + 30,
            end: weather.end + 30,
            name: weather.name,
          };
        }) : []),
    ];
  }, [campaign.extended_calendar, singleWeatherLabels]);
  const [showDayModal, editDayModal] = useEditDayModal(campaign);
  const entriesByDay = useMemo(() => {
    const r: { [key: string]: string[] | undefined } = {};
    r['1'] = ['1'];
    r['3'] = ['94.1'];
    r['4'] = ['1.04'];
    forEach(campaign.calendar, ({ day, guides }) => {
      if (!r[day]) {
        r[day] = [];
      }
      forEach(guides, g => {
        r[day]?.push(g);
      });
    });
    return r;
  }, [campaign.calendar]);

  return (
    <>
      <Box maxW="100vw">
        <Flex direction="column"  overflowX="scroll" paddingBottom="16px">
          <Flex direction="row" alignItems="flex-end">
            { map(range(1, 31 + (campaign.extended_calendar ? 30 : 0)), (day) => {
              const entries = entriesByDay[day];
              return (
                <Flex key={day} direction="column" marginRight="4px" alignItems="center">
                  { !!entries?.length && (
                    <>
                      <CoreIcon icon="guide" size="18" />
                      <Text textAlign="center" fontSize="xs">{entries.join(', ')}</Text>
                    </>
                  ) }
                  <DayButton
                    onClick={showDayModal}
                    currentDay={campaign.day}
                    day={day}
                  />
                </Flex>
              );
            })}
          </Flex>
          <Flex direction="row" marginTop="4px">
            { map(weatherLabels, ({ start, end, name }) => {
              const current = campaign.day >= start && campaign.day <= end;
              return (
                <Flex
                  key={start}
                  direction="column"
                  minWidth={`${(end - start) * (size + 4) + (size - 10)}px`}
                  marginLeft="5px"
                  marginRight="9px"
                >
                  <Box
                    borderLeftWidth="1px"
                    borderRightWidth="1px"
                    borderBottomLeftRadius="4px"
                    borderBottomRightRadius="4px"
                    borderBottomWidth="1px" height="16px" width="100%"
                    borderColor={current ? 'gray.600' : 'gray.300'}
                  />
                  <Text textAlign="center" fontSize="2xs" fontWeight={current ? '600' : '400'}>
                    {name}
                  </Text>
                </Flex>
              );
            })}
          </Flex>
        </Flex>
      </Box>
      { editDayModal }
    </>
  );
}



export function useShowChooseDeckModal(campaign: ParsedCampaign, refetchCampaign: () => Promise<void>, cards: CardsMap): [() => void, React.ReactNode] {
  const { authUser } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: totalDecks } = useGetMyCampaignDecksTotalQuery({
    variables: {
      userId: authUser?.uid || '',
    },
    skip: !authUser,
  });
  const { data, fetchMore } = useGetMyCampaignDecksQuery({
    variables: {
      userId: authUser?.uid || '',
      limit: 5,
      offset: 0,
    },
    skip: !authUser,
  });

  const fetchDecks = useCallback(async(authUser: AuthUser | undefined, pageSize: number, offset: number): Promise<DeckFragment[]> => {
    if (authUser) {
      const data = await fetchMore({
        variables: {
          userId: authUser.uid,
          limit: pageSize,
          offset,
        },
        updateQuery(_, { fetchMoreResult }) {
          return fetchMoreResult;
        },
      });
      return data.data.decks || [];
    }
    return [];
  }, [fetchMore]);

  const [setDeckCampaign] = useSetDeckCampaignMutation();
  const onChooseDeck = useCallback(async(deck: DeckFragment) => {
    const r = await setDeckCampaign({
      variables: {
        campaignId: campaign.id,
        deckId: deck.id,
      }
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    await refetchCampaign();
    onClose();
    return undefined;
  }, [setDeckCampaign, refetchCampaign, onClose, campaign.id]);
  const showModal = useCallback(() => {
    onOpen();
  }, [onOpen]);
  return [
    showModal,
    <Modal key="deck" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW="600px">
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`Choose deck`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <PaginationWrapper
            total={totalDecks?.total.aggregate?.count}
            pageSize={5}
            data={data?.decks}
            fetchData={fetchDecks}
          >
            { (decks: DeckFragment[]) => (
              <List>
                { map(decks, deck => (
                  <ListItem key={deck.id}>
                    <CompactDeckRow
                      deck={deck}
                      roleCards={cards}
                      onClick={onChooseDeck}
                    />
                  </ListItem>
                )) }
              </List>
            ) }
          </PaginationWrapper>
        </ModalBody>
        <ModalFooter>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}

function CampaignRangersSection({ campaign, cards, showEditFriends, refetchCampaign }: {
  campaign: ParsedCampaign;
  cards: CardsMap;
  showEditFriends: () => void;
  refetchCampaign: () => Promise<void>;
}) {
  const [showChooseDeck, chooseDeckModal] = useShowChooseDeckModal(campaign, refetchCampaign, cards);
  const [removeDeckFromCampaign] = useRemoveDeckCampaignMutation();
  const removeDeck = useCallback(async(deck: DeckFragment) => {
    const r = await removeDeckFromCampaign({
      variables: {
        deckId: deck.id,
        campaignId: campaign.id,
      },
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    await refetchCampaign();
  }, [removeDeckFromCampaign, refetchCampaign, campaign.id]);
  return (
    <>
      <Text>{t`Rangers`}</Text>
      <List>
        { map(campaign.access, user => (
          <CampaignUser
            key={user.id}
            user={user}
            campaign={campaign}
            roleCards={cards}
            showChooseDeck={showChooseDeck}
            removeDeck={removeDeck}
          />
        )) }
        <ListItem>
          <Button variant="ghost" leftIcon={<SlPlus />}  onClick={showEditFriends}>
            { t`Add` }
          </Button>
        </ListItem>
      </List>
      { chooseDeckModal }
    </>
  );
}

function useTravelModal(campaign: ParsedCampaign): [() => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { locations, paths } = useLocale();
  const [camp, setCamp] = useState<boolean>(false);
  const [location, setLocation] = useState<string>();
  const [terrain, setTerrain] = useState<string>();
  const [showAll, setShowAll] = useState(false);

  const currentDay = campaign.day;
  const [campaignTravel] = useCampaignTravelMutation();
  const onTravel = useCallback(async() => {
    if (!location || !terrain) {
      return t`You must choose a location and path terrain to travel.`
    }
    const history: HistoryEntry = {
      day: campaign.day,
      location,
      path_terrain: terrain,
      camped: camp,
    };
    const r = await campaignTravel({
      variables: {
        campaignId: campaign.id,
        day: campaign.day + (camp ? 1 : 0),
        currentLocation: location,
        currentPathTerrain: terrain,
        history,
      }
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    setLocation(undefined);
    setTerrain(undefined);
    setCamp(true);
    onClose();
    return undefined;
  }, [location, terrain, campaign, camp, campaignTravel, setCamp, setLocation, setTerrain, onClose]);
  const currentLocation = campaign.current_location ? locations[campaign.current_location] : undefined;
  const locationName = currentLocation?.name || campaign.current_location;
  const filterLocation = useCallback((loc: MapLocation): boolean => {
    if (loc.cycles && !find(loc.cycles, x => x === campaign.cycle_id)) {
      return false;
    }
    if (currentLocation && loc.id === currentLocation.id) {
      // Must leave a location to travel;
      return false;
    }
    if (showAll) {
      return true;
    }
    if (currentLocation && !find(currentLocation.connections, con => con.id === loc.id)) {
      return false;
    }
    return true;
  }, [showAll, currentLocation, campaign.cycle_id]);

  const onSetLocation = useCallback((value: string) => {
    if (currentLocation) {
      const connection = find(currentLocation.connections, con => con.id === value);
      setTerrain(connection?.path);
    }
    setLocation(value);
  }, [currentLocation, setTerrain, setLocation]);
  const renderPath = useCallback((loc: MapLocation) => {
    if (currentLocation) {
      const connection = find(currentLocation.connections, con => con.id === loc.id);
      if (connection) {
        const path = find(paths, p => p?.id === connection.path);
        if (path) {
          return (
            <Flex direction="row" alignItems="center" marginTop={1}>
              <PathIcon path={path} size={24} />
              <Text marginLeft={2} fontSize="sm">{path.name}</Text>
            </Flex>
          );
        }
      }
    }
    return null;
  }, [currentLocation, paths]);
  const selectedPath = useMemo(() => terrain ? find(paths, p => p?.id === terrain) : undefined, [paths, terrain]);
  return [
    onOpen,
    <Modal key="travel" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          { currentLocation ? (
            <Flex direction="row" alignItems="center">
              <LocationIcon location={currentLocation} size={78} />
              <Text fontSize="3xl" marginLeft={1}>
                {t`Departing ${currentLocation.name}`}
              </Text>
            </Flex>
          ) : (
            <Flex direction="row" alignItems="center" paddingRight={8}>
              <Heading>
                { t`Travel` }
              </Heading>
            </Flex>
          ) }
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={e => {
            e.preventDefault();
            onTravel();
          }}>
            <Stack>
              { !!locationName && !!currentLocation && (
                <Checkbox
                  marginBottom={2}
                  isChecked={showAll}
                  onChange={(event) => {
                    setShowAll(event.target.checked);
                  }}
                >
                  { t`Show all locations` }
                </Checkbox>
              ) }
              <FormControl marginBottom={4}>
                <FormLabel>{showAll ? t`Location` : t`Connecting Location`}</FormLabel>
                <MapLocationSelect
                  value={location}
                  filter={filterLocation}
                  decoration={renderPath}
                  setValue={onSetLocation}
                />
              </FormControl>
              { !!showAll ? (
                <FormControl marginBottom={2}>
                  <FormLabel>{t`Path Terrain`}</FormLabel>
                  <PathTypeSelect value={terrain} setValue={setTerrain} />
                </FormControl>
              ) : (
                selectedPath && (
                  <>
                    <FormLabel>{t`Path Terrain`}</FormLabel>
                    <Flex direction="row" alignItems="center">
                      <PathIcon path={selectedPath} size={42} />
                      <Text marginLeft={2}>{selectedPath.name}</Text>
                    </Flex>
                  </>
                )
              ) }
              <Checkbox
                marginBottom={2}
                isChecked={camp}
                onChange={(event) => {
                  setCamp(event.target.checked);
                }}
              >
                { t`Camp` }
              </Checkbox>
              <Text>
                { !!camp ?
                  t`Camping will end day ${currentDay} and allow any earned rewards to be swapped into decks.` :
                  t`Rangers will continue playing day ${currentDay} with their current decks.`
                }
              </Text>
            </Stack>
          </form>
        </ModalBody>
        <ModalFooter>
          <Flex direction="row" flex={1} justifyContent="flex-end">
            <SubmitButton
              color="blue"
              disabled={!location || !terrain}
              leftIcon={camp ? <FaMoon /> : <FaWalking />}
              onSubmit={onTravel}
            >
              { camp ? t`Travel & Camp` : t`Travel` }
            </SubmitButton>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ]
}

function CycleChiclet({ cycle }: { cycle: CampaignCycle }) {
  const { colors } = useTheme();
  return (
    <Flex direction="row" marginTop={1}>
      <Box padding={2} paddingLeft={4} paddingRight={4} borderRadius="8px" backgroundColor={colors.text}>
        <Text color={colors.inverted}>{cycle.name}</Text>
      </Box>
    </Flex>
  );
}

interface CampaignDetailProps {
  campaign: ParsedCampaign;
  showEditFriends: () => void;
  cards: CardsMap;
  refetchCampaign: () => Promise<void>;
}

export default function CampaignDetail({ campaign, refetchCampaign, showEditFriends, cards }: CampaignDetailProps) {
  const { cycles, locations, paths } = useLocale();
  const [extendCampaign] = useExtendCampaignMutation();
  const onExtendCampaign = useCallback(async() => {
    extendCampaign({
      variables: {
        campaignId: campaign.id,
      },
    });
  }, [extendCampaign, campaign]);
  const [setCampaignTitle] = useSetCampaignTitleMutation();
  const cycle = useMemo(() => find(cycles, c => c.id === campaign.cycle_id), [cycles, campaign.cycle_id]);
  const [showHistory, historyModal] = useJourneyModal(campaign);
  const [onTravel, travelModal] = useTravelModal(campaign);
  const [onUndo, undoEnabled, undoModal] = useUndoModal(campaign);
  const [onEndDay, endDayModal] = useEndDayModal(campaign);
  const currentLocation = campaign.current_location ? locations[campaign.current_location] : undefined;
  const currentPath = campaign.current_path_terrain ? paths[campaign.current_path_terrain] : undefined;
  const onTitleChange = useCallback(async (title: string) => {
    await setCampaignTitle({
      variables: {
        campaignId: campaign.id,
        name: title,
      },
    });
  }, [campaign.id, setCampaignTitle]);
  const buttonOrientation = useBreakpointValue<'vertical' | 'horizontal'>(['vertical', 'vertical', 'horizontal'])

  return (
    <>
      <PageHeading
        title={campaign.name}
        titleNode={<EditableTextInput
          value={campaign.name}
          hideEditButton
          onChange={onTitleChange}
        />}
        subHeader={!!cycle ? <CycleChiclet cycle={cycle} /> : undefined}
      >
        <ButtonGroup orientation={buttonOrientation}>
          <Button leftIcon={<FaWalking />} onClick={onTravel}>{t`Travel`}</Button>
          <Button leftIcon={<FaMoon />} onClick={onEndDay}>{t`End the day`}</Button>
          { !!undoEnabled && <Button variant="ghost" leftIcon={<FaUndo />} onClick={onUndo}>{t`Undo`}</Button> }
          { (campaign.day === 30 && !campaign.extended_calendar) && (
          <SolidButton color="blue" onClick={onExtendCampaign}>
            {t`Extend campaign`}
          </SolidButton>
        )}
        </ButtonGroup>
      </PageHeading>
      <Timeline campaign={campaign} />
      <SimpleGrid columns={[1,1,1,2]} spacingY="2em" spacingX="1em">
        <Flex direction="column" paddingLeft={[1,1,2]}>
          <Box
            marginBottom={2}
            paddingLeft={4}
            paddingRight={2}
            paddingTop={2}
            paddingBottom={2}
            borderRadius="8px"
            borderWidth={2}
            borderColor="gray.500"
            width="100%"
          >
            <Flex direction="row" alignItems="center" justifyContent="center">
              <Text textAlign="center" fontSize="lg" fontWeight="600">
                { t`Current Position` }
              </Text>
            </Flex>
            <Box marginBottom={4}>
              <Text marginBottom={2}>{t`Location`}</Text>
              { !!currentLocation && (
                <Flex direction="row" alignItems="center">
                  <LocationIcon location={currentLocation} size={64} />
                  <Flex direction="column" marginLeft={2} justifyContent="center" alignItems="flex-start">
                    <Text>{currentLocation.name}</Text>
                  </Flex>
                </Flex>
              ) }
            </Box>
            <Box marginBottom={2}>
              <Text marginBottom={2}>{t`Path Terrain`}</Text>
              { !!currentPath ? (
                <Flex direction="row" alignItems="center">
                  <Box marginLeft={1} marginRight={3}>
                    <PathIcon path={currentPath} size={48} />
                  </Box>
                  <Text marginLeft={2}>{currentPath.name}</Text>
                </Flex>
              ) : <Text fontStyle="italic">{t`None`}</Text>}
            </Box>
            <ButtonGroup>
              <Button leftIcon={<FaWalking />} onClick={onTravel}>{t`Travel`}</Button>
              { (campaign.day > 1 || campaign.history.length > 0) && (
                <Button leftIcon={<FaCalendar />} onClick={showHistory}>{t`Recorded journey`}</Button>
              ) }
            </ButtonGroup>
          </Box>
          <CampaignRangersSection
            campaign={campaign}
            cards={cards}
            showEditFriends={showEditFriends}
            refetchCampaign={refetchCampaign}
          />
        </Flex>
        <Tabs paddingRight={2}>
          <TabList>
            <Tab>{t`Missions`}</Tab>
            <Tab>{t`Rewards`}</Tab>
            <Tab>{t`Notable Events`}</Tab>
            <Tab>{t`Removed Cards`}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <MissionsTab campaign={campaign} />
            </TabPanel>
            <TabPanel>
              <RewardsTab campaign={campaign} cards={cards} />
            </TabPanel>
            <TabPanel>
              <EventsTab campaign={campaign} />
            </TabPanel>
            <TabPanel>
              <RemovedTab campaign={campaign} />
            </TabPanel>
          </TabPanels>
        </Tabs>
        <NotesTab campaign={campaign} />
      </SimpleGrid>
      { travelModal }
      { historyModal }
      { endDayModal }
      { undoModal }
    </>
  );
}

export function useEditCampaignAccessModal(
  campaign: ParsedCampaign | undefined | null,
  updateAccess: (selection: string[]) => Promise<string | undefined>
): [() => void, React.ReactNode] {
  const { authUser } = useAuth();
  const { data, refetch } = useGetProfileQuery({
    variables: {
      id: authUser?.uid || '',
    },
    skip: !authUser,
  });

  const refreshProfile = useCallback(() => {
    if (authUser) {
      refetch({
        id: authUser.uid,
      });
    };
  }, [refetch, authUser]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedFriends, setSelectedFriends] = useState(flatMap(campaign?.access, user => user.id || []));
  useEffect(() => {
    setSelectedFriends(flatMap(campaign?.access, user => user.id || []));
  }, [setSelectedFriends, campaign?.access]);
  const onAdd = useCallback(async(id: string) => {
    setSelectedFriends(uniq([
      ...selectedFriends,
      id,
    ]));
    return undefined;
  }, [selectedFriends, setSelectedFriends]);
  const hasChanges = useMemo(() => {
    const original = flatMap(campaign?.access, user => user.id || []);
    return !!(difference(original, selectedFriends).length || difference(selectedFriends, original).length);
  }, [selectedFriends, campaign?.access]);
  const onRemove = useCallback(async(id: string) => {
    setSelectedFriends(filter(selectedFriends, f => f !== id));
    return undefined;
  }, [selectedFriends, setSelectedFriends]);

  const onSubmit = useCallback(async() => {
    const result = await updateAccess(selectedFriends);
    if (!result) {
      onClose();
    }
    return result;
  }, [selectedFriends, updateAccess, onClose]);
  return [
    onOpen,
    <Modal key="access" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`Edit players`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FriendChooser
            noBorder
            profile={data?.profile || undefined}
            selection={selectedFriends}
            add={onAdd}
            refreshProfile={refreshProfile}
            remove={onRemove}
          />
        </ModalBody>
        <ModalFooter>
          {!!hasChanges && <SubmitButton color="blue" onSubmit={onSubmit}>{t`Save`}</SubmitButton> }
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}

export function useNewCampaignModal(): [() => void, React.ReactNode] {
  const { authUser } = useAuth();
  const [name, setName] = useState('');
  const { data, refetch } = useGetProfileQuery({
    variables: {
      id: authUser?.uid || '',
    },
    skip: !authUser,
  });

  const refreshProfile = useCallback(() => {
    if (authUser) {
      refetch({
        id: authUser.uid,
      });
    };
  }, [refetch, authUser]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [createCampaign] = useCreateCampaignMutation();
  const [addFriendToCampaign] = useAddFriendToCampaignMutation();
  const [error, setError] = useState<string | undefined>();
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const onAdd = useCallback(async(id: string) => {
    setSelectedFriends(uniq([
      ...selectedFriends,
      id,
    ]));
    return undefined;
  }, [selectedFriends, setSelectedFriends]);
  const onRemove = useCallback(async(id: string) => {
    setSelectedFriends(filter(selectedFriends, f => f !== id));
    return undefined;
  }, [selectedFriends, setSelectedFriends]);
  const [cycle, setCycle] = useState<string>('core');
  const onCreateCampaign = useCallback(async() => {
    if (!authUser) {
      return;
    }
    setError(undefined);
    const result = await createCampaign({
      variables: {
        name,
        cycleId: cycle,
        currentLocation: STARTING_LOCATIONS[cycle],
      },
    });
    if (result.errors?.length) {
      setError(result.errors[0].message);
      return undefined;
    }
    if (!result.data?.campaign) {
      setError(t`Unable to create campaign at this time.`);
      return undefined;
    }
    const campaignId = result.data.campaign.id;
    for (let i = 0; i < selectedFriends.length; i++) {
      const userId = selectedFriends[i];
      const fResult = await addFriendToCampaign({
        variables: {
          userId,
          campaignId,
        },
      });
      if (fResult.errors?.length) {
        setError(fResult.errors[0].message);
      }
    }
    Router.push(`/campaigns/${campaignId}`);
    onClose();
    return undefined;
  }, [createCampaign, addFriendToCampaign, onClose, cycle, selectedFriends, authUser, name]);
  const showModal = useCallback(() => {
    onOpen();
  }, [onOpen]);
  return [
    showModal,
    <Modal key="campaign" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Box paddingRight={8}>
            <Heading>{t`New campaign`}</Heading>
          </Box>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={e => {
            e.preventDefault();
            onCreateCampaign();
          }}>
            <FormControl marginBottom={4} isRequired>
              <FormLabel>{t`Name`}</FormLabel>
              <Input
                type="name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </FormControl>
            <FormControl marginBottom={4} isRequired>
              <FormLabel>{t`Campaign`}</FormLabel>
              <Select
                onChange={(event) => setCycle(event.target.value)}
                placeholder={t`Select campaign`}
                value={cycle}
              >
                <option value="demo">{t`Demo`}</option>
                <option value="core">{t`Core`}</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>{t`Players`}</FormLabel>
              <FriendChooser
                profile={data?.profile || undefined}
                selection={selectedFriends}
                add={onAdd}
                refreshProfile={refreshProfile}
                remove={onRemove}
              />
            </FormControl>
          </form>
        </ModalBody>
        <ModalFooter>
          <Flex direction="row" flex={1} justifyContent="flex-end">
            <SubmitButton
              color="blue"
              disabled={!name}
              onSubmit={onCreateCampaign}
            >
              {t`Create`}
            </SubmitButton>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}
