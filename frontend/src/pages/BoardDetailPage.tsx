import { ArchivedCardsPanel } from "@/components/archive/ArchivedCardsPanel";
import { CreateCardModal } from "@/components/CreateCardModal";
import { ErrorNotification } from "@/components/ErrorNotification";
import { CreateSprintModal } from "@/components/sprint/CreateSprintModal";
import { EnableSprintModal } from "@/components/sprint/EnableSprintModal";
import { PlanningView } from "@/components/sprint/PlanningView";
import { SprintHeader } from "@/components/sprint/SprintHeader";
import { useCard } from "@/context/CardContext";
import { useColumn } from "@/context/ColumnContext";
import { useDialog } from "@/context/DialogContext";
import { useSprint } from "@/context/SprintContext";
import { useBoardSubscription } from "@/hooks/useBoardSubscription";
import { useImportProgress } from "@/hooks/useImportProgress";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { usePermissions } from "@/hooks/usePermissions";
import { usePresenceTransition } from "@/hooks/usePresenceTransition";
import { boardService } from "@/services/boardService";
import cardService from "@/services/cardService";
import excelService from "@/services/excelService";
import type { ImportJobStartResponse } from "@/types/excel";
import type { CardSearchResult } from "@/types/search";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ActivityPanel } from "./BoardDetailPage/components/ActivityPanel";
import AnalyticsDashboard from "./BoardDetailPage/components/AnalyticsDashboard";
import { BoardHeader } from "./BoardDetailPage/components/BoardHeader";
import { BoardModals } from "./BoardDetailPage/components/BoardModals";
import {
  BoardErrorState,
  BoardLoadingState,
} from "./BoardDetailPage/components/BoardStateFallbacks";
import { ColumnsSection } from "./BoardDetailPage/components/ColumnsSection";
import { ExcelImportModal } from "./BoardDetailPage/components/ExcelImportModal";
import { ImportProgressPanel } from "./BoardDetailPage/components/ImportProgressPanel";
import { ListView } from "./BoardDetailPage/components/ListView";
import { MembersModal } from "./BoardDetailPage/components/MembersModal";
import {
  useAutoOpenTargets,
  useBoardData,
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
  const { loadSprints, activeSprint, createSprint } = useSprint();

  const [viewMode, setViewMode] = useState<'BOARD' | 'LIST' | 'ANALYTICS' | 'PLANNING'>(() => {
    const savedMode = localStorage.getItem('boardViewMode');
    // Only restore BOARD or LIST from localStorage
    return (savedMode === 'BOARD' || savedMode === 'LIST') ? savedMode : 'BOARD';
  });

  useEffect(() => {
    // Only save BOARD or LIST to localStorage
    if (viewMode === 'BOARD' || viewMode === 'LIST') {
      localStorage.setItem('boardViewMode', viewMode);
    }
  }, [viewMode]);

  const [showCreateColumnModal, setShowCreateColumnModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showArchivePanel, setShowArchivePanel] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGlobalCreateCardModal, setShowGlobalCreateCardModal] = useState(false);
  const [showEnableSprintModal, setShowEnableSprintModal] = useState(false);
  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false);
  const [sprintRefreshTrigger, setSprintRefreshTrigger] = useState(0); // SprintHeader 갱신용

  const [activeImportJobId, setActiveImportJobId] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState<string>('엑셀 가져오기');
  const lastImportState = useRef<ImportJobStartResponse['state'] | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Search Panel State Persistence
  const [searchState, setSearchState] = useState({
    keyword: '',
    selectedPriorities: [] as string[],
    selectedLabelIds: [] as number[],
    selectedAssigneeIds: [] as number[],
    isCompleted: undefined as boolean | undefined,
    overdue: false,
    dueDateFrom: '',
    dueDateTo: '',
    sortBy: 'UPDATED_AT' as 'PRIORITY' | 'DUE_DATE' | 'CREATED_AT' | 'UPDATED_AT',
    sortDir: 'DESC' as 'ASC' | 'DESC',
  });


  const activityPanelTransition = usePresenceTransition(showActivityPanel);

  const { board, loading, error, reloadBoard, updateBoardLocally } = useBoardData(
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
  const overdueCardCount = useOverdueCardCount(columns, cards);

  const workspaceNumericId = workspaceId ? Number(workspaceId) : Number.NaN;
  const boardNumericId = boardId ? Number(boardId) : Number.NaN;
  const hasValidNumericIds =
    !Number.isNaN(workspaceNumericId) && !Number.isNaN(boardNumericId);
  const { status: importStatus, refresh: refreshImportStatus } =
    useImportProgress(boardNumericId, activeImportJobId);

  const refreshColumns = useCallback(async () => {
    if (!hasValidNumericIds) {
      return;
    }
    await loadColumns(workspaceNumericId, boardNumericId);
  }, [hasValidNumericIds, loadColumns, workspaceNumericId, boardNumericId]);

  useEffect(() => {
    if (!importStatus) return;
    if (lastImportState.current === importStatus.state) return;
    if (importStatus.state === 'COMPLETED') {
      refreshColumns();
      alert('엑셀 가져오기가 완료되었습니다.');
    }
    if (importStatus.state === 'FAILED') {
      alert(importStatus.message || '엑셀 가져오기에 실패했습니다.');
    }
    lastImportState.current = importStatus.state;
  }, [alert, importStatus, refreshColumns]);

  useBoardSubscription(boardNumericId, (event) => {
    console.log('Board event received:', event);
    if (event.type.startsWith('COLUMN_')) {
      handleColumnEvent(event);
    } else if (event.type.startsWith('CARD_')) {
      handleCardEvent(event);
      // 카드 이벤트 발생 시 SprintHeader 갱신
      setSprintRefreshTrigger(prev => prev + 1);
    } else {
      refreshColumns(); // Fallback for other events (e.g. BOARD_UPDATED)
    }
  });

  useEffect(() => {
    const handleOpenCreateCard = () => {
      if (columns.length > 0) {
        setShowGlobalCreateCardModal(true);
      } else {
        alert('카드를 생성할 수 있는 칼럼이 없습니다.');
      }
    };

    window.addEventListener('kanban:open-create-card', handleOpenCreateCard);
    return () => window.removeEventListener('kanban:open-create-card', handleOpenCreateCard);
  }, [columns, alert]);

  // Load sprints whenever boardId is valid, to show sprint badges in all views
  useEffect(() => {
    if (hasValidNumericIds) {
      loadSprints(boardNumericId);
    }
  }, [boardNumericId, hasValidNumericIds, loadSprints]);

  // Keyboard shortcuts for Board context
  // C: Create new card
  useKeyboardShortcut('c', () => {
    if (columns.length > 0) {
      setShowGlobalCreateCardModal(true);
    } else {
      alert('카드를 생성할 수 있는 칼럼이 없습니다.');
    }
  });

  // /: Open search panel in board context
  useKeyboardShortcut('/', () => {
    setShowSearchPanel(true);
  }, { preventDefault: true });

  const handleNavigateBack = () => navigate("/boards");

  const handleCardSelect = useCallback(
    (result: CardSearchResult) => {
      setInlineCardFocus({ cardId: result.id, columnId: result.columnId });
    },
    [setInlineCardFocus],
  );
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const handleArchiveDrop = useCallback(async (cardId: number, columnId: number) => {
    if (!canEdit || !hasValidNumericIds) return;

    try {
      setArchiveError(null);
      await cardService.archiveCard(workspaceNumericId, boardNumericId, columnId, cardId);
      await loadCards(workspaceNumericId, boardNumericId, columnId);
      setShowArchivePanel(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '카드 아카이브에 실패했습니다';
      setArchiveError(message);
      console.error('Failed to archive card from header drop:', err);
    }
  }, [boardNumericId, canEdit, hasValidNumericIds, loadCards, workspaceNumericId]);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);

  const handleTemplateDownload = useCallback(async () => {
    if (!hasValidNumericIds) {
      await alert('보드 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsDownloadingTemplate(true);
    try {
      const blob = await excelService.downloadTemplate(workspaceNumericId, boardNumericId);
      downloadBlob(blob, `board-${boardNumericId}-template.xlsx`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '템플릿 다운로드에 실패했습니다.';
      await alert(message);
    } finally {
      setIsDownloadingTemplate(false);
    }
  }, [alert, boardNumericId, downloadBlob, hasValidNumericIds, workspaceNumericId]);

  const handleExportBoard = useCallback(async () => {
    if (!hasValidNumericIds) {
      await alert('보드 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsExporting(true);
    try {
      const blob = await excelService.exportBoard(workspaceNumericId, boardNumericId);
      downloadBlob(blob, `board-${boardNumericId}-export.xlsx`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '엑셀 내보내기에 실패했습니다.';
      await alert(message);
    } finally {
      setIsExporting(false);
    }
  }, [alert, boardNumericId, downloadBlob, hasValidNumericIds, workspaceNumericId]);

  const handleImportStarted = useCallback((job: ImportJobStartResponse, fileName: string) => {
    setActiveImportJobId(job.jobId);
    setImportFileName(fileName);
    refreshImportStatus();
  }, [refreshImportStatus]);

  // Sprint activation handler
  const handleEnableSprint = useCallback(async () => {
    if (!hasValidNumericIds || !board) return;

    try {
      // Optimistic update - update UI immediately
      updateBoardLocally?.({ ...board, mode: 'SPRINT' });
      setViewMode('PLANNING'); // Switch to Planning view immediately

      // Then sync with server in background
      const updatedBoard = await boardService.enableSprint(workspaceNumericId, boardNumericId);
      console.log('Sprint activated successfully:', updatedBoard);

      // Update with server response to ensure consistency
      updateBoardLocally?.(updatedBoard);
    } catch (error) {
      console.error('Sprint activation error:', error);
      // Rollback on error
      updateBoardLocally?.(board);
      await alert(`Sprint 활성화에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      throw error; // Propagate to prevent modal opening
    }
  }, [hasValidNumericIds, workspaceNumericId, boardNumericId, alert, board, updateBoardLocally]);

  // Sprint creation handler
  const handleCreateSprint = useCallback(async (data: any) => {
    if (!hasValidNumericIds) return;

    try {
      await createSprint(boardNumericId, data);
      alert('Sprint가 생성되었습니다!');
    } catch (error) {
      throw error; // Propagate to modal
    }
  }, [hasValidNumericIds, boardNumericId, createSprint, alert]);

  if (loading) {
    return <BoardLoadingState />;
  }

  if (error || !board || !hasValidNumericIds) {
    return <BoardErrorState onBack={handleNavigateBack} />;
  }

  return (
    <div className="bg-gradient-pastel flex flex-col h-full">
      {archiveError && (
        <ErrorNotification
          message={archiveError}
          onClose={() => setArchiveError(null)}
        />
      )}
      <BoardHeader
        boardName={board.name}
        overdueCardCount={overdueCardCount}
        canEdit={canEdit}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onBack={handleNavigateBack}
        onSearch={() => setShowSearchPanel(true)}
        onLabelManager={() => setShowLabelManager(true)}
        onToggleActivity={() => setShowActivityPanel((prev) => !prev)}
        onToggleMembers={() => setShowMembersPanel((prev) => !prev)}
        onCalendar={() => setShowCalendarModal(true)}
        onToggleArchive={() => setShowArchivePanel(true)}
        onCreateColumn={() => setShowCreateColumnModal(true)}
        onArchiveDrop={handleArchiveDrop}
        onTemplateDownload={handleTemplateDownload}
        onExportBoard={handleExportBoard}
        onImport={() => setShowImportModal(true)}
        isExporting={isExporting}
        isDownloadingTemplate={isDownloadingTemplate}
        boardMode={board.mode}
        onEnableSprint={() => setShowEnableSprintModal(true)}
      />

      {/* Sprint Header - only show in Sprint mode with active sprint */}
      {board.mode === 'SPRINT' && activeSprint && (
        <SprintHeader boardId={boardNumericId} refreshTrigger={sprintRefreshTrigger} />
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex-1 overflow-hidden pt-4 pb-4 flex">
          <div className="w-full max-w-[95vw] mx-auto flex flex-1 relative min-h-0 h-full">
            <div
              ref={scrollContainerRef}
              className={`flex-1 flex flex-col pr-0 lg:pr-4 h-full min-w-0 ${
                viewMode === 'BOARD' ? 'columns-scroll-area' : 'overflow-auto'
              }`}
            >
              {viewMode === 'BOARD' ? (
                <ColumnsSection
                  columns={columns}
                  columnsLoading={columnsLoading}
                  workspaceId={workspaceNumericId}
                  boardId={boardNumericId}
                  boardOwnerId={board?.ownerId ?? 0}
                  canEdit={canEdit}
                  onCreateColumn={() => setShowCreateColumnModal(true)}
                  autoOpenCardId={effectiveAutoOpenCardId}
                  autoOpenColumnId={effectiveAutoOpenColumnId}
                  onAutoOpenHandled={handleInlineAutoOpenHandled}
                />
              ) : viewMode === 'LIST' ? (
                <ListView
                  columns={columns}
                  cards={cards}
                  workspaceId={workspaceNumericId}
                  boardId={boardNumericId}
                  boardOwnerId={board?.ownerId ?? 0}
                  canEdit={canEdit}
                  onCreateColumn={() => setShowCreateColumnModal(true)}
                  scrollContainerRef={scrollContainerRef}
                />
              ) : viewMode === 'PLANNING' ? (
                <PlanningView
                  boardId={boardNumericId}
                  onCreateSprint={() => setShowCreateSprintModal(true)}
                />
              ) : (
                <AnalyticsDashboard workspaceId={workspaceNumericId} boardId={boardNumericId} />
              )}
            </div>

            {showMembersPanel && (
              <MembersModal
                isOpen={showMembersPanel}
                boardId={boardNumericId}
                canManage={canManage}
                onInvite={() => setShowInviteModal(true)}
                onClose={() => setShowMembersPanel(false)}
              />
            )}

            <ActivityPanel
              transition={{
                shouldRender: activityPanelTransition.shouldRender,
                stage: activityPanelTransition.stage,
              }}
              boardId={boardNumericId}
              onClose={() => setShowActivityPanel(false)}
            />
          </div>
        </div>
      </main>

      <BoardModals
        workspaceId={workspaceNumericId}
        boardId={boardNumericId}
        showCreateColumnModal={showCreateColumnModal}
        onCloseCreateColumn={() => setShowCreateColumnModal(false)}
        refreshColumns={refreshColumns}
        showInviteModal={showInviteModal}
        onCloseInviteModal={() => setShowInviteModal(false)}
        showLabelManager={showLabelManager}
        onCloseLabelManager={() => setShowLabelManager(false)}
        showSearchPanel={showSearchPanel}
        onCloseSearchPanel={() => setShowSearchPanel(false)}
        onCardSelect={handleCardSelect}
        showCalendarModal={showCalendarModal}
        onCloseCalendarModal={() => setShowCalendarModal(false)}
        cards={Object.values(cards).flat()}
        searchState={searchState}
        setSearchState={setSearchState}
      />

      <ExcelImportModal
        isOpen={showImportModal}
        workspaceId={workspaceNumericId}
        boardId={boardNumericId}
        onClose={() => setShowImportModal(false)}
        onStarted={handleImportStarted}
      />

      {importStatus && activeImportJobId && (
        <ImportProgressPanel
          status={importStatus}
          fileName={importFileName}
          onRefresh={refreshImportStatus}
          onClose={() => setActiveImportJobId(null)}
        />
      )}

      {/* 아카이브 패널 */}
      {showArchivePanel && (
        <ArchivedCardsPanel
          workspaceId={workspaceNumericId}
          boardId={boardNumericId}
          onClose={() => setShowArchivePanel(false)}
          onRestore={() => refreshColumns()}
        />
      )}

      {/* Global Create Card Modal (triggered via Custom Event) */}
      {showGlobalCreateCardModal && columns.length > 0 && (
        <CreateCardModal
          workspaceId={workspaceNumericId}
          boardId={boardNumericId}
          columnId={columns[0].id}
          onClose={() => setShowGlobalCreateCardModal(false)}
          onSuccess={() => {
            loadCards(workspaceNumericId, boardNumericId, columns[0].id);
          }}
        />
      )}

      {/* Enable Sprint Modal */}
      <EnableSprintModal
        isOpen={showEnableSprintModal}
        boardId={boardNumericId}
        boardName={board.name}
        onClose={() => setShowEnableSprintModal(false)}
        onConfirm={async () => {
          try {
            await handleEnableSprint();
            setShowEnableSprintModal(false);
            // Suggest creating first sprint
            setShowCreateSprintModal(true);
          } catch (error) {
            // Error already handled in handleEnableSprint
            // Don't close modal or open create sprint modal
          }
        }}
      />

      {/* Create Sprint Modal */}
      <CreateSprintModal
        isOpen={showCreateSprintModal}
        boardId={boardNumericId}
        onClose={() => setShowCreateSprintModal(false)}
        onSubmit={handleCreateSprint}
      />
    </div>
  );
};

export default BoardDetailPage;
