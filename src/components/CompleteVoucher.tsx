import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { Award, CheckCircle2, MapPin, Sparkles, AlertCircle, ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { FestivalSettings, Participant } from '../types';

interface CompleteVoucherProps {
  participant: Participant;
  settings: FestivalSettings;
  onBackToStampBook: () => void;
  onStaffClaimSnack: (participantId: string) => { success: boolean; message: string };
}

export const CompleteVoucher: React.FC<CompleteVoucherProps> = ({
  participant,
  settings,
  onBackToStampBook,
  onStaffClaimSnack,
}) => {
  const [isConfirmingStaff, setIsConfirmingStaff] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  // Trigger confetti on mount
  useEffect(() => {
    try {
      const end = Date.now() + 1.2 * 1000;
      const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch (e) {
      console.warn('Confetti launch error:', e);
    }
  }, []);

  const voucherCode = `KFC-SNACK:${participant.id}`;

  const handleStaffConfirm = () => {
    const result = onStaffClaimSnack(participant.id);
    setClaimMessage(result.message);
    setIsConfirmingStaff(false);
    if (result.success) {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  };

  const formattedCompletedAt = participant.completedAt
    ? new Date(participant.completedAt).toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const formattedClaimedAt = participant.snackClaimedAt
    ? new Date(participant.snackClaimedAt).toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Back Button */}
      <button
        onClick={onBackToStampBook}
        className="mb-4 text-xs font-bold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>스탬프 북 목록으로 돌아가기</span>
      </button>

      {/* Main Voucher Card */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-200 bg-gradient-to-b from-amber-500/10 via-white to-white shadow-xl">
        {/* Top Celebration Ribbon */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-4 text-white text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm text-xs font-black tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>TOUR COMPLETED</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">전 부스 스탬프 완주 리워드</h2>
          <p className="text-xs text-white/90 mt-0.5">운영 본부에서 모바일 교환권을 제시하세요</p>
        </div>

        {/* Voucher Body */}
        <div className="p-6 flex flex-col items-center text-center">
          {/* Participant Number Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 text-white font-extrabold text-sm mb-2 shadow-sm">
            <Award className="w-4 h-4 text-amber-400" />
            <span>참가자 #{participant.participantNumber}</span>
            <span className="text-[11px] text-neutral-400 font-mono">({participant.id})</span>
          </div>

          {participant.name && (
            <div className="text-xs font-black text-neutral-800 bg-amber-100/70 border border-amber-300/60 px-3 py-1 rounded-full mb-4">
              참가자: {participant.name} ({participant.age ? `${participant.age}세` : ''}
              {participant.gender ? `/${participant.gender === 'MALE' ? '남' : participant.gender === 'FEMALE' ? '여' : '기타'}` : ''})
            </div>
          )}

          {/* QR Code Container */}
          <div className="relative p-4 bg-white rounded-2xl border-2 border-neutral-900 shadow-md mb-3 group">
            <QRCodeSVG
              value={voucherCode}
              size={210}
              level="H"
              includeMargin={false}
              className="w-full h-auto"
            />
            {participant.snackClaimed && (
              <div className="absolute inset-0 bg-neutral-950/80 rounded-2xl flex flex-col items-center justify-center text-white backdrop-blur-[2px] animate-in fade-in">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-1" />
                <span className="text-sm font-black text-emerald-300 tracking-wider">간식 수령 완료</span>
                <span className="text-[11px] text-neutral-300 font-medium">{formattedClaimedAt}</span>
              </div>
            )}
          </div>

          {/* Voucher Code String */}
          <div className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-md border border-neutral-200/80 mb-5 select-all">
            {voucherCode}
          </div>

          {/* Snack Info Box */}
          <div className="w-full bg-orange-50/80 rounded-2xl p-4 border border-orange-200 text-left mb-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎁</span>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block mb-0.5">
                  지급 리워드 품목
                </span>
                <div className="text-sm font-extrabold text-neutral-900">{settings.snackName}</div>
                <div className="flex items-center gap-1 text-xs text-neutral-600 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span className="truncate">{settings.snackBoothLocation}</span>
                </div>
              </div>
            </div>
            {formattedCompletedAt && (
              <div className="mt-3 pt-2.5 border-t border-orange-200/60 text-[11px] text-orange-800 flex justify-between">
                <span>완주일시</span>
                <span className="font-semibold">{formattedCompletedAt}</span>
              </div>
            )}
          </div>

          {/* Claim Status and Staff Verification Action */}
          {participant.snackClaimed ? (
            <div className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs font-bold text-center">
                이미 간식 수령이 완료되었습니다. ({formattedClaimedAt})
              </div>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <div className="text-xs text-neutral-500 flex items-center justify-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>운영진 확인 전 [간식 지급 확인]을 누르지 마세요.</span>
              </div>

              {!isConfirmingStaff ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingStaff(true)}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>스태프 전용 현장 간식 지급 확인</span>
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-center animate-in fade-in">
                  <p className="text-xs font-bold text-neutral-900 mb-2">
                    현장 스태프 확인: 간식을 참가자에게 전달하셨습니까?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleStaffConfirm}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                    >
                      예, 간식 지급 완료
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingStaff(false)}
                      className="px-3 py-2 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-semibold transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {claimMessage && (
            <div className="mt-3 text-xs font-semibold text-neutral-700 animate-in fade-in">
              {claimMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
