import React, { useState } from 'react';
import {
  Shield,
  BarChart3,
  QrCode,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Printer,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Gift,
  Camera,
  AlertTriangle,
  Lock,
  LogOut,
  ArrowLeft,
  X,
} from 'lucide-react';
import { ActivityLog, Booth, FestivalSettings, Participant } from '../types';
import { PrintableBoothPoster } from './PrintableBoothPoster';

interface AdminDashboardProps {
  booths: Booth[];
  participants: Participant[];
  settings: FestivalSettings;
  logs: ActivityLog[];
  onBackToVisitorView: () => void;
  onAddBooth: (booth: Omit<Booth, 'id' | 'completedCount'>) => void;
  onUpdateBooth: (id: string, updates: Partial<Booth>) => void;
  onDeleteBooth: (id: string) => void;
  onToggleBoothActive: (id: string) => void;
  onUpdateSettings: (settings: Partial<FestivalSettings>) => void;
  onClaimSnack: (participantId: string) => { success: boolean; message: string };
  onResetAllData: () => void;
  onRestoreDefaultBooths: () => void;
  onOpenStaffSnackScanner: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  booths,
  participants,
  settings,
  logs,
  onBackToVisitorView,
  onAddBooth,
  onUpdateBooth,
  onDeleteBooth,
  onToggleBoothActive,
  onUpdateSettings,
  onClaimSnack,
  onResetAllData,
  onRestoreDefaultBooths,
  onOpenStaffSnackScanner,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'booths' | 'participants' | 'settings'>('stats');

  // Booth Modal state
  const [selectedBoothForPrint, setSelectedBoothForPrint] = useState<Booth | null>(null);
  const [editingBooth, setEditingBooth] = useState<Booth | null>(null);
  const [isAddingBooth, setIsAddingBooth] = useState(false);

  // Booth Form state
  const [boothForm, setBoothForm] = useState({
    name: '',
    category: '체험',
    location: '',
    description: '',
    hint: '',
    qrSecret: '',
    order: booths.length + 1,
    isActive: true,
  });

  // Participant Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'COMPLETED' | 'UNCLAIMED'>('ALL');

  // Settings Form state
  const [settingsForm, setSettingsForm] = useState({
    title: settings.title,
    welcomeMessage: settings.welcomeMessage,
    snackName: settings.snackName,
    snackBoothLocation: settings.snackBoothLocation,
    adminPassword: settings.adminPassword,
  });
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // KPI Calculations
  const totalParticipants = participants.length;
  const completedParticipants = participants.filter((p) => p.isCompleted).length;
  const completionRate = totalParticipants > 0 ? Math.round((completedParticipants / totalParticipants) * 100) : 0;
  const snacksClaimedCount = participants.filter((p) => p.snackClaimed).length;

  const handleOpenAddBooth = () => {
    setBoothForm({
      name: '',
      category: '체험',
      location: '',
      description: '',
      hint: '',
      qrSecret: `kfc-sec-${Math.random().toString(36).substring(2, 8)}`,
      order: booths.length + 1,
      isActive: true,
    });
    setIsAddingBooth(true);
    setEditingBooth(null);
  };

  const handleOpenEditBooth = (booth: Booth) => {
    setBoothForm({
      name: booth.name,
      category: booth.category,
      location: booth.location,
      description: booth.description,
      hint: booth.hint,
      qrSecret: booth.qrSecret,
      order: booth.order,
      isActive: booth.isActive,
    });
    setEditingBooth(booth);
    setIsAddingBooth(true);
  };

  const handleSaveBooth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boothForm.name.trim()) return;

    if (editingBooth) {
      onUpdateBooth(editingBooth.id, boothForm);
    } else {
      onAddBooth(boothForm);
    }
    setIsAddingBooth(false);
    setEditingBooth(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsForm);
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 2500);
  };

  // Filter participants
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.participantNumber).includes(searchQuery.trim());

    if (!matchesSearch) return false;

    if (filterMode === 'COMPLETED') return p.isCompleted;
    if (filterMode === 'UNCLAIMED') return p.isCompleted && !p.snackClaimed;
    return true;
  });

  const getRelativeTimeString = (timestamp: number) => {
    const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSeconds < 60) return `${diffSeconds}초 전`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    return new Date(timestamp).toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 pb-16">
      {/* Top Navbar */}
      <div className="bg-neutral-950 border-b border-neutral-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
                  ADMIN CONSOLE
                </span>
                <span className="text-xs text-neutral-400 font-mono">v1.0</span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                축제 운영진 종합 대시보드
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStaffSnackScanner}
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-amber-200" />
              <span>간식 QR 스캐너</span>
            </button>

            <button
              onClick={onBackToVisitorView}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-neutral-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>참가자 화면</span>
            </button>

            <button
              onClick={() => {
                sessionStorage.removeItem('kfc_admin_auth');
                window.location.hash = '';
                onBackToVisitorView();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-300 text-xs font-semibold transition-colors flex items-center gap-1 border border-neutral-700"
              title="관리자 로그아웃"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto border-t border-neutral-800/80 pt-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'stats'
                ? 'border-amber-500 text-amber-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>실시간 대시보드</span>
          </button>
          <button
            onClick={() => setActiveTab('booths')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'booths'
                ? 'border-amber-500 text-amber-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>부스 & QR 관리</span>
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'participants'
                ? 'border-amber-500 text-amber-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>참가자 & 간식 지급</span>
            <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded-full text-neutral-300">
              {participants.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-400 bg-neutral-900/60'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>축제 설정</span>
          </button>
        </div>
      </div>

      {/* Tab Body */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {/* TAB 1: REALTIME STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  총 실참가자 수
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1.5">
                  <span>{totalParticipants}</span>
                  <span className="text-xs font-normal text-neutral-400">명</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">1개 이상 스캔 활성 참가자</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  전 부스 완주자
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 flex items-baseline gap-1.5">
                  <span>{completedParticipants}</span>
                  <span className="text-xs font-normal text-neutral-400">명</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">100% 스탬프 획득 완료</p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  완주율 (%)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 flex items-baseline gap-1.5">
                  <span>{completionRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block mb-1">
                  간식 수령 수량
                </span>
                <div className="text-2xl sm:text-3xl font-black text-orange-400 flex items-baseline gap-1.5">
                  <span>{snacksClaimedCount}</span>
                  <span className="text-xs font-normal text-neutral-400">/ {completedParticipants}건</span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  미수령 잔여: {Math.max(0, completedParticipants - snacksClaimedCount)}명
                </p>
              </div>
            </div>

            {/* Middle Section: Booth Ranking + Live Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Booth Completion Ranking (7 cols) */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">부스별 방문 완료자 수 랭킹</h3>
                  </div>
                  <span className="text-[11px] text-neutral-400">실시간 누적</span>
                </div>

                <div className="space-y-3.5">
                  {booths
                    .slice()
                    .sort((a, b) => (b.completedCount || 0) - (a.completedCount || 0))
                    .map((b, idx) => {
                      const count = b.completedCount || 0;
                      const maxCount = Math.max(...booths.map((item) => item.completedCount || 0), 1);
                      const barWidth = Math.round((count / maxCount) * 100);

                      return (
                        <div key={b.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 font-medium">
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                  idx === 0
                                    ? 'bg-amber-400 text-neutral-950'
                                    : idx === 1
                                    ? 'bg-neutral-300 text-neutral-950'
                                    : idx === 2
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-neutral-800 text-neutral-400'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span className="text-neutral-200">{b.name}</span>
                              <span className="text-[10px] text-neutral-500">({b.location})</span>
                            </div>
                            <span className="font-mono font-bold text-amber-300">{count}명 완료</span>
                          </div>
                          <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Real-time Activity Feed (5 cols) */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">실시간 현장 활동 피드</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto max-h-80 space-y-2.5 pr-1 text-xs">
                  {logs.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">
                      아직 접수된 현장 활동 기록이 없습니다.
                    </div>
                  ) : (
                    logs.slice(0, 30).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-neutral-200 font-medium leading-snug">{log.message}</p>
                          <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                            {getRelativeTimeString(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOOTH & QR MANAGEMENT */}
        {activeTab === 'booths' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">체험 부스 및 인증 QR 코드 관리</h2>
                <p className="text-xs text-neutral-400">
                  부스 정보를 등록하고 현장에 비치할 A4 인쇄용 QR 포스터를 출력하세요.
                </p>
              </div>
              <button
                onClick={handleOpenAddBooth}
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>새 부스 추가</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {booths.map((booth) => (
                <div
                  key={booth.id}
                  className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-neutral-800 text-white font-bold text-xs flex items-center justify-center">
                          {booth.order}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          {booth.category}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                            booth.isActive
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : 'bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {booth.isActive ? '운영 중' : '비활성'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditBooth(booth)}
                          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                          title="부스 수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`[${booth.name}] 부스를 정말 삭제하시겠습니까?`)) {
                              onDeleteBooth(booth.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-950 text-neutral-400 hover:text-red-400 transition-colors"
                          title="부스 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">{booth.name}</h3>
                    <p className="text-xs text-neutral-400 mb-2">{booth.location}</p>
                    <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed mb-3">
                      {booth.description}
                    </p>

                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800/80 text-[11px] font-mono text-neutral-400 mb-3 truncate">
                      QR 코드: BOOTH:{booth.id}:{booth.qrSecret}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedBoothForPrint(booth)}
                      className="flex-1 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>A4 포스터 인쇄 / QR 보기</span>
                    </button>

                    <button
                      onClick={() => onToggleBoothActive(booth.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        booth.isActive
                          ? 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                          : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800'
                      }`}
                    >
                      {booth.isActive ? '일시 중단' : '운영 재개'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PARTICIPANTS & VOUCHER REDEMPTION */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="참가자 번호 또는 ID 검색..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    filterMode === 'ALL'
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  전체 ({participants.length})
                </button>
                <button
                  onClick={() => setFilterMode('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    filterMode === 'COMPLETED'
                      ? 'bg-emerald-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  완주자만 ({completedParticipants})
                </button>
                <button
                  onClick={() => setFilterMode('UNCLAIMED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    filterMode === 'UNCLAIMED'
                      ? 'bg-orange-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  간식 미수령 ({Math.max(0, completedParticipants - snacksClaimedCount)})
                </button>
              </div>
            </div>

            {/* Participants Table */}
            <div className="rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900 text-neutral-400 font-bold border-b border-neutral-800">
                    <tr>
                      <th className="p-3.5">참가자 번호</th>
                      <th className="p-3.5">고유 ID</th>
                      <th className="p-3.5">완료 부스 현황</th>
                      <th className="p-3.5">진행률</th>
                      <th className="p-3.5">완주 여부</th>
                      <th className="p-3.5">간식 수령 관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500">
                          검색 조건에 일치하는 참가자가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((p) => (
                        <tr key={p.id} className="hover:bg-neutral-900/50 transition-colors">
                          <td className="p-3.5 font-bold text-white">
                            <span className="px-2.5 py-1 rounded-md bg-neutral-800 text-amber-300 font-black">
                              #{p.participantNumber}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-neutral-400">{p.id}</td>
                          <td className="p-3.5">
                            <span className="font-bold text-neutral-200">
                              {p.completedBooths.length}개 완료
                            </span>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                              {p.completedBooths.join(', ')}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-300">{p.progress}%</span>
                              <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{ width: `${p.progress}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            {p.isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/60">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>완주</span>
                              </span>
                            ) : (
                              <span className="text-neutral-500 font-medium">진행 중</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            {p.snackClaimed ? (
                              <div className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>수령 완료</span>
                              </div>
                            ) : p.isCompleted ? (
                              <button
                                onClick={() => onClaimSnack(p.id)}
                                className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <Gift className="w-3 h-3" />
                                <span>간식 지급 승인</span>
                              </button>
                            ) : (
                              <span className="text-neutral-500">완주 대기</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FESTIVAL SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800">
              <h2 className="text-base font-bold text-white mb-1">축제 및 행사 기본 설정</h2>
              <p className="text-xs text-neutral-400 mb-5">
                축제 타이틀 및 리워드 간식 안내 문구를 실시간으로 변경합니다.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-neutral-300 mb-1">축제 명칭 (타이틀)</label>
                  <input
                    type="text"
                    value={settingsForm.title}
                    onChange={(e) => setSettingsForm({ ...settingsForm, title: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-300 mb-1">환영 / 안내 메시지</label>
                  <input
                    type="text"
                    value={settingsForm.welcomeMessage}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, welcomeMessage: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-neutral-300 mb-1">간식 / 리워드 품목명</label>
                    <input
                      type="text"
                      value={settingsForm.snackName}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, snackName: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-300 mb-1">간식 배부처 위치</label>
                    <input
                      type="text"
                      value={settingsForm.snackBoothLocation}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, snackBoothLocation: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-300 mb-1">
                    관리자 대시보드 접근 비밀번호
                  </label>
                  <input
                    type="text"
                    value={settingsForm.adminPassword}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, adminPassword: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-colors shadow-sm"
                  >
                    설정 변경사항 저장
                  </button>
                  {settingsSavedMsg && (
                    <span className="text-xs text-emerald-400 font-bold animate-in fade-in">
                      ✓ 설정이 성공적으로 저장되었습니다.
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Test & Maintenance Tools */}
            <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800">
              <h3 className="text-sm font-bold text-white mb-1">테스트 및 시스템 초기화 도구</h3>
              <p className="text-xs text-neutral-400 mb-4">
                시연 및 현장 행사 전 참가자 스탬프 데이터와 카운터를 초기화할 수 있습니다.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        '주의: 모든 참가자 데이터, 스탬프 기록 및 간식 수령 내역이 초기화됩니다. 계속하시겠습니까?'
                      )
                    ) {
                      onResetAllData();
                      alert('모든 참가자 데이터가 초기화되었습니다.');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 border border-red-800/80 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>전체 참가자 & 스탬프 기록 초기화</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('부스 목록을 최초 4개 기본 부스 데이터로 복원하시겠습니까?')) {
                      onRestoreDefaultBooths();
                      alert('기본 샘플 부스 4개가 복원되었습니다.');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>기본 4개 부스 목록 복원</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOOTH ADD / EDIT MODAL */}
      {isAddingBooth && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="relative w-full max-w-lg bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden p-6 text-neutral-100">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-4">
              <h3 className="text-base font-bold text-white">
                {editingBooth ? '부스 정보 수정' : '새 체험 부스 추가'}
              </h3>
              <button
                onClick={() => setIsAddingBooth(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBooth} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-neutral-300 mb-1">부스명 (아이콘 포함 권장)</label>
                <input
                  type="text"
                  required
                  value={boothForm.name}
                  onChange={(e) => setBoothForm({ ...boothForm, name: e.target.value })}
                  placeholder="예: 🤖 로봇 체험"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-300 mb-1">카테고리</label>
                  <input
                    type="text"
                    required
                    value={boothForm.category}
                    onChange={(e) => setBoothForm({ ...boothForm, category: e.target.value })}
                    placeholder="예: 로봇, AI, 게임"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-300 mb-1">정렬 순서 (번호)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={boothForm.order}
                    onChange={(e) =>
                      setBoothForm({ ...boothForm, order: Number(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1">부스 위치</label>
                <input
                  type="text"
                  required
                  value={boothForm.location}
                  onChange={(e) => setBoothForm({ ...boothForm, location: e.target.value })}
                  placeholder="예: 공학관 1층 101호"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1">부스 설명</label>
                <textarea
                  rows={2}
                  value={boothForm.description}
                  onChange={(e) => setBoothForm({ ...boothForm, description: e.target.value })}
                  placeholder="참가자에게 보여줄 부스 체험 설명"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1">QR 위치 힌트 (선택)</label>
                <input
                  type="text"
                  value={boothForm.hint}
                  onChange={(e) => setBoothForm({ ...boothForm, hint: e.target.value })}
                  placeholder="예: 키오스크 모니터 옆 안내판 부착"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-300 mb-1">
                  QR 보안 비밀 토큰 (문자열)
                </label>
                <input
                  type="text"
                  required
                  value={boothForm.qrSecret}
                  onChange={(e) => setBoothForm({ ...boothForm, qrSecret: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddingBooth(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-colors shadow-sm"
                >
                  {editingBooth ? '수정 내용 저장' : '부스 등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* A4 PRINTABLE POSTER MODAL */}
      {selectedBoothForPrint && (
        <PrintableBoothPoster
          booth={selectedBoothForPrint}
          settings={settings}
          onClose={() => setSelectedBoothForPrint(null)}
        />
      )}
    </div>
  );
};
