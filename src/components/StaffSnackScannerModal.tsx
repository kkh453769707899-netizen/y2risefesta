import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { X, Camera, CheckCircle2, AlertTriangle, Gift, Search, RefreshCw, UserCheck } from 'lucide-react';
import { Participant } from '../types';
import { store } from '../services/store';

interface StaffSnackScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimSuccess: () => void;
}

export const StaffSnackScannerModal: React.FC<StaffSnackScannerModalProps> = ({
  isOpen,
  onClose,
  onClaimSuccess,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    participant?: Participant;
    alreadyClaimed?: boolean;
  } | null>(null);

  const [claimStatusMsg, setClaimStatusMsg] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanLockedRef = useRef<boolean>(false);
  const qrRegionId = 'staff-snack-scanner-viewfinder';

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setVerificationResult(null);
      setClaimStatusMsg(null);
      scanLockedRef.current = false;
    } else {
      scanLockedRef.current = false;
      setVerificationResult(null);
      setClaimStatusMsg(null);
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        console.warn('Error stopping staff scanner:', e);
      }
      scannerRef.current = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      await stopCamera();
      const html5QrCode = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrCode;

      const config: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          if (scanLockedRef.current) return;
          scanLockedRef.current = true;

          try {
            await html5QrCode.stop();
          } catch {}

          const res = store.processStaffSnackScan(decodedText);
          setVerificationResult(res);
        },
        () => {}
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setCameraError('카메라를 시작할 수 없습니다. 수동 참가자 번호 조회를 이용해주세요.');
      console.warn('Staff camera start error:', errMsg);
    }
  };

  const handleResume = () => {
    setVerificationResult(null);
    setClaimStatusMsg(null);
    scanLockedRef.current = false;
    startCamera();
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    scanLockedRef.current = true;
    const res = store.processStaffSnackScan(manualInput.trim());
    setVerificationResult(res);
  };

  const handleApproveClaim = (participantId: string) => {
    const result = store.claimSnack(participantId);
    setClaimStatusMsg(result.message);
    if (result.success) {
      onClaimSuccess();
      if (verificationResult?.participant) {
        verificationResult.participant.snackClaimed = true;
        verificationResult.participant.snackClaimedAt = Date.now();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-sm p-3 sm:p-4 flex items-center justify-center">
      <div className="relative w-full max-w-md bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col text-neutral-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">스태프 간식 지급 검증기</h2>
              <p className="text-[11px] text-neutral-400">참가자 완주 교환권 QR을 스캔하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder area */}
        <div className="p-5 flex flex-col items-center justify-center">
          {cameraError ? (
            <div className="w-full p-4 rounded-2xl bg-neutral-800 text-center mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-1" />
              <p className="text-xs text-neutral-300">{cameraError}</p>
            </div>
          ) : (
            <div className="relative w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-neutral-800 shadow-inner mb-4">
              <div id={qrRegionId} className="w-full h-full" />
              <div className="absolute inset-4 pointer-events-none border-2 border-white/30 rounded-xl">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-400" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orange-400" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange-400" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-400" />
              </div>
            </div>
          )}

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSearch} className="w-full space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="교환권 코드(KFC-SNACK:...) 또는 번호(1, 2...)"
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-hidden focus:border-orange-500 font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>조회</span>
              </button>
            </div>
          </form>
        </div>

        {/* Verification Result Overlay */}
        {verificationResult && (
          <div className="absolute inset-0 z-30 bg-neutral-900/98 p-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
            {verificationResult.success && verificationResult.participant ? (
              <>
                <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400 flex items-center justify-center mb-3">
                  <UserCheck className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 mb-1">
                  VERIFIED PARTICIPANT
                </span>
                <h3 className="text-xl font-black text-white mb-1">
                  참가자 #{verificationResult.participant.participantNumber}
                </h3>
                <p className="text-xs text-neutral-400 font-mono mb-4">
                  {verificationResult.participant.id}
                </p>

                <div className="w-full bg-neutral-950 rounded-2xl p-4 border border-neutral-800 text-left mb-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">부스 완주 현황</span>
                    <span className="text-emerald-400 font-bold">
                      {verificationResult.participant.completedBooths.length}개 전체 완료 (100%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">완주 일시</span>
                    <span className="text-neutral-200">
                      {verificationResult.participant.completedAt
                        ? new Date(verificationResult.participant.completedAt).toLocaleTimeString()
                        : '-'}
                    </span>
                  </div>
                </div>

                {!verificationResult.participant.snackClaimed ? (
                  <button
                    onClick={() => handleApproveClaim(verificationResult.participant!.id)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 mb-2"
                  >
                    <Gift className="w-4 h-4" />
                    <span>원터치 간식 지급 승인</span>
                  </button>
                ) : (
                  <div className="w-full p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold mb-3 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>간식 지급 처리가 완료되었습니다.</span>
                  </div>
                )}

                {claimStatusMsg && (
                  <p className="text-xs text-neutral-300 font-medium mb-3">{claimStatusMsg}</p>
                )}

                <button
                  onClick={handleResume}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
                >
                  다음 참가자 스캔하기
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  {verificationResult.alreadyClaimed ? '이미 수령된 교환권' : '지급 불가 안내'}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mb-5 max-w-xs">
                  {verificationResult.message}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleResume}
                    className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors"
                  >
                    다시 스캔하기
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-neutral-950 text-neutral-400 hover:text-white text-xs transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
