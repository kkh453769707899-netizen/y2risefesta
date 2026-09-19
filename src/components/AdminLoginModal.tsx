import React, { useState } from 'react';
import { Lock, X, Shield, ArrowRight, User } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctPassword: string;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ID: 수련관, PW: 9826 (외부 유출/공유되지 않도록 내부 고정)
    if (adminId.trim() === '수련관' && password.trim() === '9826') {
      sessionStorage.setItem('kfc_admin_auth', 'true');
      setError(false);
      setAdminId('');
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/85 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="relative w-full max-w-sm bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl p-6 text-neutral-100 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3">
          <Shield className="w-6 h-6" />
        </div>

        <h3 className="text-base font-extrabold text-white mb-1">운영진 전용 로그인</h3>
        <p className="text-xs text-neutral-400 mb-5">
          축제 운영진 계정 아이디와 비밀번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-neutral-300 mb-1">관리자 아이디</label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                value={adminId}
                onChange={(e) => {
                  setAdminId(e.target.value);
                  setError(false);
                }}
                placeholder="아이디 입력"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-300 mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="비밀번호 입력"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-medium">
              아이디 또는 비밀번호가 일치하지 않습니다.
            </p>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>운영 대시보드 로그인</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
