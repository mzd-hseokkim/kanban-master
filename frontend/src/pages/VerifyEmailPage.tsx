import { authService } from '@/services/authService';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const VerifyEmailPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setErrorMessage('인증 토큰이 없습니다.');
            return;
        }

        const abortController = new AbortController();

        const verifyEmail = async () => {
            // React StrictMode에서 중복 실행 방지

            try {
                console.log('🔵 [VerifyEmailPage] Starting email verification...');
                await authService.verifyEmail(token, abortController.signal);

                console.log('✅ [VerifyEmailPage] Email verification successful');
                setStatus('success');

                // 즉시 로그인 페이지로 이동 (히스토리 교체, 인증 성공 상태 전달)
                navigate('/login', { replace: true, state: { verified: true } });
            } catch (err) {
                // AbortError는 정상적인 취소이므로 무시
                if (err instanceof Error && err.name === 'AbortError') {
                    console.log('⚠️ [VerifyEmailPage] Request aborted (component unmounted)');
                    return;
                }

                setStatus('error');
                let message = '이메일 인증에 실패했습니다';

                if (err instanceof Error) {
                    message = err.message;
                }

                setErrorMessage(message);
                console.error('❌ [VerifyEmailPage] Email verification failed:', err);
            }
        };

        verifyEmail();

        // Cleanup: 컴포넌트가 언마운트되면 요청 취소
        return () => {
            abortController.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-pastel-blue-100 to-pastel-cyan-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-pastel-blue-200">
                {status === 'verifying' && (
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pastel-blue-500"></div>
                        </div>
                        <h1 className="text-2xl font-bold text-pastel-blue-900 mb-2">이메일 인증 중...</h1>
                        <p className="text-pastel-blue-600">잠시만 기다려주세요.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pastel-green-100">
                                <svg
                                    className="w-10 h-10 text-pastel-green-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-pastel-blue-900 mb-2">인증 완료!</h1>
                        <p className="text-pastel-blue-600 mb-4">이메일 인증이 성공적으로 완료되었습니다.</p>
                        <p className="text-sm text-pastel-blue-500">잠시 후 로그인 페이지로 이동합니다...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pastel-pink-100">
                                <svg
                                    className="w-10 h-10 text-pastel-pink-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-pastel-blue-900 mb-2">인증 실패</h1>
                        <p className="text-pastel-pink-600 mb-6">{errorMessage || '이메일 인증에 실패했습니다.'}</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:opacity-90 transition"
                            >
                                로그인 페이지로 이동
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-4 py-2 rounded-lg bg-pastel-blue-100 text-pastel-blue-900 font-semibold hover:bg-pastel-blue-200 transition"
                            >
                                다시 시도
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
