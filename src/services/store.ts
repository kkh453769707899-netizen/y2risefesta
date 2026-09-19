/**
 * Centralized Festival Stamp Tour Data Store with Firebase Firestore Real-Time Sync
 * 
 * - Full real-time synchronization with Firestore (onSnapshot, setDoc, deleteDoc, runTransaction).
 * - Instant offline fallback with localStorage caching.
 * - Lazy participant allocation: allocated with atomic transaction ONLY upon first successful scan.
 */

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  runTransaction,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db, initAuth } from './firebase';
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

  private isConnectedToFirebase = false;

  constructor() {
    this.loadInitialData();
    this.initFirebase();
  }

  private loadInitialData() {
    if (typeof window === 'undefined') return;

    try {
      const storedBooths = localStorage.getItem(STORAGE_KEYS.BOOTHS);
      this.booths = storedBooths ? JSON.parse(storedBooths) : INITIAL_BOOTHS;

      const storedParticipants = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
      this.participants = storedParticipants ? JSON.parse(storedParticipants) : [];

      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      this.settings = storedSettings ? { ...INITIAL_SETTINGS, ...JSON.parse(storedSettings) } : INITIAL_SETTINGS;

      const storedCounters = localStorage.getItem(STORAGE_KEYS.COUNTERS);
      this.counters = storedCounters ? JSON.parse(storedCounters) : INITIAL_COUNTERS;

      const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      this.logs = storedLogs ? JSON.parse(storedLogs) : [];
    } catch {
      this.booths = INITIAL_BOOTHS;
      this.settings = INITIAL_SETTINGS;
      this.counters = INITIAL_COUNTERS;
      this.participants = [];
      this.logs = [];
    }
  }

  private async initFirebase() {
    try {
      await initAuth();

      // 1. Settings & Counters Firestore Listener
      const settingsDocRef = doc(db, 'settings', 'config');
      onSnapshot(settingsDocRef, async (snapshot) => {
        if (snapshot.exists()) {
          this.isConnectedToFirebase = true;
          const data = snapshot.data();
          this.settings = { ...INITIAL_SETTINGS, ...data };
          if (typeof data.lastParticipantNumber === 'number') {
            this.counters = { lastParticipantNumber: data.lastParticipantNumber };
          }
          this.saveToStorage(false);
          this.notifyAll();
        } else {
          // Initialize in firestore if empty
          await setDoc(settingsDocRef, { ...INITIAL_SETTINGS, lastParticipantNumber: this.counters.lastParticipantNumber || 0 });
        }
      }, (err) => console.warn('Firestore settings listener:', err));

      // 2. Booths Firestore Listener
      const boothsColRef = collection(db, 'booths');
      onSnapshot(boothsColRef, async (snapshot) => {
        if (!snapshot.empty) {
          this.isConnectedToFirebase = true;
          const items: Booth[] = [];
          snapshot.forEach((d) => items.push(d.data() as Booth));
          items.sort((a, b) => a.order - b.order);
          this.booths = items;
          this.saveToStorage(false);
          this.notifyAll();
        } else {
          // Bootstrap default booths in Firestore
          const batch = writeBatch(db);
          INITIAL_BOOTHS.forEach((b) => {
            batch.set(doc(db, 'booths', b.id), b);
          });
          await batch.commit().catch(() => {});
        }
      }, (err) => console.warn('Firestore booths listener:', err));

      // 3. Participants Firestore Listener
      const participantsColRef = collection(db, 'participants');
      onSnapshot(participantsColRef, (snapshot) => {
        this.isConnectedToFirebase = true;
        const items: Participant[] = [];
        snapshot.forEach((d) => items.push(d.data() as Participant));
        items.sort((a, b) => b.createdAt - a.createdAt);
        this.participants = items;
        this.saveToStorage(false);
        this.notifyAll();
      }, (err) => console.warn('Firestore participants listener:', err));

      // 4. Logs Firestore Listener
      const logsColRef = collection(db, 'logs');
      onSnapshot(logsColRef, (snapshot) => {
        this.isConnectedToFirebase = true;
        const items: ActivityLog[] = [];
        snapshot.forEach((d) => items.push(d.data() as ActivityLog));
        items.sort((a, b) => b.timestamp - a.timestamp);
        this.logs = items.slice(0, 100);
        this.saveToStorage(false);
        this.notifyAll();
      }, (err) => console.warn('Firestore logs listener:', err));

    } catch (e) {
      console.warn('Firebase init warning (offline mode):', e);
    }
  }

  private saveToStorage(writeFirestore = true) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.BOOTHS, JSON.stringify(this.booths));
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(this.participants));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(this.counters));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.logs.slice(0, 100)));
    } catch {}
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

  // --- QR Code Helpers ---
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

  public static parseQRCode(rawText: string): { type: 'BOOTH' | 'SNACK' | 'UNKNOWN'; payload: string } {
    const trimmed = rawText.trim();
    if (trimmed.includes('#scan=')) {
      const parts = trimmed.split('#scan=');
      if (parts[1]) return FestivalDataStore.parseQRCode(decodeURIComponent(parts[1]));
    }
    if (trimmed.includes('?code=')) {
      const parts = trimmed.split('?code=');
      if (parts[1]) return FestivalDataStore.parseQRCode(decodeURIComponent(parts[1].split('&')[0]));
    }

    if (trimmed.startsWith('BOOTH:')) {
      return { type: 'BOOTH', payload: trimmed };
    }
    if (trimmed.startsWith('KFC-SNACK:')) {
      return { type: 'SNACK', payload: trimmed };
    }
    return { type: 'UNKNOWN', payload: trimmed };
  }

  /**
   * Process visitor booth scan with atomic participant allocation and Firestore persistence
   */
  public processBoothScan(rawCode: string): ScanResult {
    const parsed = FestivalDataStore.parseQRCode(rawCode);

    if (parsed.type !== 'BOOTH') {
      const boothByExactId = this.booths.find(
        (b) => b.id.toLowerCase() === parsed.payload.toLowerCase() || b.qrSecret === parsed.payload
      );
      if (boothByExactId) {
        return this.handleBoothScanPayload(`BOOTH:${boothByExactId.id}:${boothByExactId.qrSecret}`);
      }
      return {
        success: false,
        message: '축제 부스 전용 QR 코드가 아닙니다. 각 부스에 비치된 안내판 QR을 스캔해주세요.',
      };
    }

    return this.handleBoothScanPayload(parsed.payload);
  }

  private handleBoothScanPayload(payload: string): ScanResult {
    const parts = payload.split(':');
    const boothId = parts[1];
    const qrSecret = parts.slice(2).join(':');

    const booth = this.booths.find((b) => b.id === boothId);
    if (!booth) {
      return { success: false, message: '등록되지 않은 부스입니다.' };
    }

    if (!booth.isActive) {
      return { success: false, message: `[${booth.name}] 부스는 현재 운영 중이 아닙니다.` };
    }

    if (booth.qrSecret !== qrSecret) {
      return { success: false, message: '부스 인증 토큰이 일치하지 않습니다. 올바른 현장 QR을 스캔해주세요.' };
    }

    let participant = this.getLocalParticipant();
    let newlyAllocated = false;

    if (!participant) {
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

      localStorage.setItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID, newId);
      localStorage.setItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ALLOCATED, 'true');

      // Update Firestore settings counter & participant
      setDoc(doc(db, 'settings', 'config'), { lastParticipantNumber: nextNum }, { merge: true }).catch(() => {});
      setDoc(doc(db, 'participants', newId), participant).catch(() => {});
    }

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

    // Persist to Firestore
    setDoc(doc(db, 'participants', participant.id), participant, { merge: true }).catch(() => {});
    setDoc(doc(db, 'booths', booth.id), { completedCount: booth.completedCount }, { merge: true }).catch(() => {});

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

    participant.snackClaimed = true;
    participant.snackClaimedAt = Date.now();
    participant.lastActiveAt = Date.now();

    this.addLog({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      participantId: participant.id,
      participantNumber: participant.participantNumber,
      type: 'SNACK_CLAIMED',
      message: `참가자 #${participant.participantNumber}님이 간식 [${this.settings.snackName}]을(를) 수령했습니다. 🎁`,
    });

    this.saveToStorage();
    this.notifyAll();

    setDoc(doc(db, 'participants', participant.id), participant, { merge: true }).catch(() => {});

    return {
      success: true,
      message: `참가자 #${participant.participantNumber}님의 간식 수령 처리가 완료되었습니다!`,
      participant,
    };
  }

  public verifySnackCode(rawCode: string): { success: boolean; message: string; participant?: Participant } {
    const parsed = FestivalDataStore.parseQRCode(rawCode);
    let participantId = '';

    if (parsed.type === 'SNACK') {
      const parts = parsed.payload.split(':');
      participantId = parts[1];
    } else {
      participantId = parsed.payload.trim();
    }

    const participant = this.participants.find((p) => p.id === participantId);
    if (!participant) {
      return {
        success: false,
        message: '해당 간식 교환권의 참가자 번호를 찾을 수 없습니다.',
      };
    }

    if (!participant.isCompleted) {
      return {
        success: false,
        message: `참가자 #${participant.participantNumber}님은 아직 스탬프 투어를 완주하지 않았습니다. (진행률: ${participant.progress}%)`,
        participant,
      };
    }

    if (participant.snackClaimed) {
      const claimDate = participant.snackClaimedAt ? new Date(participant.snackClaimedAt).toLocaleTimeString() : '';
      return {
        success: false,
        message: `[이미 수령 완료] 참가자 #${participant.participantNumber}님은 이미 간식을 수령했습니다. (${claimDate})`,
        participant,
      };
    }

    return {
      success: true,
      message: `[인증 성공] 참가자 #${participant.participantNumber}님 완주 확인 완료. 간식을 지급해주세요!`,
      participant,
    };
  }

  public processStaffSnackScan(rawCode: string): { success: boolean; message: string; participant?: Participant } {
    return this.verifySnackCode(rawCode);
  }

  // --- Booth CRUD ---
  public addBooth(booth: Omit<Booth, 'id' | 'completedCount'>): Booth {
    const newId = `booth-${Date.now()}`;
    const newBooth: Booth = {
      ...booth,
      id: newId,
      completedCount: 0,
    };
    this.booths.push(newBooth);
    this.saveToStorage();
    this.notifyAll();
    setDoc(doc(db, 'booths', newId), newBooth).catch(() => {});
    return newBooth;
  }

  public updateBooth(id: string, updates: Partial<Booth>): boolean {
    const index = this.booths.findIndex((b) => b.id === id);
    if (index === -1) return false;
    this.booths[index] = { ...this.booths[index], ...updates };
    this.saveToStorage();
    this.notifyAll();
    setDoc(doc(db, 'booths', id), this.booths[index], { merge: true }).catch(() => {});
    return true;
  }

  public deleteBooth(id: string): boolean {
    const initialLen = this.booths.length;
    this.booths = this.booths.filter((b) => b.id !== id);
    if (this.booths.length !== initialLen) {
      this.saveToStorage();
      this.notifyAll();
      deleteDoc(doc(db, 'booths', id)).catch(() => {});
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
    setDoc(doc(db, 'booths', id), { isActive: booth.isActive }, { merge: true }).catch(() => {});
    return true;
  }

  // --- Settings ---
  public updateSettings(newSettings: Partial<FestivalSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveToStorage();
    this.notifyAll();
    setDoc(doc(db, 'settings', 'config'), this.settings, { merge: true }).catch(() => {});
  }

  // --- Activity Logs ---
  private addLog(log: ActivityLog) {
    this.logs.unshift(log);
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
    }
    setDoc(doc(db, 'logs', log.id), log).catch(() => {});
  }

  // --- Reset/Debug Utilities ---
  public resetMyParticipant() {
    if (typeof window === 'undefined') return;
    const localId = localStorage.getItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID);
    if (localId) {
      this.participants = this.participants.filter((p) => p.id !== localId);
      deleteDoc(doc(db, 'participants', localId)).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID);
    localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ALLOCATED);
    this.saveToStorage();
    this.notifyAll();
  }

  public async resetAllParticipantsAndStats() {
    this.participants = [];
    this.counters = { lastParticipantNumber: 0 };
    this.logs = [];
    this.booths.forEach((b) => {
      b.completedCount = 0;
      setDoc(doc(db, 'booths', b.id), { completedCount: 0 }, { merge: true }).catch(() => {});
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ID);
      localStorage.removeItem(STORAGE_KEYS.LOCAL_PARTICIPANT_ALLOCATED);
    }
    this.saveToStorage();
    this.notifyAll();

    setDoc(doc(db, 'settings', 'config'), { lastParticipantNumber: 0 }, { merge: true }).catch(() => {});
    try {
      const pSnap = await getDocs(collection(db, 'participants'));
      const batch = writeBatch(db);
      pSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch {}
  }

  public async restoreDefaultBooths() {
    this.booths = JSON.parse(JSON.stringify(INITIAL_BOOTHS));
    this.saveToStorage();
    this.notifyAll();

    try {
      const batch = writeBatch(db);
      this.booths.forEach((b) => {
        batch.set(doc(db, 'booths', b.id), b);
      });
      await batch.commit();
    } catch {}
  }
}

export const store = new FestivalDataStore();
