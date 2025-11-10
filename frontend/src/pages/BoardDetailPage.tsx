import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { boardService } from '@/services/boardService';
import { useColumn } from '@/context/ColumnContext';
import { useCard } from '@/context/CardContext';
import { ColumnCard } from '@/components/ColumnCard';
import { CreateColumnModal } from '@/components/CreateColumnModal';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { BoardMemberTable } from '@/components/BoardMemberTable';
import { InviteMemberModal } from '@/components/InviteMemberModal';
import { LabelManager } from '@/components/label/LabelManager';
import { SearchPanel } from '@/components/SearchPanel';
import { GlobalNavBar } from '@/components/GlobalNavBar';
import { Footer } from '@/components/Footer';
import type { Board } from '@/types/board';
import type { CardSearchResult } from '@/types/search';
import { usePresenceTransition } from '@/hooks/usePresenceTransition';

const BoardDetailPage = () => {
  const navigate = useNavigate();
  const { workspaceId, boardId } = useParams<{ workspaceId: string; boardId: string }>();
  const [searchParams] = useSearchParams();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateColumnModal, setShowCreateColumnModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const { columns, loading: columnsLoading, loadColumns } = useColumn();
  const { cards } = useCard();
  const membersPanelTransition = usePresenceTransition(showMembersPanel);
  const activityPanelTransition = usePresenceTransition(showActivityPanel);
  const targetCardIdParam = searchParams.get('cardId');
  const targetColumnIdParam = searchParams.get('columnId');
  const parsedCardId = targetCardIdParam !== null ? Number(targetCardIdParam) : null;
  const parsedColumnId = targetColumnIdParam !== null ? Number(targetColumnIdParam) : null;
  const autoOpenCardId = parsedCardId !== null && !Number.isNaN(parsedCardId) ? parsedCardId : null;
  const autoOpenColumnId = parsedColumnId !== null && !Number.isNaN(parsedColumnId) ? parsedColumnId : null;
  const [inlineCardFocus, setInlineCardFocus] = useState<{ cardId: number; columnId: number } | null>(null);
  const effectiveAutoOpenCardId = inlineCardFocus?.cardId ?? autoOpenCardId;
  const effectiveAutoOpenColumnId = inlineCardFocus?.columnId ?? autoOpenColumnId;
  const handleInlineAutoOpenHandled = useCallback(() => {
    setInlineCardFocus((prev) => (prev ? null : prev));
  }, []);

  // 지연된 카드 개수 계산 (Due Date가 오늘보다 이전인 미완료 카드)
  const overdueCardCount = useMemo(() => {
    if (!columns || columns.length === 0) {
      return 0;
    }

    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    columns.forEach(column => {
      const columnCards = cards[column.id] || [];
      columnCards.forEach(card => {
        // 완료된 카드는 제외
        if (card.isCompleted) {
          return;
        }

        if (card.dueDate) {
          const dueDate = new Date(card.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          // Due Date가 오늘보다 이전이면 지연됨
          if (dueDate < today) {
            count++;
          }
        }
      });
    });

    return count;
  }, [columns, cards]);

  useEffect(() => {
    const loadBoard = async () => {
      if (!workspaceId || !boardId) {
        setError('Invalid board or workspace');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await boardService.getBoard(Number(workspaceId), Number(boardId));
        setBoard(data);

        // 칼럼 로드
        await loadColumns(Number(workspaceId), Number(boardId));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load board';
        setError(errorMessage);
        console.error('Failed to load board:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBoard();
  }, [workspaceId, boardId, loadColumns]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-pastel flex items-center justify-center">
        <div className="glass rounded-2xl px-8 py-6 shadow-glass text-pastel-blue-700">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-pastel-blue-500 border-t-transparent rounded-full" />
            <span className="font-medium">보드를 불러오는 중…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-gradient-pastel flex flex-col">
        <header className="glass-light shadow-glass flex-shrink-0">
          <div className="w-full max-w-[95vw] mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate('/boards')}
              className="text-pastel-blue-600 hover:text-pastel-blue-700 font-semibold"
            >
              ← 돌아가기
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="glass rounded-2xl p-12 shadow-glass-lg max-w-md w-full text-center">
            <p className="text-lg text-pastel-pink-600 font-semibold mb-4">보드를 찾을 수 없습니다</p>
            <button
              onClick={() => navigate('/boards')}
              className="px-6 py-3 rounded-lg bg-pastel-blue-500 text-white font-semibold hover:bg-pastel-blue-600 transition"
            >
              보드 목록으로 돌아가기
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gradient-pastel flex flex-col h-screen">
      <GlobalNavBar />

      {/* Header */}
      <header className="glass-light shadow-glass flex-shrink-0">
        <div className="w-full max-w-[95vw] mx-auto py-3 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/boards')}
              className="text-pastel-blue-600 hover:text-pastel-blue-700 font-semibold mb-2 block"
            >
              ← 돌아가기
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-pastel-blue-900">{board.name}</h1>
              {overdueCardCount > 0 && (
                <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-pastel-pink-500 text-white text-sm font-bold whitespace-nowrap">
                  지연:{overdueCardCount}
                </span>
              )}
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearchPanel(true)}
              className="px-3 py-2 rounded-lg text-pastel-blue-600 hover:bg-white/20 transition font-medium text-sm"
              title="카드 검색"
            >
              🔍 검색
            </button>
            <button
              onClick={() => setShowLabelManager(true)}
              className="px-3 py-2 rounded-lg text-pastel-blue-600 hover:bg-white/20 transition font-medium text-sm"
              title="라벨 관리"
            >
              🏷️ 라벨
            </button>
            <button
              onClick={() => setShowActivityPanel(!showActivityPanel)}
              className="px-3 py-2 rounded-lg text-pastel-blue-600 hover:bg-white/20 transition font-medium text-sm"
              title="활동 로그"
            >
              📋 활동
            </button>
            <button
              onClick={() => setShowMembersPanel(!showMembersPanel)}
              className="px-3 py-2 rounded-lg text-pastel-blue-600 hover:bg-white/20 transition font-medium text-sm"
              title="멤버 관리"
            >
              👥 멤버
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex-1 overflow-hidden pt-4 pb-4 flex">
          <div className="w-full max-w-[95vw] mx-auto flex flex-1 relative min-h-0 h-full">
            {/* Columns Section */}
            <div className="flex-1 overflow-auto flex flex-col pr-0 lg:pr-4 h-full">
              {columnsLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pastel-blue-600" />
                </div>
              ) : columns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="glass rounded-2xl p-8 shadow-glass-lg text-center max-w-md">
                  <p className="text-lg text-pastel-blue-600 mb-4">칼럼이 없습니다</p>
                  <p className="text-sm text-pastel-blue-500 mb-6">첫 번째 칼럼을 만들어 시작하세요</p>
                  <button
                    onClick={() => setShowCreateColumnModal(true)}
                    className="px-6 py-2 rounded-lg bg-pastel-blue-500 text-white font-semibold hover:bg-pastel-blue-600 transition"
                  >
                    + 칼럼 생성
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto h-full">
                <div className="flex gap-4 pb-4 min-h-full h-full items-stretch">
                  {columns
                    .sort((a, b) => a.position - b.position)
                    .map((column) => (
                      <ColumnCard
                        key={column.id}
                        column={column}
                        workspaceId={Number(workspaceId)}
                        boardId={Number(boardId)}
                        autoOpenCardId={
                          effectiveAutoOpenColumnId && effectiveAutoOpenColumnId !== column.id
                            ? null
                            : effectiveAutoOpenCardId
                        }
                        onAutoOpenHandled={handleInlineAutoOpenHandled}
                      />
                    ))}

                  {/* Add Column Button */}
                  <button
                    onClick={() => setShowCreateColumnModal(true)}
                    className="flex-shrink-0 w-80 h-12 rounded-xl border-2 border-dashed border-white/40 flex items-center justify-center text-pastel-blue-600 font-semibold hover:border-white/60 hover:bg-white/10 transition"
                  >
                    + 칼럼 추가
                  </button>
                </div>
              </div>
            )}
            </div>

            {/* Overlay Panels */}
            {membersPanelTransition.shouldRender && (
              <div className="absolute top-0 right-0 h-full z-20 pointer-events-none">
                <aside
                  className={`panel-slide panel-slide-${membersPanelTransition.stage} h-full w-80 glass shadow-glass-lg rounded-2xl border border-white/30 overflow-hidden pointer-events-auto`}
                >
                  <div className="h-full flex flex-col">
                    <div className="px-4 py-3 border-b border-white/20 flex items-center justify-between">
                      <span className="font-semibold text-pastel-blue-800">멤버</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowInviteModal(true)}
                          className="px-3 py-1.5 rounded-lg bg-pastel-blue-500 text-white hover:bg-pastel-blue-600 transition font-medium text-sm"
                        >
                          + 초대
                        </button>
                        <button
                          onClick={() => setShowMembersPanel(false)}
                          className="text-pastel-blue-500 hover:text-pastel-blue-700 text-sm font-medium"
                        >
                          닫기
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <BoardMemberTable boardId={Number(boardId)} />
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {activityPanelTransition.shouldRender && (
              <div className="absolute top-0 right-0 h-full z-10 pointer-events-none translate-x-2 lg:translate-x-4">
                <aside
                  className={`panel-slide panel-slide-${activityPanelTransition.stage} h-full w-96 glass shadow-glass-lg rounded-2xl border border-white/30 overflow-hidden pointer-events-auto`}
                >
                  <div className="h-full flex flex-col">
                    <div className="px-4 py-3 border-b border-white/20 flex items-center justify-between">
                      <span className="font-semibold text-pastel-blue-800">활동 로그</span>
                      <button
                        onClick={() => setShowActivityPanel(false)}
                        className="text-pastel-blue-500 hover:text-pastel-blue-700 text-sm font-medium"
                      >
                        닫기
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <ActivityTimeline boardId={Number(boardId)} />
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Column Modal */}
      {showCreateColumnModal && (
        <CreateColumnModal
          workspaceId={Number(workspaceId)}
          boardId={Number(boardId)}
          onClose={() => {
            setShowCreateColumnModal(false);
            // 칼럼 목록 새로고침
            loadColumns(Number(workspaceId), Number(boardId));
          }}
        />
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        boardId={Number(boardId)}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          // 멤버 목록 새로고침 필요
          setShowInviteModal(false);
        }}
      />

      {/* Label Manager Modal */}
      {showLabelManager && (
        <LabelManager
          boardId={Number(boardId)}
          onClose={() => setShowLabelManager(false)}
        />
      )}

      {/* Search Panel */}
      {showSearchPanel && (
        <SearchPanel
          boardId={Number(boardId)}
          onClose={() => setShowSearchPanel(false)}
          onCardSelect={(result: CardSearchResult) => {
            setInlineCardFocus({ cardId: result.id, columnId: result.columnId });
          }}
        />
      )}

      <Footer />
    </div>
  );
};

export default BoardDetailPage;
