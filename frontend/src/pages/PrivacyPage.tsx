import { Link } from 'react-router-dom';
import {
  HiBadgeCheck,
  HiClipboardCheck,
  HiClock,
  HiLockClosed,
  HiServer,
  HiShieldCheck,
  HiSparkles,
} from 'react-icons/hi';

const PrivacyPage = () => {
  const principles = [
    {
      title: '필요한 정보만 수집',
      description: '업무 협업에 꼭 필요한 계정 정보, 워크스페이스/보드 메타데이터, 활동 로그만 최소한으로 사용합니다.',
      icon: HiClipboardCheck,
    },
    {
      title: '투명한 활용',
      description: '알림 제공, 접속 보안, 서비스 품질 개선 목적 외에는 데이터를 사용하지 않으며 언제든 열람·삭제를 요청할 수 있습니다.',
      icon: HiShieldCheck,
    },
    {
      title: '안전한 보호',
      description: '전송 구간 TLS 암호화, 역할 기반 접근 통제, 주기적 백업으로 팀의 정보를 안전하게 지킵니다.',
      icon: HiLockClosed,
    },
  ];

  const dataPractices = [
    {
      title: '수집·이용 항목',
      icon: HiSparkles,
      items: [
        '계정: 이메일, 이름, 프로필 이미지(선택), 소셜 로그인 식별자',
        '업무 데이터: 워크스페이스·보드·카드 메타데이터와 작성·변경 이력',
        '접속/보안: 로그인 기록, 기기·브라우저 유형, 오류 로그(개인 식별 불가)',
      ],
    },
    {
      title: '보관 기간',
      icon: HiClock,
      items: [
        '계정이 활성 상태인 동안 보관하며, 탈퇴 요청 시 즉시 비활성화 후 30일 내 완전 삭제',
        '법적 의무가 있거나 백업 보존이 필요한 경우 최소한으로 분리 보관',
      ],
    },
    {
      title: '제3자 제공 및 처리',
      icon: HiServer,
      items: [
        '법적 요구사항이 있는 경우를 제외하고 임의로 제3자에게 판매·공유하지 않음',
        '필수 인프라(호스팅·알림)에 한해 위탁하며, 동일한 보안 기준을 적용',
      ],
    },
  ];

  const rights = [
    '데이터 열람·수정: 프로필 및 팀 정보는 프로필/보드 설정에서 바로 확인하고 수정할 수 있습니다.',
    '삭제·정정 요청: 필요 시 support@kanban-master.com으로 연락 주시면 신속히 처리합니다.',
    '동의 철회: 이메일 알림/마케팅 설정은 알림 설정에서 언제든 변경할 수 있습니다.',
    '문의 응대: 개인정보 관련 질문은 3영업일 내 1차 답변을 드립니다.',
  ];

  return (
    <div className="h-full bg-gradient-pastel flex flex-col overflow-hidden">
      <main className="flex-1 overflow-auto">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="glass-light rounded-3xl border border-white/40 shadow-glass-lg p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600/80 to-cyan-500/80 text-white flex items-center justify-center shadow-lg">
                <HiBadgeCheck className="text-2xl" />
              </div>
              <div>
                <p className="text-sm font-semibold text-pastel-blue-600 mb-1">Privacy Policy</p>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">개인정보 처리방침</h1>
                <p className="text-slate-600 mt-3 leading-relaxed">
                  Kanban Master는 협업에 꼭 필요한 정보만 수집하고, 안전하게 보호하며, 투명하게 안내합니다.
                  아래 내용을 확인하시고 궁금한 점은 언제든 문의해 주세요.
                </p>
                <div className="flex flex-wrap gap-3 mt-4 text-sm text-pastel-blue-600">
                  <span className="px-3 py-1 rounded-full bg-white/70 border border-white/60">최종 업데이트: 2024. 12.</span>
                  <span className="px-3 py-1 rounded-full bg-white/70 border border-white/60">개발 환경: HTTPS & RBAC</span>
                </div>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {principles.map(({ title, description, icon: Icon }) => (
              <div key={title} className="glass-light rounded-2xl p-5 border border-white/40 shadow-glass">
                <div className="h-10 w-10 rounded-xl bg-white/70 flex items-center justify-center text-blue-600 shadow-inner mb-3">
                  <Icon className="text-xl" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">{title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </section>

          <section className="space-y-4 mb-10">
            {dataPractices.map(({ title, items, icon: Icon }) => (
              <div key={title} className="glass-light rounded-2xl p-6 border border-white/50 shadow-glass">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 text-blue-600 flex items-center justify-center">
                    <Icon className="text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-700">
                  {items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="glass-light rounded-2xl p-6 border border-white/50 shadow-glass mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-400/20 text-emerald-600 flex items-center justify-center">
                <HiBadgeCheck className="text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">이용자 권리 안내</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rights.map((item) => (
                <div key={item} className="flex gap-3 items-start bg-white/70 border border-white/60 rounded-xl px-4 py-3">
                  <span className="text-emerald-600 mt-0.5">✓</span>
                  <p className="text-sm text-slate-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-cyan-400 transition"
              >
                문의하기
              </Link>
              <a
                href="mailto:support@kanban-master.com"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/80 border border-white/70 text-pastel-blue-700 font-semibold hover:border-blue-200 hover:text-blue-700 transition"
              >
                support@kanban-master.com
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
