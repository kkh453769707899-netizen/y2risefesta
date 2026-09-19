import React, { useState } from 'react';
import { MapPin, ChevronDown, ChevronUp, CheckCircle2, QrCode, Sparkles } from 'lucide-react';
import { Booth } from '../types';

interface BoothCardProps {
  booth: Booth;
  isCompleted: boolean;
  onScanThisBooth: (booth: Booth) => void;
  onQuickSimulateScan?: (booth: Booth) => void;
}

export const BoothCard: React.FC<BoothCardProps> = ({
  booth,
  isCompleted,
  onScanThisBooth,
  onQuickSimulateScan,
}) => {
  const [showHint, setShowHint] = useState(false);

  return (
    <div
      id={`booth-card-${booth.id}`}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        isCompleted
          ? 'bg-gradient-to-b from-amber-50/70 to-white border-amber-200 shadow-xs'
          : booth.isActive
          ? 'bg-white border-neutral-200/90 hover:border-orange-300 hover:shadow-md shadow-xs'
          : 'bg-neutral-50/80 border-neutral-200 opacity-60'
      }`}
    >
      {/* Top Banner & Badges */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-900 text-white font-black text-xs">
              {booth.order}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200/60">
              {booth.category}
            </span>
            {!booth.isActive && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-200 text-neutral-600">
                운영 준비 중
              </span>
            )}
          </div>

          {/* Stamp Ink Badge when completed */}
          {isCompleted && (
            <div className="animate-in fade-in zoom-in-75 duration-300 transform rotate-[-6deg] select-none shrink-0">
              <div className="border-2 border-red-500 rounded-full px-2.5 py-1 flex items-center gap-1 bg-red-50/90 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                <span className="text-[11px] font-black tracking-widest text-red-600 uppercase">
                  STAMPED
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Booth Title */}
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-1 tracking-tight flex items-center gap-1.5">
          {booth.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-2 font-medium">
          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
          <span className="truncate">{booth.location}</span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed line-clamp-2 mb-3">
          {booth.description}
        </p>

        {/* Hint Accordion */}
        {booth.hint && (
          <div className="mb-3.5">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 bg-amber-50 hover:bg-amber-100/80 px-2 py-1 rounded-md transition-colors w-full justify-between"
            >
              <span className="flex items-center gap-1">
                <span>💡</span> QR 위치 힌트 확인
              </span>
              {showHint ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showHint && (
              <div className="mt-1.5 p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-relaxed animate-in fade-in-50 duration-150">
                {booth.hint}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 border-t border-neutral-100 flex items-center gap-2">
          {isCompleted ? (
            <div className="w-full py-2 px-3 rounded-xl bg-red-50 text-red-700 border border-red-200/70 text-xs font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-red-600" />
              <span>스탬프 인증 완료</span>
            </div>
          ) : (
            <>
              <button
                id={`booth-scan-btn-${booth.id}`}
                disabled={!booth.isActive}
                onClick={() => onScanThisBooth(booth)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  booth.isActive
                    ? 'bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white shadow-xs'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                <QrCode className="w-4 h-4 text-orange-400" />
                <span>QR 스캔하기</span>
              </button>

              {onQuickSimulateScan && booth.isActive && (
                <button
                  onClick={() => onQuickSimulateScan(booth)}
                  title="테스트 환경 즉시 스탬프 적립"
                  className="px-2.5 py-2.5 rounded-xl text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/70 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span className="hidden sm:inline">테스트 인증</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
