import { Friend_Status_Type_Enum } from "./graphql/schema";

export enum ParticipantStatus {
  REGISTERED = 'registered',
  CONFIRMED = 'confirmed',
  BANNED = 'banned',
};

export const ADMIN_USER = "rBmCsYkFq5g6QG8tYofAwDsJcto2";

export interface ArkhamProfile {
  handle?: string;
  friends?: { [uid: string]: Friend_Status_Type_Enum | undefined };
}

export interface User {
  discord?: string;
  upcomingBlobs?: string[];
  organizerBlobs?: string[];
}

export interface Participant {
  user: string;
  groupName: string;
  status: ParticipantStatus;
  groupSize: number;
  registeredAt: Date;
  confirmedAt?: Date;
}

export interface BlobClueGoal {
  goal: number;
  clues: number;
}

export enum GameAnnouncementCode {
  BLOB_DEAD = 'blob_dead',

  WAR_ADVANCE_RED_1 = 'war1',
  WAR_ADVANCE_RED_2 = 'war2',
  WAR_ADVANCE_RED_3 = 'war3',
  WAR_ADVANCE_GREEN_1 = 'wag1',
  WAR_ADVANCE_GREEN_2 = 'wag2',
  WAR_ADVANCE_GREEN_3 = 'wag3',
  WAR_ADVANCE_BLUE_1 = 'wab1',
  WAR_ADVANCE_BLUE_2 = 'wab2',
  WAR_ADVANCE_BLUE_3 = 'wab3',
  WAR_GOO_DEAD = 'war_goo_dead',
};

export interface GameAnnouncement {
  code?: GameAnnouncementCode | null;
  text: string;
  time: number;
}

export enum GroupBlobUpdateType {
  DAMAGE = 'damage',
  CLUE = 'clue',
  COUNTERMEASURE = 'countermeasure',
};

export enum GroupWarUpdateType {
  DOOM_GREEN = 'doom_green',
  DOOM_BLUE = 'doom_blue',
  DOOM_RED = 'doom_red',
  DOOM_ALL = 'doom_all',
  DAMAGE = 'damage',
  ACT = 'act',
  REQUEST_HELP_NY = 'request_help_ny',
  REQUEST_HELP_PV = 'request_help_pv',
  REQUEST_HELP_MN = 'request_help_mn',
  REQUEST_HELP_CLUES = 'request_help_clues',
  GIVE_HELP_NY = 'give_help_ny',
  GIVE_HELP_PV = 'give_help_pv',
  GIVE_HELP_MN = 'give_help_mn',
  GIVE_CLUE = 'clue',
};

export interface GroupUpdate<T> {
  user: string;
  type: T;
  value: number;
  targetUser: string;
  createdAt: number;
}

export type BlobGroupUpdate = GroupUpdate<GroupBlobUpdateType>;
export type WarGroupUpdate = GroupUpdate<GroupWarUpdateType>;

export interface BasicGameState {
  start: number;
  end: number;
  announcements: GameAnnouncement[];
  completed?: boolean;
}

export interface BlobGameState extends BasicGameState {
  health: number;
  damage: number;
  playerCount: number;
  countermeasures: number;
  clueGoal?: BlobClueGoal;

  completedClueGoal: BlobClueGoal[];
  missions?: number[];
}

export type WarFaction = 'blue' | 'green' | 'red';

export enum PersonalWarAnnouncementType {
  CLUE = 'c',
  HELP_NY = 'ny',
  HELP_PV = 'pv',
  HELP_MN = 'mn',
};

export interface PersonalWarAnnouncement {
  from: string;
  to: string;
  time: number;
  type: PersonalWarAnnouncementType;
}
export interface WarGameState extends BasicGameState {
  doomLimit: number;
  healthLimit: number;
  doom: [number, number, number];
  goo?: WarFaction;
  damage: number;
  groupStatus: {
    [key: string]: number | undefined;
  };
  helpNeeded?: {
    ny?: string[];
    pv?: string[];
    mn?: string[];
    clues?: string[];
  };
  warAnnouncements: PersonalWarAnnouncement[];
}

export interface UpcomingEvent {
  scheduledStart: number;
  organizer: string;
  name: string;
  description?: string;
  customGame?: boolean;
  archived?: boolean;
  gameType: 'blob' | 'war';
}

export interface ActualEvent extends UpcomingEvent {
  participants: Participant[];
  signUpLocked?: boolean;
}
export interface BlobEvent extends ActualEvent {
  gameType: 'blob';
  gameState?: BlobGameState;
}

export interface WarEvent extends ActualEvent {
  gameType: 'war';
  gameState?: WarGameState;
}

export type ArkhamEvent = WarEvent | BlobEvent;


export interface EventSecret {
  organizer: string;
  password?: string;
  discordWebhook?: string;
  participantContact?: {
    [uid: string]: string;
  };
}