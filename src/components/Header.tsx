import React from 'react';
import { Shield, Sparkles, QrCode } from 'lucide-react';
import { FestivalSettings, Participant } from '../types';

interface HeaderProps {
  settings: FestivalSettings;
  participant: Participant | null;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onOpenQuickTest?: () => void;
  onOpenScanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  participant,
  isAdmin,
  onOpenAdmin,
  onOpenQuickTest,
  onOpenScanner,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
            <span>🎪</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/60">
                STAMP TOUR
              </span>
              {participant && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded-full border border-amber-300/50">
                  #{participant.participantNumber}
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-neutral-900 truncate tracking-tight">
              {settings.title}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenQuickTest && (
            <button
              id="header-test-qr-btn"
              onClick={onOpenQuickTest}
              title="테스트 QR 생성 및 빠른 스캔 지원"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 border border-neutral-200 transition-colors flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5 text-neutral-600" />
              <span className="hidden sm:inline">테스트 QR</span>
            </button>
          )}

          <button
            id="header-camera-btn"
            onClick={onOpenScanner}
            className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200/70 transition-colors sm:hidden"
            title="스캐너 열기"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            id="header-admin-btn"
            onClick={onOpenAdmin}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              isAdmin
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'
            }`}
            title="관리자 / 운영진 대시보드"
          >
            <Shield className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-400' : 'text-neutral-500'}`} />
            <span className="hidden sm:inline">{isAdmin ? '운영진 모드' : '관리자'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
