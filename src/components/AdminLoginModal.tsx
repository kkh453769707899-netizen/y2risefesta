import React, { useState } from 'react';
import { Lock, X, Shield, ArrowRight } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctPassword: string;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  correctPassword,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword || password === 'admin1234') {
      sessionStorage.setItem('kfc_admin_auth', 'true');
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
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

        <h3 className="text-base font-extrabold text-white mb-1">운영진 인증</h3>
        <p className="text-xs text-neutral-400 mb-5">
          축제 관리자 대시보드 접근을 위해 비밀번호를 입력해주세요. (기본: admin1234)
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="관리자 비밀번호"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-500"
              />
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-red-400 font-medium">
                비밀번호가 일치하지 않습니다. 다시 입력해주세요.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>대시보드 접속</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
