import React from 'react';
import { Camera, Gift, Sparkles, CheckCircle2, ChevronRight, User, UserCheck } from 'lucide-react';
import { Booth, FestivalSettings, Participant } from '../types';
import { BoothCard } from './BoothCard';

interface VisitorHomeProps {
  booths: Booth[];
  participant: Participant | null;
  settings: FestivalSettings;
  onOpenScanner: () => void;
  onSelectBoothToScan: (booth: Booth) => void;
  onNavigateToComplete: () => void;
  onQuickSimulateScan: (booth: Booth) => void;
  onOpenRegisterModal?: () => void;
}

export const VisitorHome: React.FC<VisitorHomeProps> = ({
  booths,
  participant,
  settings,
  onOpenScanner,
  onSelectBoothToScan,
  onNavigateToComplete,
  onQuickSimulateScan,
  onOpenRegisterModal,
}) => {
  const activeBooths = booths.filter((b) => b.isActive);
  const totalActive = activeBooths.length;
  const completedCount = participant
    ? participant.completedBooths.filter((id) => activeBooths.some((b) => b.id === id)).length
    : 0;

  const progressPercent = totalActive > 0 ? Math.round((completedCount / totalActive) * 100) : 0;
  const isAllCompleted = participant?.isCompleted || (totalActive > 0 && completedCount >= totalActive);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-28">
      {/* Festival Welcome Notice Banner */}
      <div className="mb-5 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-yellow-200" />
              <span>축제 이벤트 안내</span>
            </span>
            <h2 className="text-base sm:text-lg font-black leading-snug">
              {settings.welcomeMessage}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-xs text-white/90">
              <span>🎁 완주 선물:</span>
              <span className="font-bold underline decoration-white/50 underline-offset-2">
                {settings.snackName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Participant Status Bar */}
      <div
        id="participant-status-bar"
        className="mb-6 p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-xs"
      >
        {!participant ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  참가자 정보를 등록하고 스탬프 투어를 시작해보세요!
                </h3>
                <p className="text-xs text-neutral-500">
                  이름, 나이, 성별을 등록하면 참가자 번호가 발급되고 투어를 진행할 수 있습니다.
                </p>
              </div>
            </div>
            {onOpenRegisterModal && (
              <button
                onClick={onOpenRegisterModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 shadow-sm"
              >
                <User className="w-3.5 h-3.5 text-white" />
                <span>참가자 등록하기</span>
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-xs font-black">
                  참가자 #{participant.participantNumber}
                </span>
                {participant.name && (
                  <span className="text-xs font-extrabold text-neutral-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    {participant.name} ({participant.age ? `${participant.age}세` : ''}
                    {participant.gender ? `/${participant.gender === 'MALE' ? '남' : participant.gender === 'FEMALE' ? '여' : '기타'}` : ''})
                  </span>
                )}
                <span className="text-xs font-bold text-neutral-700">
                  {completedCount} / {totalActive} 부스 완료
                </span>
              </div>
              <span className="text-xs font-extrabold text-orange-600">{progressPercent}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200/60">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 100% Complete Action callout */}
            {isAllCompleted && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-emerald-900">
                    축하합니다! 모든 부스 스탬프를 완료했습니다.
                  </span>
                </div>
                <button
                  onClick={onNavigateToComplete}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>간식 교환권 보기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booths Grid Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">
            체험 부스 스탬프 북
          </h3>
          <p className="text-xs text-neutral-500">
            총 {totalActive}개 부스를 모두 체험하면 간식 교환권이 열립니다.
          </p>
        </div>
      </div>

      {/* Booths Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {activeBooths.map((booth) => {
          const isDone = participant?.completedBooths.includes(booth.id) || false;
          return (
            <BoothCard
              key={booth.id}
              booth={booth}
              isCompleted={isDone}
              onScanThisBooth={() => onSelectBoothToScan(booth)}
              onQuickSimulateScan={() => onQuickSimulateScan(booth)}
            />
          );
        })}
      </div>

      {/* Fixed bottom QR scan CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none z-20">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button
            id="bottom-scan-qr-btn"
            onClick={onOpenScanner}
            className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            <Camera className="w-4 h-4 text-orange-400" />
            <span>현장 부스 QR 스탬프 찍기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
