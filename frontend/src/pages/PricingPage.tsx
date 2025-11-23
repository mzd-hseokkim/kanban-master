import { Link } from 'react-router-dom';
import {
  HiCheckCircle,
  HiLightningBolt,
  HiShieldCheck,
  HiSparkles,
} from 'react-icons/hi';

type Plan = {
  name: string;
  badge: string;
  price: string;
  description: string;
  highlight?: boolean;
  note?: string;
  ctaLabel: string;
  ctaTo: string;
  features: string[];
};

const plans: Plan[] = [
  {
    name: 'Free',
    badge: '개인용 시작',
    price: '무료',
    description: '개인 프로젝트와 테스트 환경에 적합한 기본 플랜',
    ctaLabel: '무료로 시작',
    ctaTo: '/signup',
    features: [
      '보드·컬럼·카드 기본 관리',
      '라벨, 활동 로그, 보드 템플릿 저장',
      '워크스페이스 생성 및 기본 검색',
      '이메일 기본 지원',
    ],
  },
  {
    name: 'Personal Plan',
    badge: '출시 예정',
    price: '가격 책정 중',
    description: '개인 생산성 강화를 위한 프리미엄 기능 번들',
    note: '현재 가격 책정 중입니다. 출시 알림을 요청해주세요.',
    ctaLabel: '출시 알림 문의',
    ctaTo: '/contact',
    features: [
      '모든 Free 기능 포함',
      '무제한 보드/워크스페이스 및 템플릿 컬렉션',
      '고급 검색 필터와 즐겨찾기 보드',
      '이메일 우선 응답',
    ],
  },
  {
    name: 'Team Plan',
    badge: '팀 추천',
    price: '가격 책정 중',
    description: '실시간 협업과 데이터 관리가 필요한 팀을 위한 표준 플랜',
    note: 'Excel/CSV 내보내기·가져오기 및 WebSocket 실시간 동기화 포함',
    highlight: true,
    ctaLabel: '팀 플랜 상담',
    ctaTo: '/contact',
    features: [
      '모든 Personal Plan 기능 포함',
      '역할 기반 멤버 권한 및 워크스페이스 초대',
      'Excel/CSV 데이터 가져오기·내보내기',
      '실시간 보드 동기화 (WebSocket)와 활동 로그 확대',
      '템플릿 공유·잠금으로 팀 표준 유지',
      '우선 순위 제품/기술 지원',
    ],
  },
  {
    name: 'Enterprise Plan',
    badge: '맞춤 협의',
    price: 'Contact Us',
    description: '보안·컴플라이언스와 대규모 운영을 위한 엔터프라이즈 플랜',
    note: '아키텍처 검토, 전담 지원, 커스텀 보안 정책을 함께 설계합니다.',
    ctaLabel: '영업팀 연결',
    ctaTo: '/contact',
    features: [
      '모든 Team Plan 기능 포함',
      '보안/감사 로그 보존 정책 협의',
      '전담 CSM 및 SLA 기반 지원',
      '사내 규정에 맞춘 배포·접근 제어 설계',
      '데이터 마이그레이션 및 교육/온보딩 지원',
    ],
  },
];

const PricingPage = () => {
  return (
    <div className="h-full bg-gradient-pastel flex flex-col overflow-hidden">
      <main className="flex-1 overflow-auto">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="glass-light rounded-3xl border border-white/40 shadow-glass-lg p-8 mb-10">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600/80 to-sky-500/80 text-white flex items-center justify-center shadow-lg">
                <HiSparkles className="text-2xl" />
              </div>
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-white/70 text-xs font-semibold text-blue-700">
                  새로운 가격 플랜(준비 중)
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Pricing & Plans</h1>
                  <p className="text-slate-600 mt-2 leading-relaxed">
                    Free, Personal, Team, Enterprise 네 가지 플랜으로 확장 준비 중입니다. 현재 기능은 모두 제공 중이며,
                    팀 단위 협업이 필요하다면 Team 이상 플랜 상담을 요청해 주세요.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-pastel-blue-700">
                  <span className="px-3 py-1 rounded-full bg-white/70 border border-white/60">글래스모피즘 UI</span>
                  <span className="px-3 py-1 rounded-full bg-white/70 border border-white/60">워크스페이스 & 보드</span>
                  <span className="px-3 py-1 rounded-full bg-white/70 border border-white/60">역할 기반 권한</span>
                  <span className="px-3 py-1 rounded-full bg-white/70 border border-white/60">활동 로그 & 검색</span>
                </div>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`glass-light rounded-2xl p-6 border ${
                  plan.highlight ? 'border-blue-300/70 shadow-blue-400/30 shadow-2xl' : 'border-white/45 shadow-glass'
                } flex flex-col gap-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-pastel-blue-700">{plan.badge}</p>
                    <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                    <p className="text-slate-600 text-sm leading-relaxed">{plan.description}</p>
                  </div>
                  {plan.highlight ? (
                    <span className="px-2 py-1 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-white text-[11px] font-semibold">
                      BEST
                    </span>
                  ) : (
                    <HiShieldCheck className="text-lg text-blue-600/80" aria-hidden />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-extrabold text-slate-900">{plan.price}</div>
                  {plan.note && <p className="text-xs text-slate-500">{plan.note}</p>}
                </div>

                <div className="flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                      <HiCheckCircle className="text-green-600 shrink-0 mt-0.5" aria-hidden />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  to={plan.ctaTo}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-sky-400'
                      : 'bg-white/85 border border-white/70 text-pastel-blue-700 hover:border-blue-200 hover:text-blue-700'
                  }`}
                >
                  {plan.ctaLabel}
                  <HiLightningBolt aria-hidden />
                </Link>
              </div>
            ))}
          </section>

          <section className="mt-10 glass-light rounded-2xl p-6 border border-white/50 shadow-glass flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/25 to-green-400/25 text-emerald-700 flex items-center justify-center">
                <HiLightningBolt />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">실시간 협업 & 데이터 관리</h3>
                <p className="text-sm text-slate-600">
                  WebSocket 기반 실시간 업데이트와 Excel/CSV 연동은 Team 플랜 이상에서 제공됩니다.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-700">
              <div className="bg-white/75 border border-white/70 rounded-xl p-4">
                <p className="font-semibold text-slate-900 mb-1">실시간 보드 동기화</p>
                <p className="leading-relaxed">보드/컬럼/카드 변경 사항을 WebSocket으로 즉시 반영해 팀원이 동시에 작업할 수 있습니다.</p>
              </div>
              <div className="bg-white/75 border border-white/70 rounded-xl p-4">
                <p className="font-semibold text-slate-900 mb-1">Excel/CSV 가져오기·내보내기</p>
                <p className="leading-relaxed">타 도구에서 데이터를 이동하거나 보고서를 만들 때 CSV/Excel로 손쉽게 내보내고 가져올 수 있습니다.</p>
              </div>
              <div className="bg-white/75 border border-white/70 rounded-xl p-4">
                <p className="font-semibold text-slate-900 mb-1">역할 기반 접근 제어</p>
                <p className="leading-relaxed">OWNER/ADMIN/MEMBER/VIEWER 역할을 이용해 워크스페이스와 보드 접근을 세밀하게 제어합니다.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PricingPage;
