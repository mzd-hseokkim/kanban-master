import { BoardCard } from '@/components/BoardCard';
import { CreateBoardModal } from '@/components/CreateBoardModal';
import { ActivityTrend } from '@/components/dashboard/ActivityTrend';
import { KPITiles } from '@/components/dashboard/KPITiles';
import { TopBoards } from '@/components/dashboard/TopBoards';
import { useAuth } from '@/context/AuthContext';
import { useBoard } from '@/context/BoardContext';
import { dashboardService } from '@/services/dashboardService';
import { DashboardSummaryResponse } from '@/types/dashboard';
import { useCallback, useEffect, useState } from 'react';
import { HiClipboardList, HiPlus, HiViewGrid } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { CardHighlightSection } from './DashboardPage/components/CardHighlightSection';
import { DashboardEmptyState } from './DashboardPage/components/DashboardEmptyState';
import { DashboardLoadingBanner } from './DashboardPage/components/DashboardLoadingBanner';
import { DashboardCard, useDashboardCards, useDefaultWorkspace } from './DashboardPage/hooks';
import { useTranslation } from 'react-i18next';

const DashboardPage = () => {
  const { t } = useTranslation(['dashboard']);
  const { user } = useAuth();
  const { boards, loading: boardsLoading, loadBoards } = useBoard();
  const navigate = useNavigate();
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const { selectedWorkspaceId } = useDefaultWorkspace(user);
  const { cardsLoading, upcomingCards, overdueCards, inProgressCards } = useDashboardCards(
    boards,
    selectedWorkspaceId
  );
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadBoards(selectedWorkspaceId);
      dashboardService.getGlobalSummary(selectedWorkspaceId).then(setSummary).catch(console.error);
    }
  }, [loadBoards, selectedWorkspaceId]);

  const handleCardNavigate = useCallback(
    (card: DashboardCard) => {
      if (!card.workspaceId) {
        return;
      }
      navigate(`/boards/${card.workspaceId}/${card.boardId}?cardId=${card.id}&columnId=${card.columnId}`);
    },
    [navigate]
  );

  const hasHighlightCards = overdueCards.length > 0 || upcomingCards.length > 0 || inProgressCards.length > 0;
  const shouldShowEmptyState = !boardsLoading && boards.length === 0 && !hasHighlightCards;

  return (
    <div className="h-full bg-gradient-pastel flex flex-col overflow-hidden">
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 flex-shrink-0 transition-colors duration-300">
        <div className="w-full max-w-[95vw] mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <HiViewGrid className="text-blue-600" />
              {t('dashboard:header.title')}
            </h1>
            <p className="text-sm text-slate-500 mt-1 ml-8">
              {t('dashboard:header.welcome', { name: user?.name ?? '' })}
            </p>
          </div>
          <button
            onClick={() => setShowCreateBoardModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-bold hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
            type="button"
          >
            <HiPlus className="text-lg" />
            {t('dashboard:actions.createBoard')}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto flex flex-col relative">
        <DashboardLoadingBanner isVisible={cardsLoading} />
        <div className="w-full max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {boardsLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          )}

          {shouldShowEmptyState && (
            <DashboardEmptyState onCreateBoard={() => setShowCreateBoardModal(true)} />
          )}

          {!boardsLoading && !shouldShowEmptyState && (
            <div className="flex flex-col gap-8">
              {summary && (
                <>
                  <KPITiles summary={{ ...summary, totalBoards: boards.length }} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TopBoards boards={summary.boardsByOverdue} workspaceId={selectedWorkspaceId!} />
                    <ActivityTrend activity={summary.recentActivity} />
                  </div>
                </>
              )}

              <CardHighlightSection variant="overdue" cards={overdueCards} onCardClick={handleCardNavigate} />
              <CardHighlightSection variant="inProgress" cards={inProgressCards} onCardClick={handleCardNavigate} />
              <CardHighlightSection variant="upcoming" cards={upcomingCards} onCardClick={handleCardNavigate} />

              {boards.length > 0 && (
                <section className="pb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                      <HiClipboardList className="text-xl text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{t('dashboard:boards.title')}</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                      {t('dashboard:boards.count', { count: boards.length })}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {boards.map((board) => (
                      <BoardCard
                        key={board.id}
                        board={board}
                        workspaceId={selectedWorkspaceId ?? board.workspaceId}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      {showCreateBoardModal && selectedWorkspaceId && (
        <CreateBoardModal
          workspaceId={selectedWorkspaceId}
          onClose={() => {
            setShowCreateBoardModal(false);
            loadBoards(selectedWorkspaceId);
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
