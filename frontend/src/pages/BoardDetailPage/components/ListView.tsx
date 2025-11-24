import { CreateCardModal } from '@/components/CreateCardModal';
import { CreateColumnModal } from '@/components/CreateColumnModal';
import { EditCardModal } from '@/components/EditCardModal';
import { useCard } from '@/context/CardContext';
import { useColumn } from '@/context/ColumnContext';
import { useDialog } from '@/context/DialogContext';
import type { Card, CardSortKey, SortDirection } from '@/types/card';
import type { Column } from '@/types/column';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HiChevronDown, HiChevronRight, HiChevronUp, HiDotsVertical, HiPlus, HiSelector } from 'react-icons/hi';
import { ListCardRow } from './ListCardRow';

interface SortConfig {
  key: CardSortKey;
  direction: SortDirection;
}

interface ListViewProps {
  columns: Column[];
  cards: { [key: number]: Card[] };
  workspaceId: number;
  boardId: number;
  boardOwnerId: number;
  canEdit: boolean;
  onCreateColumn: () => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const ListView = ({
  columns,
  cards,
  workspaceId,
  boardId,
  boardOwnerId,
  canEdit,
  onCreateColumn,
  scrollContainerRef,
}: ListViewProps) => {
  const { updateCard, loadCards } = useCard();
  const { deleteColumn } = useColumn();
  const { confirm } = useDialog();
  const [dragOverColumnId, setDragOverColumnId] = useState<number | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<number, boolean>>({});
  const [editingCard, setEditingCard] = useState<{ card: Card; columnId: number } | null>(null);
  const [createCardState, setCreateCardState] = useState<{ isOpen: boolean; columnId: number | null }>({ isOpen: false, columnId: null });
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [openColumnMenuId, setOpenColumnMenuId] = useState<number | null>(null);
  const [isDeletingColumnId, setIsDeletingColumnId] = useState<number | null>(null);
  const [columnError, setColumnError] = useState<string | null>(null);
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const columnContentRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const columnMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'asc' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [paginationState, setPaginationState] = useState<Record<number, { page: number; hasNext: boolean; isLoading: boolean }>>({});
  const loadMoreRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const PAGE_SIZE = 100;

  const fetchColumnCards = useCallback(
    async (columnId: number, page: number, append: boolean) => {
      let skip = false;
      setPaginationState((prev) => {
        const current = prev[columnId];
        if (current?.isLoading) {
          skip = true;
          return prev;
        }
        return {
          ...prev,
          [columnId]: {
            page: append ? current?.page ?? 0 : 0,
            hasNext: current?.hasNext ?? true,
            isLoading: true,
          },
        };
      });

      if (skip) return;

      try {
        const response = await loadCards(workspaceId, boardId, columnId, {
          page,
          size: PAGE_SIZE,
          sortKey: sortConfig.key,
          direction: sortConfig.direction,
          append,
          silent: true,
        });
        setPaginationState((prev) => ({
          ...prev,
          [columnId]: {
            page,
            hasNext: response ? !response.last : false,
            isLoading: false,
          },
        }));
      } catch (err) {
        console.error('Failed to fetch column cards:', err);
        setPaginationState((prev) => ({
          ...prev,
          [columnId]: {
            page: prev[columnId]?.page ?? 0,
            hasNext: prev[columnId]?.hasNext ?? true,
            isLoading: false,
          },
        }));
      }
    },
    [boardId, loadCards, sortConfig.direction, sortConfig.key, workspaceId]
  );

  const refreshColumn = useCallback(async (columnId: number) => {
    const state = paginationState[columnId] || { page: 0, hasNext: true };
    const lastPage = state.page ?? 0;

    setPaginationState((prev) => ({
      ...prev,
      [columnId]: { page: lastPage, hasNext: state.hasNext ?? true, isLoading: true },
    }));

    let latestHasNext = state.hasNext ?? true;
    let latestPage = lastPage;

    for (let p = 0; p <= lastPage; p++) {
      const response = await loadCards(workspaceId, boardId, columnId, {
        page: p,
        size: PAGE_SIZE,
        sortKey: sortConfig.key,
        direction: sortConfig.direction,
        append: p !== 0,
        silent: true,
      });
      if (response) {
        latestHasNext = !response.last;
        latestPage = response.page ?? p;
      }
    }

    setPaginationState((prev) => ({
      ...prev,
      [columnId]: { page: latestPage, hasNext: latestHasNext, isLoading: false },
    }));
  }, [boardId, loadCards, paginationState, sortConfig.direction, sortConfig.key, workspaceId]);

  // Load first page for all columns on mount or when dependencies change
  useEffect(() => {
    const initialState: Record<number, { page: number; hasNext: boolean; isLoading: boolean }> = {};
    columns.forEach((col) => {
      initialState[col.id] = { page: 0, hasNext: true, isLoading: false };
    });
    setPaginationState(initialState);

    columns.forEach((col) => {
      fetchColumnCards(col.id, 0, false);
    });
  }, [columns, fetchColumnCards, sortConfig]);

  const scrollToColumn = (columnId: number, index: number) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return;
    }

    const cardsContainer = columnContentRefs.current[columnId];

    if (cardsContainer && cardsContainer.children.length > 0) {
        const firstCard = cardsContainer.children[0] as HTMLElement;

        if (firstCard) {
            const containerScrollTop = scrollContainer.scrollTop;
            const containerRect = scrollContainer.getBoundingClientRect();
            const cardRect = firstCard.getBoundingClientRect();

            // Calculate sticky headers: main header + all column headers up to and including this one
            const stickyTop = MAIN_HEADER_HEIGHT + (index + 1) * COLUMN_HEADER_HEIGHT;

            const relativeCardTop = cardRect.top - containerRect.top;
            const targetScrollTop = containerScrollTop + relativeCardTop - stickyTop;

            scrollContainer.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
            });
        }
    }
  };

  const toggleColumn = (columnId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: number) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumnId(columnId);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, columnId: number) => {
    if (!canEdit) return;
    e.preventDefault();
    setDragOverColumnId(null);

    const cardId = Number(e.dataTransfer.getData('cardId'));
    const sourceColumnId = Number(e.dataTransfer.getData('sourceColumnId'));

    if (isNaN(cardId) || isNaN(sourceColumnId)) return;

    if (sourceColumnId !== columnId) {
      try {
        // 컬럼 이동 시 카드를 해당 컬럼의 첫 번째로 이동
        await updateCard(workspaceId, boardId, sourceColumnId, cardId, {
          columnId,
          position: 0,
        });
        await Promise.all([
          refreshColumn(sourceColumnId),
          refreshColumn(columnId),
        ]);
      } catch (err) {
        console.error('Failed to move card:', err);
      }
    }
  };

  // Constants for sticky header calculation
  const MAIN_HEADER_HEIGHT = 60;
  const COLUMN_HEADER_HEIGHT = 50;

  useEffect(() => {
    if (openColumnMenuId === null) return;
    const handleClickOutside = (event: MouseEvent) => {
      const menuEl = columnMenuRefs.current[openColumnMenuId];
      if (menuEl && !menuEl.contains(event.target as Node)) {
        setOpenColumnMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openColumnMenuId]);

  useEffect(() => {
    const handleDragEnd = () => setDragOverColumnId(null);
    window.addEventListener('dragend', handleDragEnd);
    return () => window.removeEventListener('dragend', handleDragEnd);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const columnId = Number(entry.target.getAttribute('data-column-id'));
          if (Number.isNaN(columnId)) return;
          const state = paginationState[columnId];
          const isCollapsed = collapsedColumns[columnId];
          if (isCollapsed || !state || state.isLoading || !state.hasNext) return;
          void fetchColumnCards(columnId, (state.page ?? 0) + 1, true);
        });
      },
      {
        root: scrollContainerRef.current || null,
        threshold: 0,
        rootMargin: '200px 0px',
      }
    );

    Object.entries(loadMoreRefs.current).forEach(([columnId, el]) => {
      if (el) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [collapsedColumns, columns, fetchColumnCards, paginationState, scrollContainerRef]);

  const handleDeleteColumn = async (columnId: number) => {
    const confirmed = await confirm('정말 이 칼럼을 삭제하시겠습니까?', {
      confirmText: '삭제',
      cancelText: '취소',
      isDestructive: true,
    });
    if (!confirmed) return;

    try {
      setIsDeletingColumnId(columnId);
      setColumnError(null);
      await deleteColumn(workspaceId, boardId, columnId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '칼럼 삭제에 실패했습니다';
      setColumnError(message);
      console.error('Failed to delete column:', err);
    } finally {
      setIsDeletingColumnId(null);
      setOpenColumnMenuId(null);
    }
  };

  const toggleSort = (key: CardSortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const renderSortIcon = (key: CardSortKey) => {
    if (sortConfig.key !== key) {
      return <HiSelector className="w-4 h-4 text-slate-300" />;
    }
    return sortConfig.direction === 'asc' ? (
      <HiChevronUp className="w-4 h-4 text-pastel-blue-600" />
    ) : (
      <HiChevronDown className="w-4 h-4 text-pastel-blue-600" />
    );
  };

  const renderSortableHeader = (label: string, key: CardSortKey) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className={`flex items-center gap-1 hover:text-pastel-blue-600 transition-colors ${sortConfig.key === key ? 'text-pastel-blue-700' : ''}`}
    >
      <span>{label}</span>
      {renderSortIcon(key)}
    </button>
  );

  const compareCards = (a: Card, b: Card) => {
    const { key, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;
    const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const getDateValue = (value?: string | null) => (value ? new Date(value).getTime() : null);
    const fallback = direction === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

    switch (key) {
      case 'title':
        return a.title.localeCompare(b.title, 'ko') * multiplier;
      case 'priority': {
        const aWeight = priorityWeight[a.priority || ''] || 0;
        const bWeight = priorityWeight[b.priority || ''] || 0;
        return (aWeight - bWeight) * multiplier;
      }
      case 'startedAt': {
        const aValue = getDateValue(a.startedAt) ?? fallback;
        const bValue = getDateValue(b.startedAt) ?? fallback;
        return (aValue - bValue) * multiplier;
      }
      case 'dueDate': {
        const aValue = getDateValue(a.dueDate) ?? fallback;
        const bValue = getDateValue(b.dueDate) ?? fallback;
        return (aValue - bValue) * multiplier;
      }
      case 'completedAt': {
        const aValue = getDateValue(a.completedAt) ?? fallback;
        const bValue = getDateValue(b.completedAt) ?? fallback;
        return (aValue - bValue) * multiplier;
      }
      case 'createdAt':
      default: {
        const aValue = getDateValue(a.createdAt) ?? fallback;
        const bValue = getDateValue(b.createdAt) ?? fallback;
        return (aValue - bValue) * multiplier;
      }
    }
  };

  return (
    <div className="w-full max-w-[95vw] mx-auto pb-10 relative">
      {columnError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm">
          {columnError}
        </div>
      )}
      {/* Table Header */}
      <div
        className="sticky top-0 z-30 bg-white/95 backdrop-blur shadow-sm grid grid-cols-[40px_minmax(300px,3fr)_100px_120px_minmax(200px,2fr)_110px_100px_100px_100px_150px_90px] gap-4 px-4 py-2 items-center text-xs font-semibold text-slate-500 border-b border-slate-200 mb-4 rounded-b-lg"
        style={{ height: `${MAIN_HEADER_HEIGHT}px` }}
      >
        <div className="text-center">완료</div>
        <div className="flex items-center gap-2">
          {renderSortableHeader('제목', 'title')}
        </div>
        <div className="flex items-center gap-2">
          {renderSortableHeader('우선순위', 'priority')}
        </div>
        <div>라벨</div>
        <div>설명</div>
        <div className="flex items-center gap-2">
          {renderSortableHeader('생성일', 'createdAt')}
        </div>
        <div className="flex items-center gap-2">
          {renderSortableHeader('마감일', 'dueDate')}
        </div>
        <div className="flex items-center gap-2">
          {renderSortableHeader('시작일', 'startedAt')}
        </div>
        <div className="flex items-center gap-2">
          {renderSortableHeader('완료일', 'completedAt')}
        </div>
        <div>담당자</div>
        <div className="flex justify-end">
          {canEdit && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm whitespace-nowrap ${
                isEditMode
                  ? 'bg-pastel-blue-500 text-white hover:bg-pastel-blue-600 ring-2 ring-pastel-blue-200'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400'
              }`}
            >
              {isEditMode ? '편집 종료' : '편집 모드'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {columns.map((column, index) => {
            const columnCards = cards[column.id] || [];
            const sortedCards = [...columnCards].sort(compareCards);
            const pageState = paginationState[column.id] || { page: 0, hasNext: true, isLoading: false };

            const isDragOver = dragOverColumnId === column.id;
            const isCollapsed = collapsedColumns[column.id];

            // Calculate sticky top position: Main Header + (Previous Column Headers)
            const stickyTop = MAIN_HEADER_HEIGHT + (index * COLUMN_HEADER_HEIGHT);

            return (
              <div
                key={column.id}
                className="contents"
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div
                  ref={(el) => { columnRefs.current[column.id] = el; }}
                  onClick={() => scrollToColumn(column.id, index)}
                  className={`sticky z-20 backdrop-blur border-y border-slate-200 px-4 py-2 flex items-center justify-between group transition-colors duration-200 cursor-pointer hover:bg-slate-100/95 ${
                    isDragOver ? 'bg-blue-100 border-blue-300' : 'bg-slate-50/95'
                  }`}
                  style={{
                    top: `${stickyTop}px`,
                    height: `${COLUMN_HEADER_HEIGHT}px`
                  }}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleColumn(column.id, e)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                    >
                      {isCollapsed ? <HiChevronRight /> : <HiChevronDown />}
                    </button>
                    <span className="font-medium text-slate-700 text-sm">{column.name}</span>
                    <span className="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                      {columnCards.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                        <button
                            onClick={() => {
                                setCreateCardState({ isOpen: true, columnId: column.id });
                            }}
                            className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-500 hover:text-pastel-blue-600 transition-all"
                            title="카드 추가"
                        >
                            <HiPlus className="w-4 h-4" />
                        </button>
                    )}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenColumnMenuId(openColumnMenuId === column.id ? null : column.id);
                            }}
                            className="p-1.5 hover:bg-white hover:shadow-sm rounded text-slate-500 hover:text-slate-700 transition-all"
                        >
                            <HiDotsVertical className="w-4 h-4" />
                        </button>

                        {openColumnMenuId === column.id && (
                            <div
                                ref={(el) => { columnMenuRefs.current[column.id] = el; }}
                                className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                            >
                                <button
                                    onClick={() => {
                                        setEditingColumn(column);
                                        setOpenColumnMenuId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-pastel-blue-600 transition-colors flex items-center gap-2"
                                >
                                    <span>수정</span>
                                </button>
                                <button
                                    onClick={() => handleDeleteColumn(column.id)}
                                    disabled={isDeletingColumnId === column.id}
                                    className="w-full px-4 py-2 text-left text-sm text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2"
                                >
                                  {isDeletingColumnId === column.id ? '삭제 중...' : '삭제'}
                                </button>
                            </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Cards */}
                <div
                    ref={(el) => { columnContentRefs.current[column.id] = el; }}
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'
                    } ${isDragOver ? 'bg-blue-100' : ''}`}
                >
                  {sortedCards.map((card) => (
                    <ListCardRow
                      key={card.id}
                      card={card}
                      workspaceId={workspaceId}
                      boardId={boardId}
                      boardOwnerId={boardOwnerId}
                      columnId={column.id}
                      canEdit={canEdit}
                      isEditMode={isEditMode}
                      onRefreshColumn={() => refreshColumn(column.id)}
                      onEditCard={(fullCard) => setEditingCard({ card: fullCard, columnId: column.id })}
                      onDropComplete={() => {
                        // Refresh logic if needed
                      }}
                    />
                  ))}
                  {columnCards.length === 0 && (
                    <div className="px-4 py-8 text-center text-slate-400 text-xs italic bg-slate-50/50 border-b border-slate-100">
                      카드가 없습니다
                    </div>
                  )}
                  {pageState.isLoading && (
                    <div className="px-4 py-3 text-center text-slate-400 text-xs">
                      불러오는 중...
                    </div>
                  )}
                  <div
                    ref={(el) => {
                      loadMoreRefs.current[column.id] = el;
                    }}
                    data-column-id={column.id}
                    className="h-8"
                  />
                </div>
              </div>
            );
        })}

        {canEdit && (
          <div className="flex justify-center mt-6">
            <button
              onClick={onCreateColumn}
              className="flex-shrink-0 w-full min-h-28 rounded-2xl border-4 border-dashed border-white/70 bg-white/10 flex items-center justify-center text-pastel-blue-800 font-semibold text-base hover:bg-white/20 hover:border-4 hover:border-dashed hover:border-black transition"
            >
              + 칼럼 추가
            </button>
          </div>
        )}
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <EditCardModal
          card={editingCard.card}
          workspaceId={workspaceId}
          boardId={boardId}
          boardOwnerId={boardOwnerId}
          columnId={editingCard.columnId}
          canEdit={canEdit}
          onClose={() => setEditingCard(null)}
        />
      )}

      {/* Create Card Modal */}
      {createCardState.isOpen && createCardState.columnId !== null && (
        <CreateCardModal
          workspaceId={workspaceId}
          boardId={boardId}
          columnId={createCardState.columnId}
          onClose={() => setCreateCardState({ isOpen: false, columnId: null })}
          onSuccess={() => {
             if (createCardState.columnId) {
                 loadCards(workspaceId, boardId, createCardState.columnId);
             }
             setCreateCardState({ isOpen: false, columnId: null });
          }}
        />
      )}

      {/* Edit Column Modal */}
      {editingColumn && (
        <CreateColumnModal
          workspaceId={workspaceId}
          boardId={boardId}
          editColumn={editingColumn}
          onClose={() => setEditingColumn(null)}
        />
      )}
    </div>
  );
};
