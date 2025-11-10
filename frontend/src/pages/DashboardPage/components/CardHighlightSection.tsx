import type { DashboardCard } from '../hooks';

type HighlightVariant = 'overdue' | 'inProgress' | 'upcoming';

type VariantConfig = {
  title: string;
  subtitleColor: string;
  titleColor: string;
  containerClass: string;
  badgeClass: string;
};

const VARIANT_CONFIG: Record<HighlightVariant, VariantConfig> = {
  overdue: {
    title: '지연 중인 작업 ⚠️',
    subtitleColor: 'text-pastel-pink-500',
    titleColor: 'text-pastel-pink-700',
    containerClass: 'border border-pastel-pink-200 bg-pastel-pink-50',
    badgeClass: 'bg-pastel-pink-100 text-pastel-pink-700',
  },
  inProgress: {
    title: '진행 중인 작업 🔄',
    subtitleColor: 'text-pastel-cyan-500',
    titleColor: 'text-pastel-cyan-700',
    containerClass: 'border border-pastel-cyan-200 bg-pastel-cyan-50',
    badgeClass: 'bg-pastel-cyan-100 text-pastel-cyan-700',
  },
  upcoming: {
    title: '임박한 작업 🔔',
    subtitleColor: 'text-pastel-blue-500',
    titleColor: 'text-pastel-blue-700',
    containerClass: 'border border-pastel-blue-200 bg-pastel-blue-50',
    badgeClass: 'bg-pastel-blue-100 text-pastel-blue-700',
  },
};

interface CardHighlightSectionProps {
  variant: HighlightVariant;
  cards: DashboardCard[];
  onCardClick: (card: DashboardCard) => void;
}

const priorityColorMap: Record<string, string> = {
  HIGH: 'bg-pastel-pink-100 text-pastel-pink-700',
  MEDIUM: 'bg-pastel-yellow-100 text-pastel-yellow-700',
  LOW: 'bg-pastel-green-100 text-pastel-green-700',
};

const formatDueDate = (dueDate?: string | null) => {
  if (!dueDate) {
    return null;
  }
  return new Date(dueDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
};

const getDueDateBadge = (variant: HighlightVariant, card: DashboardCard) => {
  if (!card.dueDate) {
    return variant === 'inProgress' ? '진행 중' : null;
  }

  const dueDate = new Date(card.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = formatDueDate(card.dueDate);

  if (variant === 'overdue') {
    const daysOverdue = Math.abs(Math.min(diff, 0));
    return `📅 ${formatted} (${daysOverdue}일 전)`;
  }

  if (variant === 'upcoming') {
    if (diff === 0) {
      return `📅 ${formatted} (오늘!)`;
    }
    if (diff === 1) {
      return `📅 ${formatted} (내일)`;
    }
    return `📅 ${formatted}`;
  }

  return `📅 ${formatted}`;
};

const HighlightCard = ({ variant, card, onClick }: { variant: HighlightVariant; card: DashboardCard; onClick: () => void }) => {
  const config = VARIANT_CONFIG[variant];
  const badgeLabel = getDueDateBadge(variant, card);
  const priorityClass = card.priority ? priorityColorMap[card.priority] ?? 'bg-pastel-blue-100 text-pastel-blue-700' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass rounded-lg p-4 hover:shadow-glass-lg transition text-left w-full h-full cursor-pointer flex flex-col ${config.containerClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-pastel-blue-900 truncate">{card.title}</h3>
          <p className="text-xs text-pastel-blue-600 mt-1 truncate">
            {card.boardName} / {card.description || '설명 없음'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {card.priority && (
            <span className={`text-xs px-2 py-1 rounded font-medium ${priorityClass}`}>{card.priority}</span>
          )}
          {badgeLabel && <span className={`text-xs px-2 py-1 rounded font-semibold ${config.badgeClass}`}>{badgeLabel}</span>}
        </div>
      </div>
      {card.assignee && (
        <p className="text-xs text-pastel-blue-600 mt-2 truncate">👤 {card.assignee}</p>
      )}
    </button>
  );
};

export const CardHighlightSection = ({ variant, cards, onCardClick }: CardHighlightSectionProps) => {
  if (!cards.length) {
    return null;
  }

  const config = VARIANT_CONFIG[variant];

  return (
    <section className="flex-shrink-0">
      <div className="mb-3">
        <h2 className={`text-xl font-bold ${config.titleColor}`}>{config.title}</h2>
        <p className={`text-xs mt-1 ${config.subtitleColor}`}>{cards.length}개의 카드</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {cards.map((card) => (
          <HighlightCard
            key={`${card.id}-${variant}`}
            variant={variant}
            card={card}
            onClick={() => onCardClick(card)}
          />
        ))}
      </div>
    </section>
  );
};
