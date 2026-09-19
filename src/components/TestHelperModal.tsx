import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Sparkles, RefreshCw, QrCode } from 'lucide-react';
import { Booth, Participant } from '../types';
import { store } from '../services/store';

interface TestHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  booths: Booth[];
  participant: Participant | null;
  onSimulateScan: (code: string) => void;
  onResetMyParticipant: () => void;
}

export const TestHelperModal: React.FC<TestHelperModalProps> = ({
  isOpen,
  onClose,
  booths,
  participant,
  onSimulateScan,
  onResetMyParticipant,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-center">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="text-sm font-bold">체험 부스 테스트 QR 코드</h3>
              <p className="text-[11px] text-neutral-400">
                물리적 인쇄물 없이 화면에서 바로 스캔하거나 1-클릭 인증할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold">현재 내 기기 상태: </span>
              {participant ? (
                <span className="font-bold text-orange-700">
                  참가자 #{participant.participantNumber} ({participant.completedBooths.length}/
                  {booths.length}개 완료)
                </span>
              ) : (
                <span className="text-neutral-600">미등록 (첫 QR 스캔 시 자동 발급)</span>
              )}
            </div>
            {participant && (
              <button
                type="button"
                onClick={onResetMyParticipant}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 text-[11px] font-bold hover:bg-amber-100 flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                <span>내 번호 초기화</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {booths.map((booth) => {
              const rawCode = store.generateBoothCode
                ? store.generateBoothCode(booth)
                : `BOOTH:${booth.id}:${booth.qrSecret}`;
              const isDone = Boolean(participant?.completedBooths.includes(booth.id));

              return (
                <div
                  key={booth.id}
                  className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all ${
                    isDone
                      ? 'bg-neutral-50 border-neutral-200 opacity-80'
                      : 'bg-white border-neutral-200 shadow-xs hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-xs font-bold text-neutral-900 truncate">
                      #{booth.order} {booth.name}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                        완료
                      </span>
                    )}
                  </div>

                  {/* QR Code thumbnail */}
                  <div className="p-2 bg-white rounded-xl border border-neutral-200 shadow-xs mb-2">
                    <QRCodeSVG value={rawCode} size={110} level="M" />
                  </div>

                  <p className="text-[10px] font-mono text-neutral-400 truncate w-full mb-2">
                    {rawCode}
                  </p>

                  <div className="flex gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => handleCopy(rawCode, booth.id)}
                      className="flex-1 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      {copiedId === booth.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>복사됨</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>코드 복사</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSimulateScan(rawCode)}
                      disabled={isDone}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 ${
                        isDone
                          ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                          : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>즉시 스탬프</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
