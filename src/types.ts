export interface Booth {
  id: string;
  name: string;
  category: string;
  location: string;
  description: string;
  hint: string;
  qrSecret: string;
  order: number;
  isActive: boolean;
  completedCount: number;
}

export type GenderType = 'MALE' | 'FEMALE' | 'OTHER';

export interface Participant {
  id: string; // e.g. 'participant_1'
  participantNumber: number; // e.g. 1
  name?: string; // 참가자 이름
  age?: number; // 참가자 나이
  gender?: GenderType; // 참가자 성별
  createdAt: number;
  completedBooths: string[];
  progress: number; // 0 ~ 100
  isCompleted: boolean;
  completedAt: number | null;
  snackClaimed: boolean;
  snackClaimedAt: number | null;
  lastActiveAt: number;
}

export interface FestivalSettings {
  title: string;
  welcomeMessage: string;
  snackName: string;
  snackBoothLocation: string;
  adminPassword: string;
}

export interface Counters {
  lastParticipantNumber: number;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  participantId: string;
  participantNumber: number;
  boothId?: string;
  boothName?: string;
  type: 'BOOTH_STAMP' | 'COMPLETED_ALL' | 'SNACK_CLAIMED' | 'PARTICIPANT_REGISTERED';
  message: string;
}

export interface ScanResult {
  success: boolean;
  type?: 'BOOTH' | 'SNACK';
  booth?: Booth;
  participant?: Participant;
  message: string;
  isAlreadyCompleted?: boolean;
  newlyAllocated?: boolean;
  isTourCompleted?: boolean;
}
