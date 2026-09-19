import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { Booth, FestivalSettings } from '../types';
import { store } from '../services/store';

interface PrintableBoothPosterProps {
  booth: Booth;
  settings: FestivalSettings;
  onClose: () => void;
}

export const PrintableBoothPoster: React.FC<PrintableBoothPosterProps> = ({
  booth,
  settings,
  onClose,
}) => {
  const qrCodeText = store.generateBoothCode ? store.generateBoothCode(booth) : `BOOTH:${booth.id}:${booth.qrSecret}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold">부스 현장 비치용 A4 포스터 출력</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>포스터 인쇄하기</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Sheet Layout */}
        <div className="p-8 sm:p-12 text-center border-8 border-neutral-900 m-4 rounded-3xl print:m-0 print:border-8 print:border-black print:rounded-none print:min-h-screen flex flex-col justify-between">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 border border-neutral-300 text-xs font-black tracking-widest text-neutral-800 uppercase mb-4">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>{settings.title}</span>
            </div>

            <div className="text-sm sm:text-base font-black tracking-wider text-orange-600 uppercase mb-1">
              OFFICIAL STAMP BOOTH
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight mb-2">
              부스 #{booth.order} {booth.name}
            </h1>

            <div className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-700 bg-neutral-100 px-3 py-1 rounded-lg">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>위치: {booth.location}</span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-600">{booth.category}</span>
            </div>
          </div>

          {/* Center QR Section */}
          <div className="my-6 flex flex-col items-center">
            <div className="p-5 bg-white border-4 border-neutral-900 rounded-3xl shadow-lg print:shadow-none inline-block">
              <QRCodeSVG
                value={qrCodeText}
                size={260}
                level="H"
                includeMargin={false}
                className="w-56 h-56 sm:w-64 sm:h-64"
              />
            </div>

            <div className="mt-4 max-w-md">
              <p className="text-sm sm:text-base font-bold text-neutral-800 leading-snug mb-1">
                {booth.description}
              </p>
              {booth.hint && (
                <p className="text-xs text-amber-700 font-medium bg-amber-50 px-3 py-1 rounded-md border border-amber-200 mt-2 inline-block">
                  💡 안내: {booth.hint}
                </p>
              )}
            </div>
          </div>

          {/* Footer Instructions */}
          <div className="pt-6 border-t-2 border-neutral-200 text-left">
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="text-xs font-black text-neutral-400 uppercase">STEP 1</div>
                <div className="text-xs font-bold text-neutral-900 mt-0.5">카메라로 QR 스캔</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="text-xs font-black text-neutral-400 uppercase">STEP 2</div>
                <div className="text-xs font-bold text-neutral-900 mt-0.5">스탬프 자동 획득</div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <div className="text-xs font-black text-neutral-400 uppercase">STEP 3</div>
                <div className="text-xs font-bold text-neutral-900 mt-0.5">간식 교환처 방문</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span className="truncate">인증 코드: {qrCodeText}</span>
              <span className="shrink-0 flex items-center gap-1 font-sans text-neutral-500">
                <AlertCircle className="w-3 h-3" />
                현장 비치용 공식 인쇄물
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
