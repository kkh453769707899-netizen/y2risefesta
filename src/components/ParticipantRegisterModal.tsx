import React, { useState } from 'react';
import { Sparkles, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';
import { GenderType } from '../types';

interface ParticipantRegisterModalProps {
  isOpen: boolean;
  onRegister: (data: { name: string; age: number; gender: GenderType }) => void;
  festivalTitle: string;
}

export const ParticipantRegisterModal: React.FC<ParticipantRegisterModalProps> = ({
  isOpen,
  onRegister,
  festivalTitle,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<GenderType>('MALE');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedAge = parseInt(age, 10);

    if (!trimmedName) {
      setErrorMessage('참가자 이름을 입력해주세요.');
      return;
    }

    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      setErrorMessage('올바른 나이를 입력해주세요. (1 ~ 120)');
      return;
    }

    setErrorMessage('');
    onRegister({
      name: trimmedName,
      age: parsedAge,
      gender,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl border border-neutral-200 shadow-2xl p-6 sm:p-7 text-neutral-900 animate-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 text-white flex items-center justify-center mb-3.5 shadow-md">
          <UserCheck className="w-6 h-6" />
        </div>

        {/* Title */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-[11px] font-extrabold text-orange-600 mb-1 border border-orange-200/60">
            <Sparkles className="w-3 h-3 text-orange-500" />
            <span>스탬프 투어 참가 등록</span>
          </div>
          <h3 className="text-lg font-black text-neutral-900 tracking-tight">
            참가자 정보 등록
          </h3>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            <strong className="text-neutral-800">{festivalTitle}</strong> 스탬프 투어 참여를 위해 기본 정보를 입력해주세요.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              maxLength={20}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage('');
              }}
              placeholder="예: 홍길동"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Age input */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              나이 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              max={120}
              value={age}
              onChange={(e) => {
                setAge(e.target.value);
                setErrorMessage('');
              }}
              placeholder="예: 15"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Gender selection */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              성별 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('MALE')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                  gender === 'MALE'
                    ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-xs'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                남성
              </button>
              <button
                type="button"
                onClick={() => setGender('FEMALE')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                  gender === 'FEMALE'
                    ? 'bg-rose-50 text-rose-700 border-rose-400 shadow-xs'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                여성
              </button>
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-500 font-medium">{errorMessage}</p>
          )}

          {/* Privacy Note */}
          <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-neutral-500 leading-tight">
              입력하신 정보는 축제 행사 참가자 집계 및 간식 수령 확인용으로만 안전하게 관리됩니다.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>등록하고 참가하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
