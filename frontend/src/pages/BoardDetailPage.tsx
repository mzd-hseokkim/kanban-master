import { ArchivedCardsPanel } from "@/components/archive/ArchivedCardsPanel";
import { CreateCardModal } from "@/components/CreateCardModal";
import { ErrorNotification } from "@/components/ErrorNotification";
import { useCard } from "@/context/CardContext";
import { useColumn } from "@/context/ColumnContext";
import { useDialog } from "@/context/DialogContext";
import { useBoardSubscription } from "@/hooks/useBoardSubscription";
import { useImportProgress } from "@/hooks/useImportProgress";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { usePermissions } from "@/hooks/usePermissions";
import { usePresenceTransition } from "@/hooks/usePresenceTransition";
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

  const [viewMode, setViewMode] = useState<'BOARD' | 'LIST' | 'ANALYTICS'>(() => {
    const savedMode = localStorage.getItem('boardViewMode');
    return (savedMode === 'BOARD' || savedMode === 'LIST' || savedMode === 'ANALYTICS') ? savedMode : 'BOARD';
  });

  useEffect(() => {
    localStorage.setItem('boardViewMode', viewMode);
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

  const { board, loading, error } = useBoardData(
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
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex-1 overflow-hidden pt-4 pb-4 flex">
          <div className="w-full max-w-[95vw] mx-auto flex flex-1 relative min-h-0 h-full">
            <div ref={scrollContainerRef} className="flex-1 overflow-auto flex flex-col pr-0 lg:pr-4 h-full">
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
    </div>
  );
};

export default BoardDetailPage;
