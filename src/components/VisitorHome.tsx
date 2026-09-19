import React from 'react';
import { Camera, Gift, Sparkles, CheckCircle2, ChevronRight, Info } from 'lucide-react';
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
}

export const VisitorHome: React.FC<VisitorHomeProps> = ({
  booths,
  participant,
  settings,
  onOpenScanner,
  onSelectBoothToScan,
  onNavigateToComplete,
  onQuickSimulateScan,
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
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  부스를 방문하고 첫 QR을 스캔해보세요!
                </h3>
                <p className="text-xs text-neutral-500">
                  첫 번째 부스 QR 스캔 시 자동으로 참가자 번호가 발급됩니다.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenScanner}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
            >
              <Camera className="w-3.5 h-3.5 text-orange-400" />
              <span>첫 스탬프 찍기</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-xs font-black">
                  참가자 #{participant.participantNumber}
                </span>
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

      {/* Booths Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {booths
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((booth) => {
            const isCompleted = Boolean(participant?.completedBooths.includes(booth.id));
            return (
              <BoothCard
                key={booth.id}
                booth={booth}
                isCompleted={isCompleted}
                onScanThisBooth={() => onSelectBoothToScan(booth)}
                onQuickSimulateScan={onQuickSimulateScan}
              />
            );
          })}
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 p-4 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto flex gap-2">
          <button
            id="floating-qr-scan-btn"
            onClick={onOpenScanner}
            className="flex-1 py-4 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-sm shadow-xl shadow-neutral-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-neutral-700"
          >
            <Camera className="w-5 h-5 text-orange-400 animate-pulse" />
            <span>📷 부스 QR 스캔하기</span>
          </button>

          {isAllCompleted && (
            <button
              id="floating-voucher-btn"
              onClick={onNavigateToComplete}
              className="py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              title="간식 교환권 열기"
            >
              <Gift className="w-5 h-5 text-yellow-200" />
              <span className="hidden sm:inline">간식 교환권</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
