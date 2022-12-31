import { Button, Box, Tabs, TabList, Tab, TabPanels, TabPanel, Text, Tr, Td, Flex, FormControl, FormLabel, Heading, Input, List, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, IconButton, ButtonGroup, SimpleGrid, TableContainer, Table, Thead, Th, Tbody, AspectRatio, Checkbox, useColorMode, useColorModeValue, Tooltip } from '@chakra-ui/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { plural, t } from '@lingui/macro';
import { forEach, uniq, filter, map, find, flatMap, difference, values, sortBy, range, trim } from 'lodash';
import NextLink from 'next/link';
import Router from 'next/router';

import { CampaignFragment, CardFragment, DeckFragment, useAddCampaignEventMutation, useAddCampaignMissionMutation, useAddCampaignRemovedMutation, useAddFriendToCampaignMutation, useCreateCampaignMutation, useDeleteCampaignMutation, useGetMyCampaignDecksQuery, useGetMyCampaignDecksTotalQuery, useGetProfileQuery, useLeaveCampaignMutation, useRemoveDeckCampaignMutation, UserInfoFragment, useSetCampaignCalendarMutation, useSetCampaignDayMutation, useSetCampaignLocationMutation, useSetCampaignMissionsMutation, useSetCampaignPathTerrainMutation, useSetDeckCampaignMutation, useUpdateCampaignEventsMutation, useUpdateCampaignRemovedMutation, useUpdateCampaignRewardsMutation } from '../generated/graphql/apollo-schema';
import { useAuth } from '../lib/AuthContext';
import SolidButton from './SolidButton';
import FriendChooser from './FriendChooser';
import ListHeader from './ListHeader';
import CoreIcon from '../icons/CoreIcon';
import { CompactDeckRow } from './Deck';
import { CardsMap } from '../lib/hooks';
import SubmitButton, { SubmitIconButton } from './SubmitButton';
import { SlCheck, SlMinus, SlPlus } from 'react-icons/sl';
import { useLocale } from '../lib/TranslationProvider';
import { CardRow } from './Card';
import EditableTextInput from './EditableTextInput';
import PageHeading from './PageHeading';
import PaginationWrapper from './PaginationWrapper';
import { AuthUser } from '../lib/useFirebaseAuth';
import { RoleImage } from './CardImage';
import useDeleteDialog from './useDeleteDialog';
import { FaTrash } from 'react-icons/fa';
import { useTheme } from '../lib/ThemeContext';
import PathTypeSelect from './PathTypeSelect';
import { LocationIcon, PathIcon } from '../icons/LocationIcon';
import MapLocationSelect from './MapLocationSelect';
import CardSetSelect from './CardSetSelect';

interface MissionEntry {
  day: number;
  name: string;
  progress?: number;
  completed?: boolean;
}

interface LatestDeck {
  user: UserInfoFragment;
  deck: DeckFragment;
}

interface NotableEvent {
  event: string;
  crossed_out?: boolean;
}

interface RemovedEntry {
  set_id?: string;
  name: string;
}

export interface ParsedCampaign {
  id: number;
  name: string;
  day: number;
  user_id: string;

  access: UserInfoFragment[];

  missions: MissionEntry[];
  calendar: CalendarEntry[];
  events: NotableEvent[];
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

  access: UserInfoFragment[];

  events: NotableEvent[];
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

    this.missions = Array.isArray(campaign.missions) ? (campaign.missions as MissionEntry[]) : [];
    this.calendar = Array.isArray(campaign.calendar) ? (campaign.calendar as CalendarEntry[]) : [];
    this.rewards = Array.isArray(campaign.rewards) ? (campaign.rewards as string[]) : [];
    this.events = Array.isArray(campaign.events) ? (campaign.events as NotableEvent[]) : [];
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
  const { colors } = useTheme();
  return (
    <ListItem padding={2} borderBottomWidth="1px" borderColor={colors.divider}>
      <Flex direction="row">
        <Flex flex={1} direction="row" justifyContent="space-between" as={NextLink} href={`/campaigns/${campaign.id}`}>
          <Flex direction="column">
            <Flex direction="row" alignItems="flex-end">
              <Text fontSize="lg" fontWeight="600">{campaign.name}</Text>
              <Text marginLeft="2em">{t`Day ${campaign.day}`}</Text>
            </Flex>
            <Flex direction="row">
              <CoreIcon icon="ranger" size="22" />
              <Text marginLeft={2}>{ filter(map(campaign.access, a => a.handle || ''), x => !!x).join(', ')}</Text>
            </Flex>
          </Flex>
          <Flex direction="row">
            { flatMap(roles, card => card.imagesrc ? <RoleImage key={card.id} name={card.name} url={card.imagesrc} /> : [])}
          </Flex>
        </Flex>
        <ButtonGroup>
          { !!onDelete ? <IconButton aria-label={t`Delete`} icon={<FaTrash />} color="red.500" variant="ghost" onClick={onDeleteClick} /> : <IconButton aria-label={t`Delete`} disabled color="transparent" variant="ghost" /> }
        </ButtonGroup>
      </Flex>
    </ListItem>
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
      <List>
        { map(campaigns, c => (
          <CampaignRow
            key={c.id}
            campaign={c}
            roleCards={roleCards}
            onDelete={authUser?.uid === c.user_id ? onDelete : undefined}
          />)
        ) }
      </List>
      { deleteDialog }
    </>
  )
}

function CampaignUser({ user, campaign, roleCards, showChooseDeck, removeDeck }: { user: UserInfoFragment; campaign: ParsedCampaign; roleCards: CardsMap; showChooseDeck: () => void; removeDeck: (deck: DeckFragment) => void }) {
  const { authUser } = useAuth();
  const deck = useMemo(() => find(campaign.latest_decks, d => d.user?.id === user.id)?.deck, [campaign.latest_decks, user.id]);
  const onRemove = useCallback(() => {
    !!deck && removeDeck(deck);
  }, [removeDeck, deck]);
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
      <Flex direction="row">
        { deck ? (
          <CompactDeckRow
            deck={deck}
            roleCards={roleCards}
            href={`/decks/view/${deck.id}`}
            buttons={authUser?.uid === deck.user_id && (
              <ButtonGroup marginTop={1}>
                <Button onClick={onRemove} variant="ghost">
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
        ) : (
          <Text>
            <CoreIcon icon="ranger" size={18} />&nbsp;
            { user.handle || (user.id === authUser?.uid ? t`You` : user.id) }
          </Text>
        ) }
      </Flex>
      { authUser?.uid === user.id && !deck && (
        <ButtonGroup marginTop={1}>
          <Button onClick={showChooseDeck} variant="ghost">
            { t`Choose deck` }
          </Button>
          { authUser.uid !== campaign.user_id && (
            <Button onClick={leaveCampaign} variant="ghost" color="red.500">
              { t`Leave campaign` }
            </Button>
          ) }
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
  const onSubmit = useCallback(async() => {
    if (!day) {
      return;
    }
    const newEntry: CalendarEntry = {
      day,
      guides: filter(map(entries, e => trim(e)), x => !!x),
    };
    const calendar: CalendarEntry[] = [
      ...flatMap(campaign.calendar, c => {
        if (c.day === day) {
          return [];
        }
        return c;
      }),
      ...(newEntry.guides.length ? [newEntry] : []),
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
    onClose();
    return undefined;
  }, [setCalendar, day, entries, campaign.id, campaign.calendar, onClose]);
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
  const [setCampaignDay] = useSetCampaignDayMutation();
  const onAdvanceTime = useCallback(async(): Promise<string | undefined> => {
    const r = await setCampaignDay({
      variables: {
        campaignId: campaign.id,
        day: day + 1,
      },
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    onClose();
    return undefined;
  }, [campaign, onClose, day, setCampaignDay]);
  const onRollbackTime = useCallback(async(): Promise<string | undefined> => {
    const r = await setCampaignDay({
      variables: {
        campaignId: campaign.id,
        day,
      },
    });
    if (r.errors?.length) {
      return r.errors[0].message;
    }
    onClose();
    return undefined;
  }, [campaign, onClose, day, setCampaignDay]);
  const editable = day >= campaign.day;
  const dayChange = (day - campaign.day + 1);
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
            )}
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
          <FormControl>
            { editable ? (
              <>
                <Text>{t`Mark day ${day} as complete.`}</Text>
                { dayChange > 1 && (
                  <Text>
                    { plural(dayChange, {
                      one: `This will advance the calendar ${dayChange} day.`,
                      other: `This will advance the calendar ${dayChange} days.`,
                    }) }
                  </Text>
                ) }
                <SubmitButton marginTop={1} color="blue" onSubmit={onAdvanceTime}>
                  { t`Finish day` }
                </SubmitButton>
              </>
            ) : (
              <>
                <SubmitButton marginTop={1} color="blue" onSubmit={onRollbackTime}>
                  { t`Rollback time to here` }
                </SubmitButton>
              </>
            ) }
          </FormControl>
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


function useEditMissionModal(campaign: ParsedCampaign): [(mission: MissionEntry, index: number) => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [current, setCurrent] = useState<{ mission: MissionEntry; index: number } | undefined>();

  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  const showModal = useCallback(async(mission: MissionEntry, index: number) => {
    setCurrent({ mission, index });
    setName(mission.name);
    setDay(`${mission.day}`);
    setProgress(mission.progress || 0);
    setCompleted(mission.completed || false);
    onOpen();
  }, [setName, setDay, setProgress, setCompleted, setCurrent, onOpen]);

  const hasChanges = useMemo(() => {
    return !!current && (
      trim(current.mission.name) !== trim(name) ||
      current.mission.day !== parseInt(trim(day)) ||
      (current.mission.progress || 0) !== progress ||
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
      progress,
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
                  const checked = progress > p;
                  return (
                    <IconButton
                      key={p}
                      aria-label={t`Progress ${progressNumber}`}
                      variant="ghost"
                      icon={<ProgressChit filled={checked} />}
                      onClick={() => setProgress(checked ? p : p + 1)}
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
          { map(range(0, 3), (idx) => <ProgressChit marginRight="6px" key={idx} filled={(mission.progress || 0) > idx} />)}
        </Flex>
      </Td>
    </Tr>
  )
}

function MissionsTab({ campaign }: { campaign: ParsedCampaign }) {
  const [showAddMission, addMissionModal] = useAddMissionModal(campaign);
  const [showEditMission, editMissionModal] = useEditMissionModal(campaign);
  return (
    <>
      <TableContainer marginBottom={2}>
        <Table variant="simple">
          <Thead>
            <Th>{t`Day`}</Th>
            <Th>{t`Name`}</Th>
            <Th>{t`Progress`}</Th>
          </Thead>
          <Tbody>
            { map(campaign.missions, (mission, idx) => (
              <MissionRow key={idx} mission={mission} index={idx} showEdit={showEditMission} />
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Button leftIcon={<SlPlus />} onClick={showAddMission}>{t`Add mission`}</Button>
      { addMissionModal }
      { editMissionModal }
    </>
  );
}

function RemoveRow({ remove, index, onRemove }: { remove: RemovedEntry; index: number; onRemove: (index: number) => Promise<string | undefined> }) {
  const { paths, locations } = useLocale();
  const removeEntry = useCallback(() => {
    return onRemove(index);
  }, [index, onRemove]);
  const path = remove.set_id && paths[remove.set_id];
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
        {t`Use this section to track cards that are removed permanently from the path decks.`}
      </Text>
      <TableContainer marginBottom={2}>
        <Table variant="simple">
          <Thead>
            <Th>{t`Set`}</Th>
            <Th>{t`Name`}</Th>
            <Th/>
          </Thead>
          <Tbody>
            { map(campaign.removed, (remove, idx) => (
              <RemoveRow key={idx} remove={remove} index={idx} onRemove={onRemove} />
            ))}
          </Tbody>
        </Table>
      </TableContainer>
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
    </>
  );
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
    <Modal key="deck" isOpen={isOpen} onClose={onClose}>
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
  const [showEditEvent, eventModal] = useEditEventModal(onUpdateEvent);
  return (
    <>
      <List>
        <form onSubmit={e => {
          e.preventDefault();
          onSubmitNewEvent();
        }}>
          <Flex direction="row">
            <Input
              value={event}
              placeholder={t`What happened?`}
              onChange={e => setEvent(e.target.value)}
            />
            { !!event && (
              <ButtonGroup marginLeft={2}>
                <SubmitIconButton aria-label={t`Save`} onSubmit={onSubmitNewEvent} icon={<SlCheck />} />
              </ButtonGroup>
            ) }
          </Flex>
        </form>
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

interface CalendarEntry {
  day: number;
  guides: string[];
}
const size = 40;

function DayButton({ day, currentDay, onClick }: { day: number; currentDay: number; onClick: (day: number) => void }) {
  const handleClick = useCallback(() => onClick(day), [onClick, day]);
  return (
    <IconButton onClick={handleClick} borderRadius={`${size / 2}px`} variant="ghost" aria-label={t`Day ${day}`} icon={
      <AspectRatio key={day} minWidth={`${size}px`} ratio={1}>
        <Box borderRadius={`${size / 2}px`}
          borderWidth={currentDay === day ? '3px' : '1px'}
          borderColor="gray.500"
          backgroundColor={currentDay > day ? 'gray.200' : undefined}
        >
          <Text
            color={currentDay > day ? 'gray.500' : undefined}
            fontWeight={currentDay <= day ? '600' : '400'}
            textDecorationLine={currentDay > day ? 'line-through' : undefined}
          >&nbsp;{day}&nbsp;</Text>
        </Box>
      </AspectRatio>
    } />
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
  const weatherLabels = useWeather();
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
            { map(range(1, 31), (day) => {
              const entries = entriesByDay[day];

              return (
                <Flex key={day} direction="column" marginRight="4px" alignItems="center">
                  { !!entries?.length && (
                    <>
                      <CoreIcon icon="guide" size="18" />
                      <Text textAlign="center" fontSize="xs">{entries.join(', ')}</Text>
                    </>
                  ) }
                  <DayButton onClick={showDayModal} currentDay={campaign.day} day={day} />
                </Flex>
              );
            })}
          </Flex>
          <Flex direction="row" marginTop="4px">
            { map(weatherLabels, ({ start, end, name }) => {
              const current = campaign.day >= start && campaign.day <= end;
              return (
                <Flex direction="column" minWidth={`${(end - start) * (size + 4) + (size - 10)}px`} marginLeft="5px" marginRight="9px">
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

  const fetchDecks = useCallback(async(authUser: AuthUser, pageSize: number, offset: number): Promise<DeckFragment[]> => {
    if (authUser) {
      const data = await fetchMore({
        variables: {
          userId: authUser.uid,
          limit: pageSize,
          offset,
        },
        updateQuery(_, { fetchMoreResult }) {
          console.log(fetchMoreResult);
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

export default function CampaignDetail({ campaign, refetchCampaign, showEditFriends, cards }: { campaign: ParsedCampaign; showEditFriends: () => void; cards: CardsMap; refetchCampaign: () => Promise<void> }) {
  const { locations } = useLocale();

  const [setCampaignLocationMutation] = useSetCampaignLocationMutation();
  const setCampaignLocation = useCallback(async(value: string) => {
    setCampaignLocationMutation({
      variables: {
        campaignId: campaign.id,
        location: value,
      },
    });
  }, [setCampaignLocationMutation, campaign.id]);
  const [setCampaignPathTerrainMutation] = useSetCampaignPathTerrainMutation();
  const setCampaignTerrain = useCallback(async(value: string) => {
    setCampaignPathTerrainMutation({
      variables: {
        campaignId: campaign.id,
        terrain: value,
      },
    });
  }, [setCampaignPathTerrainMutation, campaign.id]);
  const { colors } = useTheme();
  return (
    <>
      <PageHeading title={campaign.name} />
      <Timeline campaign={campaign} />
      <SimpleGrid columns={[1,1,1,2]} spacingY="2em" spacingX="1em">
        <Flex direction="column" paddingLeft={[1,1,2]}>
          <CampaignRangersSection
            campaign={campaign}
            cards={cards}
            showEditFriends={showEditFriends}
            refetchCampaign={refetchCampaign}
          />
          <Box
            marginTop={2}
            marginBottom={2}
            padding={2}
            borderRadius="8px"
            borderWidth={2}
            borderColor="gray.500"
            maxW="24rem"
          >
            <Text textAlign="center" fontSize="lg" fontWeight="600">
              {t`Current Position`}
            </Text>
            <FormControl marginBottom={4}>
              <FormLabel>{t`Location`}</FormLabel>
              <MapLocationSelect value={campaign.current_location} setValue={setCampaignLocation} />
            </FormControl>
            <FormControl marginBottom={2}>
              <FormLabel>{t`Path Terrain`}</FormLabel>
              <PathTypeSelect value={campaign.current_path_terrain} setValue={setCampaignTerrain} />
            </FormControl>
          </Box>
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
      </SimpleGrid>
    </>
  )
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
            profile={data?.profile || undefined}
            selection={selectedFriends}
            add={onAdd}
            refreshProfile={refreshProfile}
            remove={onRemove}
            title={t`Players`}
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
  const [submitting, setSubmitting] = useState(false);
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
  const onCreateCampaign = useCallback(async() => {
    if (!authUser) {
      return;
    }
    setSubmitting(true);
    setError(undefined);
    const result = await createCampaign({
      variables: {
        name,
      },
    });
    if (result.errors?.length) {
      setError(result.errors[0].message);
      setSubmitting(false);
      return;
    }
    if (!result.data?.campaign) {
      setError(t`Unable to create campaign at this time.`);
      setSubmitting(false);
      return;
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
        setSubmitting(false);
      }
    }
    setSubmitting(false);
    Router.push(`/campaigns/${campaignId}`);
    onClose();
  }, [createCampaign, addFriendToCampaign, selectedFriends, onClose, authUser, name]);
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
            <FormControl marginBottom={4}>
              <FormLabel>{t`Name`}</FormLabel>
              <Input
                type="name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </FormControl>
            <FriendChooser
              profile={data?.profile || undefined}
              selection={selectedFriends}
              add={onAdd}
              refreshProfile={refreshProfile}
              remove={onRemove}
              title={t`Players`}
            />
          </form>
        </ModalBody>
        <ModalFooter>
          <Flex direction="row" flex={1} justifyContent="flex-end">
            <SolidButton
              color="blue"
              isLoading={submitting}
              disabled={!name}
              onClick={onCreateCampaign}
            >
              {t`Create`}
            </SolidButton>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  ];
}
