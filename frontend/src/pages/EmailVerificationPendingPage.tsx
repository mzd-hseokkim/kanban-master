import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/authService';

interface EmailVerificationPendingPageProps {
  email: string;
}

export const EmailVerificationPendingPage: React.FC<EmailVerificationPendingPageProps> = ({ email }) => {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    try {
      setResending(true);
      setError(null);
      await authService.resendVerificationEmail(email);
      setResent(true);

      // 3초 후 다시 재발송 가능하도록
      setTimeout(() => {
        setResent(false);
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '인증 메일 재발송에 실패했습니다';
      setError(message);
      console.error('Resend verification email failed:', err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-blue-100 to-pastel-cyan-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-pastel-blue-200">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pastel-yellow-100">
              <svg className="w-10 h-10 text-pastel-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-pastel-blue-900 mb-2">이메일 인증이 필요합니다</h1>
          <p className="text-pastel-blue-600">
            회원가입이 거의 완료되었습니다!
          </p>
        </div>

        {/* 안내 메시지 */}
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-lg bg-pastel-blue-50 border border-pastel-blue-200">
            <p className="text-pastel-blue-900 text-sm mb-2">
              <span className="font-semibold">{email}</span> 주소로 인증 메일을 발송했습니다.
            </p>
            <p className="text-pastel-blue-600 text-sm">
              이메일을 확인하고 인증 링크를 클릭해주세요. 인증이 완료되면 바로 로그인하실 수 있습니다.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-pastel-yellow-50 border border-pastel-yellow-200">
            <p className="text-pastel-yellow-900 text-sm font-semibold mb-1">
              ⏱️ 인증 링크는 24시간 동안 유효합니다
            </p>
            <p className="text-pastel-yellow-700 text-xs">
              이메일이 오지 않았다면 스팸 폴더를 확인해주세요.
            </p>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-pastel-pink-100 border border-pastel-pink-300 text-pastel-pink-700 text-sm">
            {error}
          </div>
        )}

        {/* 성공 메시지 */}
        {resent && (
          <div className="mb-4 p-3 rounded-lg bg-pastel-green-100 border border-pastel-green-300 text-pastel-green-700 text-sm">
            인증 메일을 다시 발송했습니다!
          </div>
        )}

        {/* 재발송 버튼 */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleResend}
            disabled={resending || resent}
            className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? '발송 중...' : resent ? '발송 완료' : '인증 메일 다시 받기'}
          </button>
        </div>

        {/* 로그인 링크 */}
        <div className="text-center">
          <p className="text-pastel-blue-600 text-sm">
            이미 인증을 완료하셨나요?{' '}
            <Link to="/login" className="text-pastel-blue-900 font-semibold hover:underline">
              로그인하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
