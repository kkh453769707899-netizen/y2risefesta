import { ActivityLog, Booth, Counters, FestivalSettings, Participant, ScanResult } from '../types';

const STORAGE_KEYS = {
  BOOTHS: 'kfc_festival_booths_v1',
  PARTICIPANTS: 'kfc_festival_participants_v1',
  SETTINGS: 'kfc_festival_settings_v1',
  COUNTERS: 'kfc_festival_counters_v1',
  LOGS: 'kfc_festival_logs_v1',
  LOCAL_PARTICIPANT_ID: 'kfc_participant_id',
  LOCAL_PARTICIPANT_ALLOCATED: 'kfc_participant_allocated',
};

export const INITIAL_BOOTHS: Booth[] = [
  {
    id: 'booth-1',
    name: '🤖 로봇 체험',
    category: '로봇',
    location: '공학관 1층 로봇실습실',
    description: '최신 사족보행 로봇 및 휴머노이드 로봇 조종 체험과 AI 물체 인식 시연 부스입니다.',
    hint: '로봇 매트 옆 안내판에 부착된 공식 QR을 확인하세요.',
    qrSecret: 'kfc-sec-robot-8821',
    order: 1,
    isActive: true,
    completedCount: 0,
  },
  {
    id: 'booth-2',
    name: '🧠 AI 웹앱 체험',
    category: 'AI/소프트웨어',
    location: '멀티미디어관 203호',
    description: '직접 프롬프트를 입력하여 나만의 캐릭터와 인터랙티브 웹앱을 생성해보는 AI 체험관입니다.',
    hint: '체험 키오스크 화면 모니터 옆 스티커 QR을 찾으세요.',
    qrSecret: 'kfc-sec-aiweb-3942',
    order: 2,
    isActive: true,
    completedCount: 0,
  },
  {
    id: 'booth-3',
    name: '🚗 로봇 미션',
    category: '체험',
    location: '학생회관 1층 로비',
    description: '스마트 RC카로 미로 트랙과 장애물 코스를 시간 내에 주파하는 스릴 넘치는 미션 코너입니다.',
    hint: '장애물 코스 결승선(FINISH) 완주 지점 깃발 옆에 QR이 있습니다.',
    qrSecret: 'kfc-sec-mission-7419',
    order: 3,
    isActive: true,
    completedCount: 0,
  },
  {
    id: 'booth-4',
    name: '🎮 K.F.C. 게임',
    category: '게임',
    location: '중앙 야외 잔디광장 부스',
    description: '동아리 제작 미니 아케이드 게임을 플레이하고 축제 랭킹에 도전하는 야외 플레이존입니다.',
    hint: '게임 진행 요원 명찰 목걸이 뒷면의 QR을 스캔하세요.',
    qrSecret: 'kfc-sec-game-9513',
    order: 4,
    isActive: true,
    completedCount: 0,
  },
];

export const INITIAL_SETTINGS: FestivalSettings = {
  title: '2026 K.F.C. 봄 축제 로봇&AI 부스 체험 투어',
  welcomeMessage: '각 부스를 방문하여 신나는 체험을 즐기고 스탬프를 모두 모아 맛있는 간식을 수령하세요!',
  snackName: '달콤 바삭 츄러스 & 음료 세트',
  snackBoothLocation: '중앙 잔디광장 본부석 간식 배부처',
  adminPassword: 'admin1234',
};

export const INITIAL_COUNTERS: Counters = {
  lastParticipantNumber: 0,
};

type Listener<T> = (data: T) => void;

class FestivalDataStore {
  private booths: Booth[] = [];
  private participants: Participant[] = [];
  private settings: FestivalSettings = INITIAL_SETTINGS;
  private counters: Counters = INITIAL_COUNTERS;
  private logs: ActivityLog[] = [];

  private boothListeners: Set<Listener<Booth[]>> = new Set();
  private participantListeners: Set<Listener<Participant[]>> = new Set();
  private settingsListeners: Set<Listener<FestivalSettings>> = new Set();
  private logListeners: Set<Listener<ActivityLog[]>> = new Set();

  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.loadInitialData();
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('kfc_festival_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'SYNC_ALL') {
            this.reloadFromStorage();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment', e);
      }

      window.addEventListener('storage', (event) => {
        if (event.key && Object.values(STORAGE_KEYS).includes(event.key)) {
          this.reloadFromStorage();
        }
      });
    }
  }

  private loadInitialData() {
    if (typeof window === 'undefined') return;

    try {
      const storedBooths = localStorage.getItem(STORAGE_KEYS.BOOTHS);
      this.booths = storedBooths ? JSON.parse(storedBooths) : INITIAL_BOOTHS;
      if (!storedBooths) {
        localStorage.setItem(STORAGE_KEYS.BOOTHS, JSON.stringify(this.booths));
      }

      const storedParticipants = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
      this.participants = storedParticipants ? JSON.parse(storedParticipants) : [];

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      this.settings = storedSettings ? { ...INITIAL_SETTINGS, ...JSON.parse(storedSettings) } : INITIAL_SETTINGS;
      if (!storedSettings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      }

      const storedCounters = localStorage.getItem(STORAGE_KEYS.COUNTERS);
      this.counters = storedCounters ? JSON.parse(storedCounters) : INITIAL_COUNTERS;
      if (!storedCounters) {
        localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(this.counters));
      }

      const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      this.logs = storedLogs ? JSON.parse(storedLogs) : [];
    } catch (err) {
      console.error('Failed to load data from localStorage', err);
      this.booths = INITIAL_BOOTHS;
      this.settings = INITIAL_SETTINGS;
      this.counters = INITIAL_COUNTERS;
      this.participants = [];
      this.logs = [];
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.BOOTHS, JSON.stringify(this.booths));
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(this.participants));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(this.counters));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs.slice(0, 100))); // keep recent 100
      this.broadcastChannel?.postMessage({ type: 'SYNC_ALL' });
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }

  private reloadFromStorage() {
    this.loadInitialData();
    this.notifyAll();
  }

  private notifyAll() {
    this.boothListeners.forEach((fn) => fn([...this.booths]));
    this.participantListeners.forEach((fn) => fn([...this.participants]));
    this.settingsListeners.forEach((fn) => fn({ ...this.settings }));
    this.logListeners.forEach((fn) => fn([...this.logs]));
  }

  // --- Subscriptions ---
  public subscribeBooths(listener: Listener<Booth[]>): () => void {
    this.boothListeners.add(listener);
    listener([...this.booths]);
    return () => this.boothListeners.delete(listener);
  }

  public subscribeParticipants(listener: Listener<Participant[]>): () => void {
    this.participantListeners.add(listener);
    listener([...this.participants]);
    return () => this.participantListeners.delete(listener);
  }

  public subscribeSettings(listener: Listener<FestivalSettings>): () => void {
    this.settingsListeners.add(listener);
    listener({ ...this.settings });
    return () => this.settingsListeners.delete(listener);
  }

  public subscribeLogs(listener: Listener<ActivityLog[]>): () => void {
    this.logListeners.add(listener);
    listener([...this.logs]);
    return () => this.logListeners.delete(listener);
  }

  // --- Getters ---
  public getBooths(): Booth[] {
    return [...this.booths];
  }

  public getParticipants(): Participant[] {
    return [...this.participants];
  }

  public getSettings(): FestivalSettings {
    return { ...this.settings };
  }

  public getCounters(): Counters {
    return { ...this.counters };
  }

  public getLocalParticipant(): Participant | null {
    if (typeof window === 'undefined') return null;
    const localId = localStorage.getItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID);
    const isAllocated = localStorage.getItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ALLOCATED);
    if (!localId || isAllocated !== 'true') {
      return null;
    }
    return this.participants.find((p) => p.id === localId) || null;
  }

  // --- QR String Code Generator Helpers ---
  public generateBoothCode(booth: Booth): string {
    return `BOOTH:${booth.id}:${booth.qrSecret}`;
  }

  public generateSnackCode(participantId: string): string {
    return `KFC-SNACK:${participantId}`;
  }

  public static generateBoothCode(booth: Booth): string {
    return `BOOTH:${booth.id}:${booth.qrSecret}`;
  }

  public static generateSnackCode(participantId: string): string {
    return `KFC-SNACK:${participantId}`;
  }

  // --- Parsing QR Codes (supports plain text or embedded URLs) ---
  public static parseQRCode(rawText: string): { type: 'BOOTH' | 'SNACK' | 'UNKNOWN'; payload: string } {
    const trimmed = rawText.trim();

    // Check if it's a URL like https://...#scan=BOOTH:booth-1:... or https://...?code=BOOTH:...
    let code = trimmed;
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        if (url.searchParams.has('code')) {
          code = url.searchParams.get('code') || '';
        } else if (url.searchParams.has('scan')) {
          code = url.searchParams.get('scan') || '';
        } else if (url.hash && url.hash.includes('=')) {
          const hashParam = url.hash.substring(1).split('=')[1];
          if (hashParam) code = decodeURIComponent(hashParam);
        } else if (url.hash && (url.hash.startsWith('#BOOTH:') || url.hash.startsWith('#KFC-SNACK:'))) {
          code = decodeURIComponent(url.hash.substring(1));
        }
      }
    } catch {
      code = trimmed;
    }

    if (code.startsWith('BOOTH:')) {
      return { type: 'BOOTH', payload: code };
    }
    if (code.startsWith('KFC-SNACK:')) {
      return { type: 'SNACK', payload: code };
    }
    return { type: 'UNKNOWN', payload: code };
  }

  // --- Core Business Logic: Process Booth QR Scan ---
  public processBoothScan(rawCode: string): ScanResult {
    const parsed = FestivalDataStore.parseQRCode(rawCode);
    if (parsed.type !== 'BOOTH') {
      return {
        success: false,
        message: '유효한 부스 QR 코드가 아닙니다. (형식: BOOTH:<부스ID>:<코드>)',
      };
    }

    // Format: BOOTH:<BOOTH_ID>:<RANDOM_HASH>
    const parts = parsed.payload.split(':');
    if (parts.length < 3) {
      return {
        success: false,
        message: 'QR 코드 형식이 올바르지 않습니다.',
      };
    }

    const boothId = parts[1];
    const qrSecret = parts.slice(2).join(':');

    // Look up booth
    const booth = this.booths.find((b) => b.id === boothId);
    if (!booth) {
      return {
        success: false,
        message: '등록되지 않은 부스입니다.',
      };
    }

    if (!booth.isActive) {
      return {
        success: false,
        message: `[${booth.name}] 부스는 현재 운영 중이 아닙니다.`,
      };
    }

    if (booth.qrSecret !== qrSecret) {
      return {
        success: false,
        message: '부스 인증 토큰이 일치하지 않습니다. 올바른 현장 QR을 스캔해주세요.',
      };
    }

    // Check participant (Lazy allocation principle)
    let participant = this.getLocalParticipant();
    let newlyAllocated = false;

    if (!participant) {
      // Allocate atomically now on first successful scan!
      const nextNum = (this.counters.lastParticipantNumber || 0) + 1;
      this.counters.lastParticipantNumber = nextNum;

      const newId = `participant_${nextNum}`;
      participant = {
        id: newId,
        participantNumber: nextNum,
        createdAt: Date.now(),
        completedBooths: [],
        progress: 0,
        isCompleted: false,
        completedAt: null,
        snackClaimed: false,
        snackClaimedAt: null,
        lastActiveAt: Date.now(),
      };

      this.participants.push(participant);
      newlyAllocated = true;

      // Save to local device storage permanently
      localStorage.setItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID, newId);
      localStorage.setItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ALLOCATED, 'true');
    }

    // Check if booth is already stamped
    if (participant.completedBooths.includes(boothId)) {
      return {
        success: false,
        isAlreadyCompleted: true,
        booth,
        participant,
        message: `이미 완료한 체험입니다! ([${booth.name}])`,
      };
    }

    // Add booth to completed
    participant.completedBooths.push(boothId);
    participant.lastActiveAt = Date.now();

    // Update booth completed count
    booth.completedCount = (booth.completedCount || 0) + 1;

    // Recalculate progress against active booths
    const activeBooths = this.booths.filter((b) => b.isActive);
    const activeBoothIds = new Set(activeBooths.map((b) => b.id));
    const completedActiveCount = participant.completedBooths.filter((id) => activeBoothIds.has(id)).length;
    const totalActive = activeBooths.length;

    const progress = totalActive > 0 ? Math.min(100, Math.round((completedActiveCount / totalActive) * 100)) : 100;
    participant.progress = progress;

    let isTourCompleted = false;
    if (completedActiveCount >= totalActive && totalActive > 0) {
      if (!participant.isCompleted) {
        participant.isCompleted = true;
        participant.completedAt = Date.now();
        isTourCompleted = true;

        // Activity log for 100% completion
        this.addLog({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: Date.now(),
          participantId: participant.id,
          participantNumber: participant.participantNumber,
          type: 'COMPLETED_ALL',
          message: `참가자 #${participant.participantNumber}님이 모든 부스를 완주하고 간식 교환권을 획득했습니다! 🎉`,
        });
      }
    }

    // Activity log for booth stamp
    this.addLog({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      participantId: participant.id,
      participantNumber: participant.participantNumber,
      boothId: booth.id,
      boothName: booth.name,
      type: 'BOOTH_STAMP',
      message: `참가자 #${participant.participantNumber}님이 [${booth.name}] 부스 인증을 완료했습니다.`,
    });

    this.saveToStorage();
    this.notifyAll();

    return {
      success: true,
      type: 'BOOTH',
      booth,
      participant,
      newlyAllocated,
      isTourCompleted,
      message: `축하합니다! [${booth.name}] 스탬프를 획득했습니다.`,
    };
  }

  // --- Staff/Admin: Claim Snack for Participant ---
  public claimSnack(participantId: string): { success: boolean; message: string; participant?: Participant } {
    const participant = this.participants.find((p) => p.id === participantId);
    if (!participant) {
      return { success: false, message: '참가자 정보를 찾을 수 없습니다.' };
    }

    if (!participant.isCompleted) {
      return {
        success: false,
        message: `아직 모든 부스를 완주하지 않았습니다. (진행률: ${participant.progress}%)`,
        participant,
      };
    }

    if (participant.snackClaimed) {
      const claimDate = participant.snackClaimedAt ? new Date(participant.snackClaimedAt).toLocaleString() : '확인 불가';
      return {
        success: false,
        message: `이미 간식 수령이 완료된 교환권입니다. (수령일시: ${claimDate})`,
        participant,
      };
    }

    // Process 1-time claim
    participant.snackClaimed = true;
    participant.snackClaimedAt = Date.now();
    participant.lastActiveAt = Date.now();

    this.addLog({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      participantId: participant.id,
      participantNumber: participant.participantNumber,
      type: 'SNACK_CLAIMED',
      message: `운영본부에서 참가자 #${participant.participantNumber}님에게 간식(${this.settings.snackName}) 지급을 완료했습니다. 🎁`,
    });

    this.saveToStorage();
    this.notifyAll();

    return {
      success: true,
      message: `참가자 #${participant.participantNumber}님에게 [${this.settings.snackName}] 간식 지급이 정상 처리되었습니다.`,
      participant,
    };
  }

  // --- Staff Scan Snack QR Voucher ---
  public processStaffSnackScan(rawCode: string): { success: boolean; message: string; participant?: Participant; alreadyClaimed?: boolean } {
    const parsed = FestivalDataStore.parseQRCode(rawCode);
    let targetParticipantId = '';

    if (parsed.type === 'SNACK') {
      targetParticipantId = parsed.payload.replace('KFC-SNACK:', '').trim();
    } else if (rawCode.startsWith('participant_') || !isNaN(Number(rawCode))) {
      targetParticipantId = rawCode.startsWith('participant_') ? rawCode : `participant_${rawCode}`;
    } else {
      return {
        success: false,
        message: '유효한 간식 교환권 QR이 아닙니다. (형식: KFC-SNACK:participant_N)',
      };
    }

    const participant = this.participants.find((p) => p.id === targetParticipantId);
    if (!participant) {
      return {
        success: false,
        message: `참가자 ID (${targetParticipantId})를 시스템에서 찾을 수 없습니다.`,
      };
    }

    if (!participant.isCompleted) {
      return {
        success: false,
        message: `참가자 #${participant.participantNumber}님은 아직 완주하지 못했습니다. (완료: ${participant.completedBooths.length}개)`,
        participant,
      };
    }

    if (participant.snackClaimed) {
      const claimDate = participant.snackClaimedAt ? new Date(participant.snackClaimedAt).toLocaleString() : '확인 불가';
      return {
        success: false,
        alreadyClaimed: true,
        message: `이미 간식을 수령한 참가자입니다. (${claimDate})`,
        participant,
      };
    }

    return {
      success: true,
      message: `완주 확인 완료! 참가자 #${participant.participantNumber}님에게 간식을 지급하시겠습니까?`,
      participant,
    };
  }

  // --- Booth Management ---
  public addBooth(boothData: Omit<Booth, 'id' | 'completedCount'>): Booth {
    const newId = `booth-${Date.now().toString(36)}`;
    const newBooth: Booth = {
      ...boothData,
      id: newId,
      completedCount: 0,
    };
    this.booths.push(newBooth);
    this.saveToStorage();
    this.notifyAll();
    return newBooth;
  }

  public updateBooth(id: string, updates: Partial<Booth>): boolean {
    const index = this.booths.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.booths[index] = { ...this.booths[index], ...updates };
    this.saveToStorage();
    this.notifyAll();
    return true;
  }

  public deleteBooth(id: string): boolean {
    const initialLen = this.booths.length;
    this.booths = this.booths.filter((b) => b.id !== id);
    if (this.booths.length !== initialLen) {
      this.saveToStorage();
      this.notifyAll();
      return true;
    }
    return false;
  }

  public toggleBoothActive(id: string): boolean {
    const booth = this.booths.find((b) => b.id === id);
    if (!booth) return false;
    booth.isActive = !booth.isActive;
    this.saveToStorage();
    this.notifyAll();
    return true;
  }

  // --- Settings ---
  public updateSettings(newSettings: Partial<FestivalSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    this.notifyAll();
  }

  // --- Activity Logs ---
  private addLog(log: ActivityLog) {
    this.logs.unshift(log);
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
    }
  }

  // --- Reset/Debug Utilities ---
  public resetMyParticipant() {
    if (typeof window === 'undefined') return;
    const localId = localStorage.getItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID);
    if (localId) {
      this.participants = this.participants.filter((p) => p.id !== localId);
    }
    localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID);
    localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ALLOCATED);
    this.saveToStorage();
    this.notifyAll();
  }

  public resetAllParticipantsAndStats() {
    this.participants = [];
    this.counters = { lastParticipantNumber: 0 };
    this.logs = [];
    this.booths.forEach((b) => {
      b.completedCount = 0;
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID);
      localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ALLOCATED);
    }
    this.saveToStorage();
    this.notifyAll();
  }

  public restoreDefaultBooths() {
    this.booths = JSON.parse(JSON.stringify(INITIAL_BOOTHS));
    this.saveToStorage();
    this.notifyAll();
  }
}

export const store = new FestivalDataStore();
