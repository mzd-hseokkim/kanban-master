import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { EmailVerificationPendingPage } from './EmailVerificationPendingPage';

export const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVerificationPending, setShowVerificationPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim() || !name.trim()) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    if (password.length < 8) {
      setError('비밀번호는 최소 8글자 이상이어야 합니다');
      return;
    }

    try {
      setLoading(true);
      await authService.signup({ email, password, name });
      // 회원가입 성공 시 인증 대기 페이지 표시
      setShowVerificationPending(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '회원가입에 실패했습니다';
      setError(message);
      console.error('Signup failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // 인증 대기 페이지 표시
  if (showVerificationPending) {
    return <EmailVerificationPendingPage email={email} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-blue-100 to-pastel-cyan-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-pastel-blue-200">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pastel-blue-900 mb-2">칸반 보드</h1>
          <p className="text-pastel-blue-600">새 계정을 만들어보세요</p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이름 입력 */}
          <div>
            <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full px-4 py-2 rounded-lg bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-900 placeholder-pastel-blue-400 focus:outline-none focus:ring-2 focus:ring-pastel-blue-400 disabled:opacity-50"
              disabled={loading}
            />
          </div>

          {/* 이메일 입력 */}
          <div>
            <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 rounded-lg bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-900 placeholder-pastel-blue-400 focus:outline-none focus:ring-2 focus:ring-pastel-blue-400 disabled:opacity-50"
              disabled={loading}
            />
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
              비밀번호 (8글자 이상)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-900 placeholder-pastel-blue-400 focus:outline-none focus:ring-2 focus:ring-pastel-blue-400 disabled:opacity-50"
              disabled={loading}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 rounded-lg bg-pastel-pink-100 border border-pastel-pink-300 text-pastel-pink-700 text-sm">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        {/* 로그인 링크 */}
        <div className="mt-6 text-center">
          <p className="text-pastel-blue-600">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-pastel-blue-900 font-semibold hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
