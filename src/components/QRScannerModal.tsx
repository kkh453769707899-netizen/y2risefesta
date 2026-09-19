import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig, CameraDevice } from 'html5-qrcode';
import { X, Camera, SwitchCamera, Zap, Keyboard, CheckCircle, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { Booth, ScanResult } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (rawCode: string) => ScanResult;
  onNavigateToComplete?: () => void;
  availableBooths: Booth[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
  onNavigateToComplete,
  availableBooths,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);

  // Manual code input
  const [manualCode, setManualCode] = useState('');

  // Result dialog state
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanLockedRef = useRef<boolean>(false);
  const qrRegionId = 'kfc-qr-reader-viewfinder';

  // Clear states when opened/closed
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanResult(null);
      scanLockedRef.current = false;
      setCameraError(null);
    } else {
      scanLockedRef.current = false;
      setScanResult(null);
      if (activeTab === 'camera') {
        startCamera();
      }
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
  };

  const startCamera = async (deviceId?: string) => {
    setCameraError(null);
    setIsStartingCamera(true);

    try {
      await stopCamera();

      // Get available cameras
      let cameraList = cameras;
      if (cameraList.length === 0) {
        try {
          cameraList = await Html5Qrcode.getCameras();
          setCameras(cameraList);
        } catch (e) {
          console.warn('Unable to list cameras:', e);
        }
      }

      const html5QrCode = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrCode;

      const config: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Determine camera constraint: if deviceId specified use it, otherwise use environment
      const cameraConstraint = deviceId
        ? deviceId
        : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConstraint,
        config,
        async (decodedText) => {
          // CRITICAL: Race condition lock
          if (scanLockedRef.current) {
            return;
          }
          scanLockedRef.current = true;

          // Stop camera immediately to prevent repeated triggers
          try {
            await html5QrCode.stop();
          } catch (e) {
            console.warn('Stop on scan error:', e);
          }

          // Process the scan
          const result = onScanResult(decodedText);
          setScanResult(result);
        },
        () => {
          // Frame error (no QR detected in current frame) - ignore
        }
      );

      // Check torch capabilities
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities?.();
        // @ts-expect-error torch capability check
        if (capabilities && capabilities.torch) {
          setHasTorchSupport(true);
        }
      } catch {
        setHasTorchSupport(false);
      }
    } catch (err: unknown) {
      console.error('Camera startup failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        setCameraError('카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용하거나 [직접 코드 입력] 탭을 이용해주세요.');
      } else {
        setCameraError('카메라를 시작할 수 없습니다. 수동 코드 입력을 이용하거나 브라우저를 새로고침 해주세요.');
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    await startCamera(cameras[nextIndex].id);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorchSupport) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        // @ts-expect-error torch constraint
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Continue scanning after closing modal or tapping "다음 부스 스캔"
  const handleResumeScanning = () => {
    setScanResult(null);
    scanLockedRef.current = false;
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    scanLockedRef.current = true;
    const result = onScanResult(manualCode.trim());
    setScanResult(result);
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 leading-tight">부스 QR 스캐너</h2>
              <p className="text-[11px] text-neutral-500">부스에 부착된 인증 QR 코드를 비춰주세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch (Camera vs Manual Input) */}
        <div className="px-5 pt-3 pb-1 bg-neutral-50 flex gap-2 border-b border-neutral-100">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>카메라 스캔</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('manual');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>직접 코드 입력</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col items-center justify-center">
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="w-full flex flex-col items-center">
              {cameraError ? (
                <div className="w-full p-4 rounded-2xl bg-red-50 border border-red-200 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-red-900 mb-1">카메라 연결 안내</p>
                  <p className="text-xs text-red-700 leading-relaxed mb-3">{cameraError}</p>
                  <button
                    onClick={() => setActiveTab('manual')}
                    className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                  >
                    직접 코드 입력으로 전환
                  </button>
                </div>
              ) : (
                <div className="relative w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-neutral-800 shadow-inner">
                  {/* html5-qrcode mount container */}
                  <div id={qrRegionId} className="w-full h-full" />

                  {/* Laser line animation */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse pointer-events-none" />

                  {/* Viewfinder Target Border Overlay */}
                  <div className="absolute inset-4 pointer-events-none border-2 border-white/40 rounded-xl">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-400 -mt-0.5 -ml-0.5" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-400 -mt-0.5 -mr-0.5" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-400 -mb-0.5 -ml-0.5" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-400 -mb-0.5 -mr-0.5" />
                  </div>

                  {isStartingCamera && (
                    <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center text-white p-4">
                      <RefreshCw className="w-6 h-6 animate-spin text-orange-400 mb-2" />
                      <span className="text-xs font-semibold">카메라 활성화 중...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Camera Controls bar */}
              {!cameraError && (
                <div className="mt-4 flex items-center gap-2">
                  {cameras.length > 1 && (
                    <button
                      type="button"
                      onClick={switchCamera}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <SwitchCamera className="w-3.5 h-3.5" />
                      <span>카메라 전환</span>
                    </button>
                  )}

                  {hasTorchSupport && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        torchOn
                          ? 'bg-amber-400 text-neutral-900 font-bold'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{torchOn ? '플래시 끄기' : '플래시 켜기'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MANUAL INPUT TAB */}
          {activeTab === 'manual' && (
            <div className="w-full">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    인증 코드 또는 QR 텍스트 입력
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="예: BOOTH:booth-1:kfc-sec-robot-8821"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">
                    부스 안내판의 코드 문자열이나 QR 링크를 직접 입력할 수 있습니다.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  스탬프 인증 확인
                </button>
              </form>

              {/* Quick Select Buttons for demo / fast testing */}
              <div className="mt-5 pt-4 border-t border-neutral-100">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  체험 부스 빠른 선택 (테스트 지원)
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {availableBooths.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        const code = `BOOTH:${b.id}:${b.qrSecret}`;
                        setManualCode(code);
                      }}
                      className="p-2 rounded-lg bg-neutral-50 hover:bg-orange-50 border border-neutral-200 hover:border-orange-200 text-left transition-colors"
                    >
                      <div className="text-[11px] font-bold text-neutral-800 truncate">{b.name}</div>
                      <div className="text-[10px] text-neutral-500 font-mono truncate">BOOTH:{b.id}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SCAN RESULT POPUP / MODAL OVERLAY */}
        {scanResult && (
          <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
            {scanResult.success ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-sm animate-bounce">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider mb-1">
                  STAMP VERIFIED!
                </span>
                <h3 className="text-lg font-black text-neutral-900 mb-1">
                  {scanResult.booth?.name || '부스 인증 완료'}
                </h3>
                <p className="text-xs text-neutral-600 mb-4 max-w-xs leading-relaxed">
                  {scanResult.message}
                </p>

                {scanResult.newlyAllocated && scanResult.participant && (
                  <div className="mb-4 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-900 font-medium">
                    🎉 첫 방문 환영합니다! 참가자 번호{' '}
                    <span className="font-extrabold text-orange-700">
                      #{scanResult.participant.participantNumber}
                    </span>
                    이 발급되었습니다.
                  </div>
                )}

                {scanResult.isTourCompleted ? (
                  <div className="w-full space-y-2">
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 font-bold">
                      🎊 모든 부스 완주 달성! 간식 교환권이 생성되었습니다.
                    </div>
                    {onNavigateToComplete && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToComplete();
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5"
                      >
                        <span>간식 교환권 확인하러 가기</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleResumeScanning}
                    className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs shadow-md transition-all active:scale-98"
                  >
                    다음 부스 스캔하기
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="mt-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 py-1"
                >
                  스탬프 북으로 돌아가기
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3 shadow-sm">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-base font-extrabold text-neutral-900 mb-1">
                  {scanResult.isAlreadyCompleted ? '이미 완료된 부스' : '스캔 알림'}
                </h3>
                <p className="text-xs text-neutral-600 mb-5 max-w-xs leading-relaxed">
                  {scanResult.message}
                </p>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={handleResumeScanning}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition-colors"
                  >
                    다시 시도하기
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs transition-colors"
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
