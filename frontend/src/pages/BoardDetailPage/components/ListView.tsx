import { CreateCardModal } from '@/components/CreateCardModal';
import { CreateColumnModal } from '@/components/CreateColumnModal';
import { EditCardModal } from '@/components/EditCardModal';
import { useCard } from '@/context/CardContext';
import { useColumn } from '@/context/ColumnContext';
import { useDialog } from '@/context/DialogContext';
import type { Card } from '@/types/card';
import type { Column } from '@/types/column';
import React, { useEffect, useRef, useState } from 'react';
import { HiChevronDown, HiChevronRight, HiDotsVertical, HiPlus } from 'react-icons/hi';
import { ListCardRow } from './ListCardRow';

interface ListViewProps {
  columns: Column[];
  cards: { [key: number]: Card[] };
  workspaceId: number;
  boardId: number;
  boardOwnerId: number;
  canEdit: boolean;
  onCreateColumn: () => void;
}

export const ListView = ({
  columns,
  cards,
  workspaceId,
  boardId,
  boardOwnerId,
  canEdit,
  onCreateColumn,
}: ListViewProps) => {
  const { updateCard, loadCards } = useCard();
  const { deleteColumn } = useColumn();
  const { confirm } = useDialog();
  const [dragOverColumnId, setDragOverColumnId] = useState<number | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<number, boolean>>({});
  const [editingCard, setEditingCard] = useState<{ card: Card; columnId: number } | null>(null);
  const [createCardState, setCreateCardState] = useState<{ isOpen: boolean; columnId: number | null }>({ isOpen: false, columnId: null });
  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [loadingColumns, setLoadingColumns] = useState<Record<number, boolean>>({});
  const [openColumnMenuId, setOpenColumnMenuId] = useState<number | null>(null);
  const [isDeletingColumnId, setIsDeletingColumnId] = useState<number | null>(null);
  const [columnError, setColumnError] = useState<string | null>(null);
  const columnRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const columnContentRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const columnMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Load cards for all columns on mount or when columns change
  useEffect(() => {
    const fetchCards = async () => {
      if (columns.length > 0) {
        // Set all columns to loading initially
        setLoadingColumns(columns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {}));

        try {
          await Promise.all(columns.map(async (col) => {
            try {
              await loadCards(workspaceId, boardId, col.id);
            } finally {
              setLoadingColumns(prev => ({ ...prev, [col.id]: false }));
            }
          }));
        } catch (err) {
          console.error('Failed to load cards in ListView:', err);
        }
      }
    };
    fetchCards();
  }, [columns, workspaceId, boardId, loadCards]);

  const toggleColumn = (columnId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering scroll
    setCollapsedColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const scrollToColumn = (columnId: number, index: number) => {
    const performScroll = () => {
      const headerEl = columnRefs.current[columnId];
      const contentEl = columnContentRefs.current[columnId];
      const container = headerEl?.closest('.overflow-auto');

      if (container && headerEl) {
        const stickyTop = 45 + (index * 50); // MAIN_HEADER_HEIGHT + index * COLUMN_HEADER_HEIGHT

        let targetTop;
        if (contentEl) {
          // Scroll to content: Content Top - (Header Stack + Current Header Height)
          targetTop = (contentEl as HTMLElement).offsetTop - (stickyTop + 50);
        } else {
          // Fallback to header: Header Top - Header Stack
          targetTop = (headerEl as HTMLElement).offsetTop - stickyTop;
        }

        container.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });
      }
    };

    if (collapsedColumns[columnId]) {
      setCollapsedColumns((prev) => ({
        ...prev,
        [columnId]: false,
      }));
      // Wait for render to ensure content ref is available
      setTimeout(performScroll, 100);
    } else {
      performScroll();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: number) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumnId(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
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
        await loadCards(workspaceId, boardId, sourceColumnId);
        await loadCards(workspaceId, boardId, columnId);
      } catch (err) {
        console.error('Failed to move card:', err);
      }
    }
  };

  // Constants for sticky header calculation
  const MAIN_HEADER_HEIGHT = 45;
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

  return (
    <div className="w-full max-w-[95vw] mx-auto pb-10 relative">
      {columnError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-sm">
          {columnError}
        </div>
      )}
      {/* Table Header */}
      <div
        className="sticky top-0 z-30 bg-white/95 backdrop-blur shadow-sm grid grid-cols-[40px_minmax(300px,3fr)_100px_120px_minmax(200px,2fr)_100px_100px_100px_150px_40px] gap-4 px-4 py-3 text-xs font-semibold text-slate-500 border-b border-slate-200 mb-4 rounded-b-lg"
        style={{ height: `${MAIN_HEADER_HEIGHT}px` }}
      >
        <div className="text-center">완료</div>
        <div>제목</div>
        <div>우선순위</div>
        <div>라벨</div>
        <div>설명</div>
        <div>마감일</div>
        <div>시작일</div>
        <div>완료일</div>
        <div>담당자</div>
        <div></div>
      </div>

      <div className="flex flex-col">
        {columns.map((column, index) => {
            const columnCards = cards[column.id] || [];
            const isDragOver = dragOverColumnId === column.id;
            const isCollapsed = collapsedColumns[column.id];

            // Calculate sticky top position: Main Header + (Previous Column Headers)
            const stickyTop = MAIN_HEADER_HEIGHT + (index * COLUMN_HEADER_HEIGHT);

            return (
                <React.Fragment key={column.id}>
                    {/* Column Header */}
                    <div
                      ref={(el) => (columnRefs.current[column.id] = el)}
                      className={`sticky z-20 flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors ${
                        isCollapsed ? 'rounded-lg mb-4' : 'rounded-t-lg border-b-0'
                      } ${
                        isDragOver ? 'bg-slate-50 border-pastel-blue-300 ring-2 ring-pastel-blue-100' : ''
                      }`}
                      style={{
                        top: `${stickyTop}px`,
                        height: `${COLUMN_HEADER_HEIGHT}px`,
                        scrollMarginTop: `${stickyTop}px`
                      }}
                      onClick={() => scrollToColumn(column.id, index)}
                      onDragOver={(e) => handleDragOver(e, column.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, column.id)}
                    >
                        <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => toggleColumn(column.id, e)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                              {isCollapsed ? <HiChevronRight /> : <HiChevronDown />}
                            </button>
                            <div
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: column.bgColor || '#cbd5e1' }}
                            />
                            <h3 className="font-semibold text-slate-700">{column.name}</h3>
                            <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                {columnCards.length}
                            </span>
                            {canEdit && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCreateCardState({ isOpen: true, columnId: column.id });
                                    }}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors ml-1"
                                >
                                    <HiPlus />
                                </button>
                            )}
                        </div>

                        {canEdit && (
                          <div
                            className="relative flex items-center"
                            ref={(el) => (columnMenuRefs.current[column.id] = el)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setOpenColumnMenuId((prev) => prev === column.id ? null : column.id)}
                              className="p-2 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                              <HiDotsVertical />
                            </button>

                            {openColumnMenuId === column.id && (
                              <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                                <button
                                  onClick={() => {
                                    setEditingColumn(column);
                                    setOpenColumnMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
                                >
                                  칼럼 수정
                                </button>
                                <button
                                  onClick={() => handleDeleteColumn(column.id)}
                                  disabled={isDeletingColumnId === column.id}
                                  className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                                >
                                  {isDeletingColumnId === column.id ? '삭제 중...' : '칼럼 삭제'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Cards List */}
                    {!isCollapsed && (
                      <div
                          ref={(el) => (columnContentRefs.current[column.id] = el)}
                          className={`relative bg-white border border-slate-200 rounded-b-lg shadow-sm mb-4 min-h-[40px] ${
                            isDragOver ? 'bg-slate-50 border-pastel-blue-300 ring-2 ring-pastel-blue-100' : ''
                          }`}
                          onDragOver={(e) => handleDragOver(e, column.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, column.id)}
                      >
                      {canEdit && isDragOver && (
                        <div className="pointer-events-none absolute inset-0 rounded-b-lg bg-pastel-blue-50/80 border-2 border-dashed border-pastel-blue-400 text-pastel-blue-700 font-semibold flex items-center justify-center z-10">
                          여기에 드롭하여 카드 이동
                        </div>
                      )}
                      {loadingColumns[column.id] ? (
                          <div className="flex justify-center items-center py-8">
                              <div className="animate-spin h-6 w-6 border-2 border-pastel-blue-500 border-t-transparent rounded-full"></div>
                          </div>
                      ) : columnCards.length > 0 ? (
                          columnCards
                              .sort((a, b) => a.position - b.position)
                              .map((card) => (
                                  <ListCardRow
                                      key={card.id}
                                      card={card}
                                      workspaceId={workspaceId}
                                      boardId={boardId}
                                      boardOwnerId={boardOwnerId}
                                      columnId={column.id}
                                      canEdit={canEdit}
                                      onEditCard={(card) => setEditingCard({ card, columnId: column.id })}
                                      onDropComplete={() => setDragOverColumnId(null)}
                                  />
                              ))
                      ) : (
                          <div className="text-center py-4 text-slate-400 text-sm italic border-t border-slate-200">
                              카드가 없습니다
                          </div>
                      )}

                      {canEdit && !loadingColumns[column.id] && (
                          <button
                              onClick={() => setCreateCardState({ isOpen: true, columnId: column.id })}
                              className="w-full px-4 py-1 border-2 border-dashed border-slate-300 hover:border-slate-800 text-slate-400 hover:text-slate-800 transition-colors flex items-center justify-center gap-2 text-sm group"
                          >
                              <HiPlus className="w-4 h-4" />
                              <span>카드 추가</span>
                          </button>
                      )}
                      </div>
                    )}
                </React.Fragment>
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
