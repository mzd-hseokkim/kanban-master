import { FormEvent, useState } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  // 로그인 후 항상 대시보드로 리다이렉트 (보안: 이전 사용자의 URL 접근 방지)
  const redirectTo = '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      console.log('📧 [LoginPage] Attempting login with email:', email);
      await login({ email, password });
      console.log('🎉 [LoginPage] Login successful, redirecting to:', redirectTo);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('❌ [LoginPage] Login failed:', err);
      let message = '로그인에 실패했습니다.';
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string };
        message = data?.message ?? err.message ?? message;
        console.error('❌ [LoginPage] Axios error response:', err.response?.status, data);
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-pastel flex items-center justify-center px-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
        <div className="glass rounded-3xl p-10 shadow-glass hidden md:flex flex-col justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-pastel-blue-500 mb-2">Modern Kanban</p>
            <h1 className="text-4xl font-bold text-pastel-blue-900 leading-tight">
              한눈에 보이는
              <br /> 팀의 모든 일
            </h1>
            <p className="text-pastel-blue-600 mt-6">
              글래스모피즘 UI로 제공되는 최신 칸반 보드에서 프로젝트를 시작해 보세요.
            </p>
          </div>
          <div className="glass rounded-2xl p-5 text-sm text-pastel-blue-800 shadow-glass-sm border border-white/40">
            <p className="font-semibold text-pastel-blue-900">디자인 가이드</p>
            <p className="mt-1 text-pastel-blue-600">
              파스텔 톤, 부드러운 그림자, 뚜렷한 포커스 링으로 브랜드 무드를 유지하세요.
            </p>
          </div>
        </div>

        <div className="glass-light rounded-3xl p-10 shadow-glass">
          <p className="text-sm text-pastel-blue-500 mb-3">팀 계정으로 로그인</p>
          <h2 className="text-2xl font-semibold text-pastel-blue-900 mb-8">Modern Kanban Service</h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-pastel-blue-800 mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-pastel-blue-200/60 bg-white/70 px-4 py-3 text-pastel-blue-900 focus:outline-none focus:ring-2 focus:ring-pastel-blue-400"
                placeholder="team@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-pastel-blue-800 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-pastel-blue-200/60 bg-white/70 px-4 py-3 text-pastel-blue-900 focus:outline-none focus:ring-2 focus:ring-pastel-blue-400"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && (
              <div className="rounded-2xl px-4 py-3 text-sm border border-pastel-pink-200 bg-pastel-pink-50 text-pastel-pink-700 shadow-glass-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-pastel-blue-500 to-pastel-purple-400 text-white font-semibold py-3 shadow-glass-lg transition hover:opacity-90 disabled:opacity-70"
            >
              {submitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-pastel-blue-600">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-pastel-blue-900 font-semibold hover:underline">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
