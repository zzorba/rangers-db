import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  Box, Text, Tabs, TabList, Tab, TabPanels, TabPanel,
  Tr, Td, Flex, Heading, List, ListItem, 
  SimpleGrid, TableContainer, Table, Thead,
  Th, Tbody, AspectRatio, useColorModeValue, useBreakpointValue, Divider,
  Button, ButtonGroup, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, useDisclosure,
} from '@chakra-ui/react';
import { t } from '@lingui/macro';
import {
  forEach, filter, map, find, flatMap, values, sortBy, range, last,
} from 'lodash';
import NextLink from 'next/link';

import {
  CampaignFragment, CardFragment, DeckFragment, UserInfoFragment,
} from '../generated/graphql/apollo-schema';
import { CardsMap, useMapLocations } from '../lib/hooks';
import { useLocale } from '../lib/TranslationProvider';
import { CardRow } from './Card';
import PageHeading from './PageHeading';
import { RoleImage } from './CardImage';
import { FaArrowRight, FaCalendar, FaMoon, FaSun } from 'react-icons/fa';
import { GiCampingTent } from 'react-icons/gi';
import { useTheme } from '../lib/ThemeContext';
import { LocationIcon, PathIcon } from '../icons/LocationIcon';
import { CampaignCycle, MapLocation, MapLocations } from '../types/types';
import MoonIconWithDate, { MoonIcon } from '../icons/MoonIcon';
import CoreIcon from '../icons/CoreIcon';
import { CompactDeckRow } from './Deck';
import ListHeader from './ListHeader';

const STARTING_LOCATIONS: { [campaign: string]: string } = {
  demo: 'lone_tree_station',
  core: 'lone_tree_station',
  loa: 'lone_tree_station',
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

interface CalendarEntry {
  day: number;
  guides: string[];
}

export const CampaignViewContext = React.createContext<{ locations: MapLocations }>({ locations: {} });

export interface ParsedCampaign {
  id: number;
  name: string;
  day: number;
  user_id: string;
  cycle_id: string;
  extended_calendar: boolean;

  expansions: string[];
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
  previous_campaign?: {
    id: number;
  }
  next_campaign?: {
    id: number;
  }
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
  expansions: string[];

  previous_campaign?: {
    id: number;
  }
  next_campaign?: {
    id: number;
  }

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
    this.expansions = Array.isArray(campaign.expansions) ? (campaign.expansions as string[]) : [];

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
    this.previous_campaign = campaign.previous_campaign ? {
      id: campaign.previous_campaign.id,
    } : undefined;
    this.next_campaign = campaign.next_campaign_id ? {
      id: campaign.next_campaign_id,
    } : undefined;
  }
}

// ============================================
// VIEW-ONLY COMPONENTS
// ============================================

function CampaignUserViewOnly({ user, campaign }: { user: UserInfoFragment; campaign: ParsedCampaign }) {
  const decks = useMemo(() => map(filter(campaign.latest_decks, d => d.user?.id === user.id), d => d.deck), [campaign.latest_decks, user.id]);
  
  return (
    <ListItem key={user.id} padding={2} flexDirection="column">
      <Flex direction="column">
        { !!decks.length ? map(decks, deck => (
          <Flex direction="row" key={deck.id}>
            <CompactDeckRow
              deck={deck}
              href={`/decks/view/${deck.id}`}
            >
              <Text>
                <CoreIcon icon="ranger" size={18} />&nbsp;
                { user.handle || user.id }
              </Text>
            </CompactDeckRow>
          </Flex>
        )) : (
          <Flex direction="row">
            <Text>
              <CoreIcon icon="ranger" size={18} />&nbsp;
              { user.handle || user.id }
            </Text>
          </Flex>
        ) }
      </Flex>
    </ListItem>
  );
}

function RewardRowViewOnly({ card }: { card: CardFragment }) {
  return (
    <CardRow card={card} />
  );
}

function RewardsTabViewOnly({ campaign, cards }: { campaign: ParsedCampaign; cards: CardsMap }) {
  const unlockedRewards = useMemo(() => {
    return flatMap(campaign.rewards, (code) => {
      return cards[code] || [];
    });
  }, [campaign.rewards, cards]);

  return (
    <List>
      <ListHeader title={t`Available Rewards`} />
      { unlockedRewards.length > 0 ? (
        map(unlockedRewards, c => <RewardRowViewOnly key={c.code} card={c} />)
      ) : (
        <ListItem padding={2}>
          <Text fontStyle="italic">{t`No rewards unlocked yet.`}</Text>
        </ListItem>
      )}
    </List>
  );
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

function MissionRowViewOnly({ mission }: { mission: MissionEntry }) {
  return (
    <Tr>
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
          ) : map(range(0, 3), (idx) => (
            <ProgressChit 
              marginRight="6px" 
              key={idx} 
              filled={mission.checks ? mission.checks[idx] : ((mission.progress || 0) > idx)} 
            />
          ))}
        </Flex>
      </Td>
    </Tr>
  );
}

function MissionsTabViewOnly({ campaign }: { campaign: ParsedCampaign }) {
  const missions = useMemo(() =>
    sortBy(campaign.missions, mission => mission.completed ? 1 : 0),
  [campaign.missions]);

  return (
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
          { missions.length > 0 ? (
            map(missions, (mission, index) => (
              <MissionRowViewOnly key={index} mission={mission} />
            ))
          ) : (
            <Tr>
              <Td colSpan={3}>
                <Text fontStyle="italic">{t`No missions recorded yet.`}</Text>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

function RemoveRowViewOnly({ remove }: { remove: RemovedEntry }) {
  const { paths, generalSets } = useLocale();
  const { locations } = useContext(CampaignViewContext);
  
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
            <Text marginLeft={2} fontSize="sm" style={{ fontVariantCaps: 'small-caps' }}>{location.name}</Text>
          </Flex>
        ) }
      </Td>
      <Td>
        <Text fontSize="lg">
          { remove.name }
        </Text>
      </Td>
    </Tr>
  );
}

function RemovedTabViewOnly({ campaign }: { campaign: ParsedCampaign }) {
  return (
    <>
      <Text marginBottom={2}>
        { t`Cards that have been permanently removed from the path deck.` }
      </Text>
      <TableContainer marginBottom={2}>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>{t`Set`}</Th>
              <Th>{t`Name`}</Th>
            </Tr>
          </Thead>
          <Tbody>
            { campaign.removed.length > 0 ? (
              map(campaign.removed, (remove, idx) => (
                <RemoveRowViewOnly key={idx} remove={remove} />
              ))
            ) : (
              <Tr>
                <Td colSpan={2}>
                  <Text fontStyle="italic">{t`No cards removed yet.`}</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
}

function EventsTabViewOnly({ campaign }: { campaign: ParsedCampaign }) {
  return (
    <List>
      { campaign.events.length > 0 ? (
        map(campaign.events, (event, idx) => (
          <ListItem key={idx} paddingTop={2} paddingBottom={2}>
            <Text 
              padding={2} 
              borderBottomWidth={1} 
              borderColor="gray.500" 
              textDecorationLine={event.crossed_out ? 'line-through' : undefined}
            >
              { event.event }
            </Text>
          </ListItem>
        ))
      ) : (
        <ListItem padding={2}>
          <Text fontStyle="italic">{t`No notable events recorded yet.`}</Text>
        </ListItem>
      )}
    </List>
  );
}

function NotesTabViewOnly({ campaign }: { campaign: ParsedCampaign }) {
  return (
    <Flex direction="column">
      <Text fontSize="md">{t`Notes`}</Text>
      <List key="notes-list">
        { campaign.notes.length > 0 ? (
          map(campaign.notes, (note, idx) => (
            <ListItem key={idx} paddingTop={2} paddingBottom={2}>
              <Text 
                padding={2} 
                borderBottomWidth={1} 
                borderColor="gray.500" 
                textDecorationLine={note.crossed_out ? 'line-through' : undefined}
              >
                { note.note }
              </Text>
            </ListItem>
          ))
        ) : (
          <ListItem padding={2}>
            <Text fontStyle="italic">{t`No notes recorded yet.`}</Text>
          </ListItem>
        )}
      </List>
    </Flex>
  );
}

// ============================================
// WEATHER
// ============================================

interface Weather {
  start: number;
  end: number;
  name: string;
  valley_id: string;
  underground?: string;
  underground_id?: string;
}

function useWeather(cycle_id: string, extendedCampaign: boolean): {
  weather: Weather[];
  maxDay: number;
} {
  return useMemo(() => {
    if (cycle_id === 'loa') {
      return {
        weather: [
          { start: 1, end: 3, name: t`Downpour`, underground: t`Enveloping Silence`, valley_id: 'downpour', underground_id: 'enveloping_silence' },
          { start: 4, end: 6, name: t`A Perfect Day`, underground: t`Glitterain`, valley_id: 'a_perfect_day', underground_id: 'glitterain' },
          { start: 7, end: 8, name: t`Howling Wind`, underground: t`Shimmering Runoff`, valley_id: 'howling_wind', underground_id: 'shimmering_runoff' },
          { start: 9, end: 12, name: t`Downpour`, underground: t`Enveloping Silence`, valley_id: 'downpour', underground_id: 'enveloping_silence' },
          { start: 13, end: 15, name: t`A Perfect Day`, underground: t`Glitterain`, valley_id: 'a_perfect_day', underground_id: 'glitterain' },
          { start: 16, end: 18, name: t`Downpour`, underground: t`Enveloping Silence`, valley_id: 'downpour', underground_id: 'enveloping_silence' },
          { start: 19, end: 21, name: t`A Perfect Day`, underground: t`Glitterain`, valley_id: 'a_perfect_day', underground_id: 'glitterain' },
          { start: 22, end: 23, name: t`Howling Wind`, underground: t`Shimmering Runoff`, valley_id: 'howling_wind', underground_id: 'shimmering_runoff' },
          { start: 24, end: 27, name: t`Downpour`, underground: t`Enveloping Silence`, valley_id: 'downpour', underground_id: 'enveloping_silence' },
          { start: 28, end: 30, name: t`A Perfect Day`, underground: t`Glitterain`, valley_id: 'a_perfect_day', underground_id: 'glitterain' },
        ],
        maxDay: 30,
      };
    }
    return {
      weather: [
        { start: 1, end: 3, name: t`A Perfect Day`, valley_id: 'a_perfect_day' },
        { start: 4, end: 7, name: t`Downpour`, valley_id: 'downpour' },
        { start: 8, end: 9, name: t`A Perfect Day`, valley_id: 'a_perfect_day' },
        { start: 10, end: 12, name: t`Downpour`, valley_id: 'downpour' },
        { start: 13, end: 14, name: t`Howling Winds`, valley_id: 'howling_wind' },
        { start: 15, end: 17, name: t`Downpour`, valley_id: 'downpour' },
        { start: 18, end: 20, name: t`Howling Winds`, valley_id: 'howling_wind' },
        { start: 21, end: 22, name: t`A Perfect Day`, valley_id: 'a_perfect_day' },
        { start: 23, end: 25, name: t`Downpour`, valley_id: 'downpour' },
        { start: 26, end: 28, name: t`Howling Winds`, valley_id: 'howling_wind' },
        { start: 29, end: 30, name: t`A Perfect Day`, valley_id: 'a_perfect_day' },
        ...(extendedCampaign ? [
          { start: 31, end: 33, name: t`Downpour`, valley_id: 'downpour' },
          { start: 34, end: 35, name: t`A Perfect Day`, valley_id: 'a_perfect_day' },
          { start: 36, end: 39, name: t`Howling Winds`, valley_id: 'howling_wind' },
          { start: 40, end: 42, name: t`Downpour`, valley_id: 'downpour' },
          { start: 43, end: 45, name: t`A Perfect Day`, valley_id: 'a_perfect_day' },
        ] : []),
      ],
      maxDay: extendedCampaign ? 45 : 30,
    };
  }, [cycle_id, extendedCampaign]);
}

const FIXED_GUIDE_ENTRIES: {
  [cycle_id: string]: { [day: string]: string[] | undefined }
} = {
  'core': {
    '1': ['1'],
    '3': ['94.1'],
    '4': ['1.04'],
  },
  'loa': {
    '1': ['1'],
    '4': ['199.2'],
  },
};

// ============================================
// TIMELINE (View Only)
// ============================================

const size = 40;

function DayButtonViewOnly({ day, currentDay }: { day: number; currentDay: number }) {
  return (
    <Box borderRadius={`${size / 2}px`}>
      <MoonIconWithDate day={day} currentDay={currentDay} size={size} />
    </Box>
  );
}

function TimelineViewOnly({ campaign }: { campaign: ParsedCampaign }) {
  const { weather: singleWeatherLabels, maxDay } = useWeather(campaign.cycle_id, campaign.extended_calendar);
  const weatherLabels = useMemo(() => {
    return [
      ...singleWeatherLabels,
      ...(campaign.extended_calendar ?
        singleWeatherLabels.map(weather => ({
          start: weather.start + maxDay,
          end: weather.end + maxDay,
          name: weather.name,
          underground: weather.underground,
        })) : []),
    ];
  }, [campaign.extended_calendar, singleWeatherLabels, maxDay]);

  const entriesByDay = useMemo(() => {
    const fixedEntries = FIXED_GUIDE_ENTRIES[campaign.cycle_id] ?? {};
    const r: { [key: string]: string[] | undefined } = { ...fixedEntries };
    forEach(campaign.calendar, ({ day, guides }) => {
      if (!r[day]) {
        r[day] = [];
      }
      forEach(guides, g => {
        r[day]?.push(g);
      });
    });
    return r;
  }, [campaign.cycle_id, campaign.calendar]);

  return (
    <Box maxW="100vw">
      <Flex direction="column" overflowX="scroll" paddingBottom="16px">
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
                <DayButtonViewOnly currentDay={campaign.day} day={day} />
              </Flex>
            );
          })}
        </Flex>
        <Flex direction="row" marginTop="4px">
          { map(weatherLabels, ({ start, end, name, underground }) => {
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
                <Flex direction="column" alignItems="center">
                  <Text textAlign="center" fontSize="2xs" fontWeight={current ? '600' : '400'}>
                    {name}
                  </Text>
                  { !!underground && (
                    <>
                      <Divider marginTop="0.75" marginBottom="0.75" />
                      <Text textAlign="center" fontSize="2xs" fontStyle="italic" color="gray.500">
                        {underground}
                      </Text>
                    </>
                  )}
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
    </Box>
  );
}

// ============================================
// JOURNEY MODAL (View Only)
// ============================================

interface TravelDay {
  day: number;
  startingLocation: string | undefined;
  travel: HistoryEntry[];
}

function TravelDayRowViewOnly({ entry: { day, startingLocation, travel }, currentDay }: { entry: TravelDay; currentDay: number }) {
  const { paths } = useLocale();
  const { locations } = useContext(CampaignViewContext);
  const start = startingLocation ? locations[startingLocation] : undefined;
  const finalLocationId = last(travel)?.location || startingLocation;
  const finalLocation = finalLocationId ? locations[finalLocationId] : undefined;
  const camped = !!last(travel)?.camped;
  
  return (
    <ListItem>
      <Flex direction="row" alignItems="flex-start" padding={2} flexWrap="wrap">
        { !!start && (
          <Flex direction="column" width="75px" alignItems="center">
            <LocationIcon location={start} size={58} />
            <Text textAlign="center" fontSize="xs">{start.name}</Text>
          </Flex>
        ) }
        { map(travel, ({ location, path_terrain, camped }, idx) => {
          const path = path_terrain ? paths[path_terrain] : undefined;
          const current: MapLocation | undefined = location ? locations[location] : undefined;
          return (
            <React.Fragment key={idx}>
              { !!path && (
                <Flex minHeight={58} direction="row" alignItems="center" marginRight={2}>
                  <FaArrowRight />
                </Flex>
              ) }
              { !!path && (
                <Flex minHeight={58} direction="row" alignItems="center" marginRight={2}>
                  <Box margin={2}>
                    <PathIcon path={path} size={42} />
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
                  <LocationIcon location={current} size={58} />
                  <Text textAlign="center" fontSize="xs">{current.name}</Text>
                </Flex>
              )}
            </React.Fragment>
          );
        }) }
        { !!finalLocation && day < currentDay && (
          <>
            <Flex minHeight={58} direction="row" alignItems="center" marginRight={2}>
              <FaArrowRight />
            </Flex>
            <Flex direction="column" width="75px" marginRight={2} alignItems="center">
              <Flex height="58px" direction="column" justifyContent="center">
                { camped ? <GiCampingTent size={48} /> : <FaMoon size={36} /> }
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

function useJourneyModalViewOnly(campaign: ParsedCampaign): [() => void, React.ReactNode] {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { weather: weatherLabels } = useWeather(campaign.cycle_id, campaign.extended_calendar);

  const travelHistory = useMemo(() => {
    const days: { [day: string]: HistoryEntry[] | undefined } = {};
    let currentLocation: string | undefined = undefined;
    
    forEach(campaign.history, entry => {
      if (!currentLocation) {
        currentLocation = entry.location;
      }
      const day = `${entry.day}`;
      days[day] = [...(days[day] || []), entry];
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
        result.push({ day, startingLocation: liveLocation, travel });
        const end = last(travel);
        if (end?.location) {
          liveLocation = end.location;
        }
      } else {
        if (currentLocation) {
          result.push({ day, startingLocation: liveLocation, travel: [] });
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
          <List>
            { map(travelHistory, (entry) => {
              const day = entry.day;
              const weather = find(weatherLabels, e => (e.start <= day && e.end >= day));
              return (
                <React.Fragment key={`day-${day}`}>
                  <ListItem padding={2} paddingTop={4} paddingBottom={0} borderBottomWidth={0.5} borderColor="#888888">
                    <Flex direction="row" flex={1} alignItems="center" justifyContent="space-between">
                      <Flex direction="row" alignItems="center" justifyContent="flex-start">
                        <Box marginRight={2} marginBottom={0.5}>
                          { day < campaign.day ? <MoonIcon day={day} size={18} /> : <FaSun /> }
                        </Box>
                        <Text fontSize="m">{t`Day ${day}`}</Text>
                      </Flex>
                      <Flex direction="column" alignItems="center">
                        { !!weather && <Text fontSize="sm" fontStyle="italic">{weather.name}</Text> }
                        { !!weather?.underground && (
                          <>
                            <Divider />
                            <Text fontSize="sm" fontStyle="italic" color="gray.500">{weather.underground}</Text>
                          </>
                        )}
                      </Flex>
                    </Flex>
                  </ListItem>
                  <TravelDayRowViewOnly entry={entry} currentDay={campaign.day} />
                </React.Fragment>
              );
            }) }
          </List>
        </ModalBody>
      </ModalContent>
    </Modal>
  ];
}

// ============================================
// CYCLE CHICLET
// ============================================

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

// ============================================
// RANGERS SECTION (View Only)
// ============================================

function CampaignRangersSectionViewOnly({ campaign }: { campaign: ParsedCampaign }) {
  return (
    <>
      <Text>{t`Rangers`}</Text>
      <List>
        { map(campaign.access, user => (
          <CampaignUserViewOnly
            key={user.id}
            user={user}
            campaign={campaign}
          />
        )) }
      </List>
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface CampaignDetailViewOnlyProps {
  campaign: ParsedCampaign;
  cards: CardsMap;
}

export default function CampaignDetailViewOnly(props: CampaignDetailViewOnlyProps) {
  const locations = useMapLocations(props.campaign.cycle_id, props.campaign.expansions);
  const context = useMemo(() => ({ locations }), [locations]);
  
  return (
    <CampaignViewContext.Provider value={context}>
      <CampaignDetailViewOnlyContent {...props} />
    </CampaignViewContext.Provider>
  );
}

function CampaignDetailViewOnlyContent({ campaign, cards }: CampaignDetailViewOnlyProps) {
  const { cycles, paths } = useLocale();
  const { locations } = useContext(CampaignViewContext);
  
  const cycle = useMemo(() => find(cycles, c => c.id === campaign.cycle_id), [cycles, campaign.cycle_id]);
  const [showHistory, historyModal] = useJourneyModalViewOnly(campaign);
  
  const currentLocation = campaign.current_location ? locations[campaign.current_location] : undefined;
  const currentPath = campaign.current_path_terrain ? paths[campaign.current_path_terrain] : undefined;

  return (
    <>
      <PageHeading
        title={campaign.name}
        subHeader={!!cycle ? <CycleChiclet cycle={cycle} /> : undefined}
      >
        <Flex direction="column" alignItems="flex-end">
          <ButtonGroup marginTop={2}>
            { !!campaign.previous_campaign && (
              <Button as={NextLink} href={`/campaigns/view/${campaign.previous_campaign.id}`} variant="ghost">
                {t`Previous campaign`}
              </Button>
            )}
            { !!campaign.next_campaign && (
              <Button as={NextLink} href={`/campaigns/view/${campaign.next_campaign.id}`} variant="ghost">
                {t`Next campaign`}
              </Button>
            )}
          </ButtonGroup>
        </Flex>
      </PageHeading>
      
      <TimelineViewOnly campaign={campaign} />
      
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
                    <Text style={{ fontVariantCaps: 'small-caps' }}>{currentLocation.name}</Text>
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
                  <Text marginLeft={2} style={{ fontVariantCaps: 'small-caps' }}>{currentPath.name}</Text>
                </Flex>
              ) : <Text fontStyle="italic">{t`None`}</Text>}
            </Box>
            { (campaign.day > 1 || campaign.history.length > 0) && (
              <ButtonGroup>
                <Button leftIcon={<FaCalendar />} onClick={showHistory}>{t`Recorded journey`}</Button>
              </ButtonGroup>
            ) }
          </Box>
          <CampaignRangersSectionViewOnly campaign={campaign} />
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
              <MissionsTabViewOnly campaign={campaign} />
            </TabPanel>
            <TabPanel>
              <RewardsTabViewOnly campaign={campaign} cards={cards} />
            </TabPanel>
            <TabPanel>
              <EventsTabViewOnly campaign={campaign} />
            </TabPanel>
            <TabPanel>
              <RemovedTabViewOnly campaign={campaign} />
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <NotesTabViewOnly campaign={campaign} />
      </SimpleGrid>
      
      { historyModal }
    </>
  );
}
