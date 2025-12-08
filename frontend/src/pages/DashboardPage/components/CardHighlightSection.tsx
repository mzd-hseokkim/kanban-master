import { HiCalendar, HiExclamationCircle, HiFire, HiPlay } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';
import type { DashboardCard } from '../hooks';

type HighlightVariant = 'overdue' | 'inProgress' | 'upcoming';

type VariantConfig = {
  titleKey: string;
  Icon: React.ElementType;
  subtitleColor: string;
  titleColor: string;
  containerClass: string;
  badgeClass: string;
  iconColor: string;
};

const VARIANT_CONFIG: Record<HighlightVariant, VariantConfig> = {
  overdue: {
    titleKey: 'dashboard:highlight.overdue',
    Icon: HiExclamationCircle,
    subtitleColor: 'text-pastel-pink-500',
    titleColor: 'text-pastel-pink-700',
    containerClass: 'border border-pastel-pink-200 bg-pastel-pink-50',
    badgeClass: 'bg-pastel-pink-100 text-pastel-pink-700',
    iconColor: 'text-pastel-pink-500',
  },
  inProgress: {
    titleKey: 'dashboard:highlight.inProgress',
    Icon: HiPlay,
    subtitleColor: 'text-pastel-cyan-500',
    titleColor: 'text-pastel-cyan-700',
    containerClass: 'border border-pastel-cyan-200 bg-pastel-cyan-50',
    badgeClass: 'bg-pastel-cyan-100 text-pastel-cyan-700',
    iconColor: 'text-pastel-cyan-500',
  },
  upcoming: {
    titleKey: 'dashboard:highlight.upcoming',
    Icon: HiFire,
    subtitleColor: 'text-pastel-blue-500',
    titleColor: 'text-pastel-blue-700',
    containerClass: 'border border-pastel-blue-200 bg-pastel-blue-50',
    badgeClass: 'bg-pastel-blue-100 text-pastel-blue-700',
    iconColor: 'text-pastel-blue-500',
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

const formatDueDate = (dueDate: string | null | undefined, locale: string) => {
  if (!dueDate) {
    return null;
  }
  return new Date(dueDate).toLocaleDateString(locale || undefined, { month: 'numeric', day: 'numeric' });
};

const getDueDateBadge = (
  variant: HighlightVariant,
  card: DashboardCard,
  t: ReturnType<typeof useTranslation>['t'],
  locale: string
) => {
  if (!card.dueDate) {
    return variant === 'inProgress' ? t('dashboard:highlight.inProgressBadge') : null;
  }

  const dueDate = new Date(card.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = formatDueDate(card.dueDate, locale);

  if (variant === 'overdue') {
    const daysOverdue = Math.abs(Math.min(diff, 0));
    return t('dashboard:highlight.overdueBadge', { date: formatted, days: daysOverdue });
  }

  if (variant === 'upcoming') {
    if (diff === 0) {
      return t('dashboard:highlight.todayBadge', { date: formatted });
    }
    if (diff === 1) {
      return t('dashboard:highlight.tomorrowBadge', { date: formatted });
    }
    return t('dashboard:highlight.dateBadge', { date: formatted });
  }

  return t('dashboard:highlight.dateBadge', { date: formatted });
};

const HighlightCard = ({
  variant,
  card,
  onClick,
  t,
  locale,
}: {
  variant: HighlightVariant;
  card: DashboardCard;
  onClick: () => void;
  t: ReturnType<typeof useTranslation>['t'];
  locale: string;
}) => {
  const config = VARIANT_CONFIG[variant];
  const badgeLabel = getDueDateBadge(variant, card, t, locale);
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
            {card.boardName} / {card.description || t('dashboard:highlight.noDescription')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {card.priority && (
            <span className={`text-xs px-2 py-1 rounded font-medium ${priorityClass}`}>{card.priority}</span>
          )}
          {badgeLabel && (
            <span className={`text-xs px-2 py-1 rounded font-semibold ${config.badgeClass} flex items-center gap-1`}>
              {card.dueDate && <HiCalendar className="text-sm" />}
              {badgeLabel}
            </span>
          )}
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

  const { t, i18n } = useTranslation(['dashboard']);
  const config = VARIANT_CONFIG[variant];
  const locale = i18n.language || 'en';

  return (
    <section className="flex-shrink-0">
      <div className="mb-3">
        <h2 className={`text-xl font-bold ${config.titleColor} flex items-center gap-2`}>
          {t(config.titleKey)}
          <config.Icon className={`text-2xl ${config.iconColor}`} />
        </h2>
        <p className={`text-xs mt-1 ${config.subtitleColor}`}>{t('dashboard:highlight.cardsCount', { count: cards.length })}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {cards.map((card) => (
          <HighlightCard
            key={`${card.id}-${variant}`}
            variant={variant}
            card={card}
            onClick={() => onCardClick(card)}
            t={t}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
};
