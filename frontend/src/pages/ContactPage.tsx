import { Link } from 'react-router-dom';
import {
  HiChatAlt2,
  HiClock,
  HiLightningBolt,
  HiMail,
  HiPaperAirplane,
  HiSupport,
} from 'react-icons/hi';

const ContactPage = () => {
  const channels = [
    {
      title: '이메일 지원',
      description: '보안·계정·결제 문의를 모두 이메일로 접수합니다. 로그가 필요한 경우 캡처를 첨부해주세요.',
      icon: HiMail,
      actionLabel: 'support@kanban-master.com',
      href: 'mailto:support@kanban-master.com',
    },
    {
      title: '제품 피드백',
      description: 'UI/UX 개선 아이디어와 버그 제보를 환영합니다. 빠른 재현을 위해 상황 설명을 함께 남겨주세요.',
      icon: HiPaperAirplane,
      actionLabel: '피드백 보내기',
      href: 'mailto:product@kanban-master.com?subject=%5BFeedback%5D%20Kanban%20Master',
    },
    {
      title: '장애/긴급 이슈',
      description: '서비스 지연, 데이터 접근 오류 등 긴급 상황은 제목에 [긴급]을 포함해 주세요. 우선 순위로 대응합니다.',
      icon: HiLightningBolt,
      actionLabel: '[긴급] 제목으로 메일',
      href: 'mailto:incident@kanban-master.com?subject=%5B%EA%B8%B4%EA%B8%89%5D%20Incident%20Report',
    },
  ];

  const supportInfo = [
    {
      title: '운영 시간',
      detail: '평일 10:00–18:00 (KST), 공휴일 제외',
      icon: HiClock,
    },
    {
      title: '평균 응답',
      detail: '영업일 기준 4시간 내 1차 답변, 긴급 건 즉시 확인',
      icon: HiSupport,
    },
    {
      title: '확인 사항',
      detail: '문의 시 팀/워크스페이스 이름, 브라우저/앱 버전, 발생 시각을 알려주시면 더 빨리 해결됩니다.',
      icon: HiChatAlt2,
    },
  ];

  return (
    <div className="h-full bg-gradient-pastel flex flex-col overflow-hidden">
      <main className="flex-1 overflow-auto">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="glass-light rounded-3xl border border-white/40 shadow-glass-lg p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600/80 to-purple-500/80 text-white flex items-center justify-center shadow-lg">
                <HiSupport className="text-2xl" />
              </div>
              <div>
                <p className="text-sm font-semibold text-pastel-blue-600 mb-1">Contact</p>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">고객 지원 및 문의</h1>
                <p className="text-slate-600 mt-3 leading-relaxed">
                  제품 개선 제안부터 장애 신고까지, 필요한 채널을 선택해 주세요. 가능한 빠르게 답변드리겠습니다.
                </p>
                <div className="flex flex-wrap gap-3 mt-4 text-sm text-pastel-blue-600">
                  <span className="px-3 py-1 rounded-full bg-white/70 border border-white/60">KST 기준 응대</span>
                  <span className="px-3 py-1 rounded-full bg-white/70 border border-white/60">보안 문의 우선 처리</span>
                </div>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {channels.map(({ title, description, icon: Icon, actionLabel, href }) => (
              <div key={title} className="glass-light rounded-2xl p-6 border border-white/45 shadow-glass flex flex-col gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/70 flex items-center justify-center text-blue-600 shadow-inner">
                  <Icon className="text-xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">{title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
                </div>
                <a
                  href={href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-600"
                >
                  {actionLabel}
                  <span aria-hidden className="text-base">↗</span>
                </a>
              </div>
            ))}
          </section>

          <section className="glass-light rounded-2xl p-6 border border-white/50 shadow-glass mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/25 to-green-400/25 text-emerald-700 flex items-center justify-center">
                <HiChatAlt2 className="text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">응대 가이드</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {supportInfo.map(({ title, detail, icon: Icon }) => (
                <div key={title} className="bg-white/70 border border-white/60 rounded-xl px-4 py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <Icon />
                    <span>{title}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-wrap items-center gap-4 glass-light rounded-2xl p-6 border border-white/50 shadow-glass">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-slate-900">빠른 확인이 필요하세요?</h4>
              <p className="text-sm text-slate-600 mt-1">
                문의 유형을 명확히 적어주시면 더 정확한 답변을 드릴 수 있습니다. 개인정보 관련 요청은 개인정보 처리방침을 함께 확인해주세요.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="mailto:support@kanban-master.com?subject=Kanban%20Master%20Support"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-cyan-400 transition"
              >
                메일 보내기
              </a>
              <Link
                to="/privacy"
                className="px-4 py-2 rounded-lg bg-white/80 border border-white/70 text-pastel-blue-700 font-semibold hover:border-blue-200 hover:text-blue-700 transition"
              >
                개인정보 처리방침
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
