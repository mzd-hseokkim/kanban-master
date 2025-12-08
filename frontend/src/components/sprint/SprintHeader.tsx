import { useSprint } from '@/context/SprintContext';
import type { Sprint } from '@/types/sprint';
import axiosInstance from '@/utils/axios';
import { differenceInDays, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { useDialog } from '@/context/DialogContext';
import './SprintHeader.css';
import { useTranslation } from 'react-i18next';

interface SprintHeaderProps {
  boardId: number;
  refreshTrigger?: number; // Optional prop to trigger refresh from parent
}

interface SprintStats {
  totalCards: number;
  completedCards: number;
  totalPoints: number;
  completedPoints: number;
}

export const SprintHeader = ({ boardId, refreshTrigger }: SprintHeaderProps) => {
  const { activeSprint, loading, completeSprint } = useSprint();
  const { confirm, alert } = useDialog();
  const { t } = useTranslation(['sprint', 'common']);
  const [stats, setStats] = useState<SprintStats>({ totalCards: 0, completedCards: 0, totalPoints: 0, completedPoints: 0 });
  const [completing, setCompleting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sprintHeaderCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    if (activeSprint) {
      loadSprintStats();
    }
  }, [activeSprint, refreshTrigger]); // refreshTrigger 추가하여 부모에서 갱신 가능

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem('sprintHeaderCollapsed', String(newValue));
      return newValue;
    });
  };

  const loadSprintStats = async () => {
    if (!activeSprint) return;

    try {
      // Get all cards in the sprint using search API with authentication
      const url = `/search/boards/${boardId}/cards?sprintId=${activeSprint.id}`;
      const response = await axiosInstance.get(url);
      const sprintCards = Array.isArray(response.data) ? response.data : [];

      const totalCards = sprintCards.length;
      const completedCards = sprintCards.filter((card: any) => card.isCompleted).length;
      const totalPoints = sprintCards.reduce((sum: number, card: any) => sum + (card.storyPoints || 0), 0);
      const completedPoints = sprintCards.filter((card: any) => card.isCompleted).reduce((sum: number, card: any) => sum + (card.storyPoints || 0), 0);

      setStats({ totalCards, completedCards, totalPoints, completedPoints });
    } catch (error) {
      console.error('Failed to load sprint stats:', error);
      setStats({ totalCards: 0, completedCards: 0, totalPoints: 0, completedPoints: 0 });
    }
  };

  const handleCompleteSprint = async () => {
    if (!activeSprint) return;

    const confirmed = await confirm(
      t('sprint:complete.confirmMessage', { defaultValue: '이 스프린트를 완료하시겠습니까?\n미완료된 카드는 백로그로 이동됩니다.' }),
      {
        confirmText: t('sprint:complete.confirm'),
        cancelText: t('common:button.cancel'),
        isDestructive: true
      }
    );
    if (!confirmed) return;

    try {
      setCompleting(true);
      await completeSprint(activeSprint.id);
      window.location.reload();
    } catch (error) {
      console.error('Failed to complete sprint:', error);
      await alert(error instanceof Error ? error.message : t('sprint:complete.failed'));
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !activeSprint) {
    return null;
  }

  return (
    <div className={`sprint-header ${isCollapsed ? 'sprint-header--collapsed' : ''}`}>
      <SprintInfo
        sprint={activeSprint}
        stats={stats}
        onComplete={handleCompleteSprint}
        completing={completing}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
    </div>
  );
};

interface SprintInfoProps {
  sprint: Sprint;
  stats: SprintStats;
  onComplete: () => void;
  completing: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const SprintInfo = ({ sprint, stats, onComplete, completing, isCollapsed, onToggleCollapse }: SprintInfoProps) => {
  const { t } = useTranslation(['sprint']);
  const daysLeft = sprint.endDate
    ? differenceInDays(parseISO(sprint.endDate), new Date())
    : null;

  const progressPercentage = stats.totalPoints > 0
    ? Math.round((stats.completedPoints / stats.totalPoints) * 100)
    : 0;

  return (
    <div className="sprint-header__container">
      <div className="sprint-header__top">
        <div className="sprint-header__main">
          <button
            onClick={onToggleCollapse}
            className="sprint-header__toggle"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? '▶' : '▼'}
          </button>
          <h2 className="sprint-header__title" onClick={onToggleCollapse}>{sprint.name}</h2>
          {daysLeft !== null && (
            <span className={`sprint-header__days ${daysLeft < 0 ? 'sprint-header__days--overdue' : ''}`}>
              {daysLeft > 0
                ? t('sprint:header.daysLeft.left', { count: daysLeft })
                : daysLeft === 0
                  ? t('sprint:header.daysLeft.today')
                  : t('sprint:header.daysLeft.overdue', { count: Math.abs(daysLeft) })}
            </span>
          )}
        </div>

        <button
          onClick={onComplete}
          disabled={completing}
          className="sprint-header__complete-btn"
        >
          {completing ? t('sprint:header.completing') : t('sprint:header.complete')}
        </button>
      </div>

      <div className={`sprint-header__details ${isCollapsed ? 'sprint-header__details--hidden' : ''}`}>
        {sprint.goalText && (
          <p className="sprint-header__goal">🎯 {sprint.goalText}</p>
        )}

        <div className="sprint-header__stats">
          <div className="sprint-header__stat">
            <span className="sprint-header__stat-label">{t('sprint:header.cards')}</span>
            <span className="sprint-header__stat-value">{stats.completedCards} / {stats.totalCards}</span>
          </div>
          <div className="sprint-header__stat">
            <span className="sprint-header__stat-label">{t('sprint:header.points')}</span>
            <span className="sprint-header__stat-value">{stats.completedPoints} / {stats.totalPoints}</span>
          </div>
          {sprint.capacity && (
            <div
              className="sprint-header__stat"
              title={t('sprint:header.capacityTooltip')}
            >
              <span className="sprint-header__stat-label">{t('sprint:header.capacity')}</span>
              <span className="sprint-header__stat-value">{sprint.capacity} pts</span>
            </div>
          )}
        </div>

        <div className="sprint-header__progress">
          <div className="sprint-header__progress-bar">
            <div
              className="sprint-header__progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="sprint-header__progress-text">
            {t('sprint:header.progress', { percent: progressPercentage })}
          </span>
        </div>
      </div>
    </div>
  );
};
