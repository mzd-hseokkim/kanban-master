import { ErrorNotification } from "@/components/ErrorNotification";
import { PlanningView } from "@/components/sprint/PlanningView";
import { SprintHeader } from "@/components/sprint/SprintHeader";
import { useAuth } from "@/context/AuthContext";
import { useCard } from "@/context/CardContext";
import { useColumn } from "@/context/ColumnContext";
import { useDialog } from "@/context/DialogContext";
import { useSprint } from "@/context/SprintContext";
import { useBoardSubscription } from "@/hooks/useBoardSubscription";
import { useImportProgress } from "@/hooks/useImportProgress";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { usePermissions } from "@/hooks/usePermissions";
import cardService from "@/services/cardService";
import { hasActiveSearchFilter } from "@/utils/searchFilters";
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AnalyticsDashboard from "./BoardDetailPage/components/AnalyticsDashboard";
import { BoardHeader } from "./BoardDetailPage/components/BoardHeader";
import { BoardModals } from "./BoardDetailPage/components/BoardModals";
import {
    BoardErrorState,
    BoardLoadingState,
} from "./BoardDetailPage/components/BoardStateFallbacks";
import { ColumnsSection } from "./BoardDetailPage/components/ColumnsSection";
import { ListView } from "./BoardDetailPage/components/ListView";
import {
    useAutoOpenTargets,
    useBoardData,
    useBoardExcel,
    useBoardSprint,
    useBoardUI,
    useOverdueCardCount,
} from "./BoardDetailPage/hooks";

const BoardDetailPage = () => {
  const navigate = useNavigate();
  const { workspaceId, boardId } = useParams<{
    workspaceId: string;
    boardId: string;
  }>();
  const [searchParams] = useSearchParams();
  const { columns, loading: columnsLoading, loadColumns, handleColumnEvent } = useColumn();
  const { cards, loadCards, handleCardEvent } = useCard();
  const { alert } = useDialog();
  const { loadSprints, activeSprint } = useSprint();
  const { user } = useAuth();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { board, loading, error, updateBoardLocally } = useBoardData(
    workspaceId,
    boardId,
    loadColumns,
  );
  const { canEdit, canManage } = usePermissions(board);
  const {
    effectiveAutoOpenCardId,
    effectiveAutoOpenColumnId,
    setInlineCardFocus,
    handleInlineAutoOpenHandled,
  } = useAutoOpenTargets(searchParams);

  const { uiState, uiActions } = useBoardUI(setInlineCardFocus);
  const overdueCardCount = useOverdueCardCount(columns, cards);

  const workspaceNumericId = workspaceId ? Number(workspaceId) : Number.NaN;
  const boardNumericId = boardId ? Number(boardId) : Number.NaN;
  const hasValidNumericIds =
    !Number.isNaN(workspaceNumericId) && !Number.isNaN(boardNumericId);

  const excelHook = useBoardExcel(
    workspaceNumericId,
    boardNumericId,
    hasValidNumericIds,
    alert
  );

  const { status: importStatus, refresh: refreshImportStatus } =
    useImportProgress(boardNumericId, excelHook.activeImportJobId);

  const sprintHook = useBoardSprint(
    hasValidNumericIds,
    workspaceNumericId,
    boardNumericId,
    board,
    updateBoardLocally,
    alert
  );

  const refreshColumns = useCallback(async () => {
    if (!hasValidNumericIds) {
      return;
    }
    await loadColumns(workspaceNumericId, boardNumericId);
  }, [hasValidNumericIds, loadColumns, workspaceNumericId, boardNumericId]);

  useEffect(() => {
    if (!importStatus) return;
    if (excelHook.lastImportState.current === importStatus.state) return;
    if (importStatus.state === 'COMPLETED') {
      refreshColumns();
      alert('엑셀 가져오기가 완료되었습니다.');
    }
    if (importStatus.state === 'FAILED') {
      alert(importStatus.message || '엑셀 가져오기에 실패했습니다.');
    }
    excelHook.lastImportState.current = importStatus.state;
  }, [alert, importStatus, refreshColumns, excelHook.lastImportState]);

  useBoardSubscription(boardNumericId, (event) => {
    console.log('Board event received:', event);
    if (event.type.startsWith('COLUMN_')) {
      handleColumnEvent(event);
    } else if (event.type.startsWith('CARD_')) {
      handleCardEvent(event);
      sprintHook.setSprintRefreshTrigger(prev => prev + 1);
    } else {
      refreshColumns();
    }
  });

  useEffect(() => {
    const handleOpenCreateCard = () => {
      if (columns.length > 0) {
        uiActions.setShowGlobalCreateCardModal(true);
      } else {
        alert('카드를 생성할 수 있는 칼럼이 없습니다.');
      }
    };

    window.addEventListener('kanban:open-create-card', handleOpenCreateCard);
    return () => window.removeEventListener('kanban:open-create-card', handleOpenCreateCard);
  }, [columns, alert, uiActions]);

  useEffect(() => {
    if (hasValidNumericIds) {
      loadSprints(boardNumericId);
    }
  }, [boardNumericId, hasValidNumericIds, loadSprints]);

  // Keyboard shortcuts for Board context
  useKeyboardShortcut('c', () => {
    if (columns.length > 0) {
      uiActions.setShowGlobalCreateCardModal(true);
    } else {
      alert('카드를 생성할 수 있는 칼럼이 없습니다.');
    }
  });

  useKeyboardShortcut(['/', 'shift+/'], () => {
    uiActions.setShowSearchPanel(true);
  }, { preventDefault: true });

  const handleNavigateBack = () => navigate("/boards");

  const handleArchiveDrop = useCallback(async (cardId: number, columnId: number) => {
    if (!canEdit || !hasValidNumericIds) return;

    try {
      uiActions.setArchiveError(null);
      await cardService.archiveCard(workspaceNumericId, boardNumericId, columnId, cardId);
      await loadCards(workspaceNumericId, boardNumericId, columnId);
      uiActions.setShowArchivePanel(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '카드 아카이브에 실패했습니다';
      uiActions.setArchiveError(message);
      console.error('Failed to archive card from header drop:', err);
    }
  }, [boardNumericId, canEdit, hasValidNumericIds, loadCards, workspaceNumericId, uiActions]);

  const handleEnableSprintWithViewSwitch = useCallback(async () => {
    await sprintHook.handleEnableSprint();
    uiActions.setViewMode('PLANNING');
  }, [sprintHook, uiActions]);

  if (loading) {
    return <BoardLoadingState />;
  }

  if (error || !board || !hasValidNumericIds) {
    return <BoardErrorState onBack={handleNavigateBack} />;
  }

  return (
    <div className="bg-gradient-pastel flex flex-col h-full">
      {uiState.archiveError && (
        <ErrorNotification
          message={uiState.archiveError}
          onClose={() => uiActions.setArchiveError(null)}
        />
      )}
      <BoardHeader
        boardName={board.name}
        overdueCardCount={overdueCardCount}
        canEdit={canEdit}
        viewMode={uiState.viewMode}
        isFilterActive={hasActiveSearchFilter(uiState.searchState)}
        onViewModeChange={uiActions.setViewMode}
        onBack={handleNavigateBack}
        onSearch={() => uiActions.setShowSearchPanel(true)}
        onLabelManager={() => uiActions.setShowLabelManager(true)}
        onToggleActivity={() => uiActions.setShowActivityPanel(!uiState.showActivityPanel)}
        onToggleMembers={() => uiActions.setShowMembersPanel(!uiState.showMembersPanel)}
        onCalendar={() => uiActions.setShowCalendarModal(true)}
        onToggleArchive={() => uiActions.setShowArchivePanel(true)}
        onCreateColumn={() => uiActions.setShowCreateColumnModal(true)}
        onArchiveDrop={handleArchiveDrop}
        onTemplateDownload={excelHook.handleTemplateDownload}
        onExportBoard={excelHook.handleExportBoard}
        onImport={() => uiActions.setShowImportModal(true)}
        isExporting={excelHook.isExporting}
        isDownloadingTemplate={excelHook.isDownloadingTemplate}
        boardMode={board.mode}
        onEnableSprint={() => uiActions.setShowEnableSprintModal(true)}
      />

      {board.mode === 'SPRINT' && activeSprint && (
        <SprintHeader boardId={boardNumericId} refreshTrigger={sprintHook.sprintRefreshTrigger} />
      )}

      <main
        ref={scrollContainerRef}
        className={`flex-1 flex flex-col px-4 sm:px-6 lg:px-8 pt-4 relative kanban-scroll-container ${
          uiState.viewMode === 'LIST' ? 'overflow-auto' : 'overflow-x-auto overflow-y-hidden'
        }`}
      >
              {uiState.viewMode === 'BOARD' ? (
                <ColumnsSection
                  columns={columns}
                  columnsLoading={columnsLoading}
                  workspaceId={workspaceNumericId}
                  boardId={boardNumericId}
                  boardOwnerId={board?.ownerId ?? 0}
                  canEdit={canEdit}
                  onCreateColumn={() => uiActions.setShowCreateColumnModal(true)}
                  autoOpenCardId={effectiveAutoOpenCardId}
                  autoOpenColumnId={effectiveAutoOpenColumnId}
                  onAutoOpenHandled={handleInlineAutoOpenHandled}
                  searchState={uiState.searchState}
                  currentUserId={user?.id}
                />
              ) : uiState.viewMode === 'LIST' ? (
                <ListView
                  columns={columns}
                  cards={cards}
                  workspaceId={workspaceNumericId}
                  boardId={boardNumericId}
                  boardOwnerId={board?.ownerId ?? 0}
                  canEdit={canEdit}
                  onCreateColumn={() => uiActions.setShowCreateColumnModal(true)}
                  searchState={uiState.searchState}
                  currentUserId={user?.id}
                />
              ) : uiState.viewMode === 'PLANNING' ? (
                <PlanningView
                  boardId={boardNumericId}
                  onCreateSprint={() => uiActions.setShowCreateSprintModal(true)}
                />
              ) : (
                <AnalyticsDashboard workspaceId={workspaceNumericId} boardId={boardNumericId} />
              )}
      </main>

      <BoardModals
        workspaceId={workspaceNumericId}
        boardId={boardNumericId}
        boardName={board.name}
        canManage={canManage}
        columns={columns}
        showCreateColumnModal={uiState.showCreateColumnModal}
        showInviteModal={uiState.showInviteModal}
        showMembersPanel={uiState.showMembersPanel}
        showActivityPanel={uiState.showActivityPanel}
        showLabelManager={uiState.showLabelManager}
        showSearchPanel={uiState.showSearchPanel}
        showCalendarModal={uiState.showCalendarModal}
        showArchivePanel={uiState.showArchivePanel}
        showImportModal={uiState.showImportModal}
        showGlobalCreateCardModal={uiState.showGlobalCreateCardModal}
        showEnableSprintModal={uiState.showEnableSprintModal}
        showCreateSprintModal={uiState.showCreateSprintModal}
        onCloseCreateColumn={() => uiActions.setShowCreateColumnModal(false)}
        onCloseInviteModal={() => uiActions.setShowInviteModal(false)}
        onCloseMembersPanel={() => uiActions.setShowMembersPanel(false)}
        onCloseActivityPanel={() => uiActions.setShowActivityPanel(false)}
        onCloseLabelManager={() => uiActions.setShowLabelManager(false)}
        onCloseSearchPanel={() => uiActions.setShowSearchPanel(false)}
        onCloseCalendarModal={() => uiActions.setShowCalendarModal(false)}
        onCloseArchivePanel={() => uiActions.setShowArchivePanel(false)}
        onCloseImportModal={() => uiActions.setShowImportModal(false)}
        onCloseGlobalCreateCard={() => uiActions.setShowGlobalCreateCardModal(false)}
        onCloseEnableSprintModal={() => uiActions.setShowEnableSprintModal(false)}
        onCloseCreateSprintModal={() => uiActions.setShowCreateSprintModal(false)}
        onOpenInviteModal={() => uiActions.setShowInviteModal(true)}
        refreshColumns={refreshColumns}
        onCardSelect={uiActions.handleCardSelect}
        loadCards={loadCards}
        searchState={uiState.searchState}
        setSearchState={uiActions.setSearchState}
        activeImportJobId={excelHook.activeImportJobId}
        importFileName={excelHook.importFileName}
        importStatus={importStatus}
        onImportStarted={excelHook.handleImportStarted}
        onRefreshImportStatus={refreshImportStatus}
        onCloseImportProgress={() => excelHook.setActiveImportJobId(null)}
        onEnableSprint={handleEnableSprintWithViewSwitch}
        onCreateSprint={sprintHook.handleCreateSprint}
      />
    </div>
  );
};

export default BoardDetailPage;
