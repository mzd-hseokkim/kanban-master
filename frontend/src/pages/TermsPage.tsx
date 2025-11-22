import {
  HiCheckCircle,
  HiClipboardList,
  HiCollection,
  HiDocumentText,
  HiLightningBolt,
  HiOfficeBuilding,
  HiShieldExclamation,
} from 'react-icons/hi';

const TermsPage = () => {
  const commitments = [
    {
      title: '계정 및 접근',
      description: '사용자는 본인 인증된 계정을 사용하며, 팀에서 부여한 역할에 따라 보드·카드 접근 권한이 결정됩니다.',
      icon: HiOfficeBuilding,
    },
    {
      title: '콘텐츠 소유',
      description: '업무에 생성된 보드·카드·파일의 소유권은 사용자와 해당 팀에 있으며, Kanban Master는 운영을 위한 최소한의 처리만 수행합니다.',
      icon: HiCollection,
    },
    {
      title: '안정적 운영',
      description: '서비스는 연중무휴 제공을 목표로 하지만, 정기 점검 또는 긴급 패치 시 사전·사후 공지 후 제한될 수 있습니다.',
      icon: HiLightningBolt,
    },
  ];

  const responsibilities = [
    '타인의 계정을 도용하거나 접근 권한을 우회하려 해서는 안 됩니다.',
    '악성 코드 업로드, 불법 정보 공유, 지적 재산권 침해 자료 업로드를 금지합니다.',
    '서비스 성능을 저해하는 자동화된 대량 요청, 크롤링, 리버스 엔지니어링을 시도하지 않습니다.',
    '보드 내 민감정보 입력 시 팀 정책을 준수하며, 개인 식별 데이터는 꼭 필요한 범위 내에서만 등록합니다.',
    '규정 위반 신고 또는 보안 사고 발견 시 즉시 support@kanban-master.com으로 알립니다.',
  ];

  const operations = [
    {
      title: '서비스 변경',
      detail: '기능 개선이나 정책 변경 시 변경 사항을 사전 공지하며, 중대한 변동은 이메일로 별도 안내합니다.',
    },
    {
      title: '약관 해지',
      detail: '언제든 탈퇴할 수 있으며, 탈퇴 시 계정 데이터는 정책에 따라 지연 삭제됩니다. 미결제 금액이 있는 경우 정산 후 처리됩니다.',
    },
    {
      title: '책임 범위',
      detail: 'Kanban Master는 정상적인 주의 의무 하에 서비스를 제공하며, 불가항력적 장애나 사용자 위반으로 인한 손해는 책임 범위에서 제외될 수 있습니다.',
    },
  ];

  return (
    <div className="h-full bg-gradient-pastel flex flex-col overflow-hidden">
      <main className="flex-1 overflow-auto">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="glass-light rounded-3xl border border-white/40 shadow-glass-lg p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600/80 to-blue-500/80 text-white flex items-center justify-center shadow-lg">
                <HiDocumentText className="text-2xl" />
              </div>
              <div>
                <p className="text-sm font-semibold text-pastel-blue-600 mb-1">Terms of Service</p>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">서비스 이용 약관</h1>
                <p className="text-slate-600 mt-3 leading-relaxed">
                  안정적인 협업 경험을 위해 약관의 핵심 내용을 요약했습니다. 팀 운영 정책과 함께 확인해 주세요.
                </p>
                <div className="flex flex-wrap gap-3 mt-4 text-sm text-pastel-blue-600">
                  <span className="px-3 py-1 rounded-full bg-white/70 border border-white/60">버전 1.0</span>
                  <span className="px-3 py-1 rounded-full bg-white/70 border border-white/60">시행일: 2024. 12.</span>
                </div>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {commitments.map(({ title, description, icon: Icon }) => (
              <div key={title} className="glass-light rounded-2xl p-6 border border-white/45 shadow-glass">
                <div className="h-10 w-10 rounded-xl bg-white/70 flex items-center justify-center text-indigo-600 shadow-inner mb-3">
                  <Icon className="text-xl" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">{title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </section>

          <section className="glass-light rounded-2xl p-6 border border-white/50 shadow-glass mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400/30 to-yellow-300/30 text-amber-700 flex items-center justify-center">
                <HiShieldExclamation className="text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">사용자 책임 및 금지사항</h3>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              {responsibilities.map((item) => (
                <div key={item} className="flex gap-3 bg-white/70 border border-white/60 rounded-xl px-4 py-3">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <p className="leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-light rounded-2xl p-6 border border-white/50 shadow-glass">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500/25 to-emerald-400/25 text-emerald-700 flex items-center justify-center">
                <HiClipboardList className="text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">운영 및 책임 범위</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {operations.map(({ title, detail }) => (
                <div key={title} className="bg-white/70 border border-white/60 rounded-xl px-4 py-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <HiCheckCircle />
                    <span>{title}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
