import { CardItem } from '@/components/CardItem';
import { CreateCardModal } from '@/components/CreateCardModal';
import { CreateColumnModal } from '@/components/CreateColumnModal';
import { ErrorNotification } from '@/components/ErrorNotification';
import { useCard } from '@/context/CardContext';
import { useColumn } from '@/context/ColumnContext';
import { useDialog } from '@/context/DialogContext';
import { useColumnScrollPersistence } from '@/hooks/useColumnScrollPersistence';
import type { Card } from '@/types/card';
import { Column } from '@/types/column';
import type { CardSearchState } from '@/types/search';
import { filterCardsBySearch, hasActiveSearchFilter } from '@/utils/searchFilters';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HiArchive, HiPencilAlt, HiTrash } from 'react-icons/hi';
import { useTranslation } from 'react-i18next';

interface ColumnCardProps {
  column: Column;
  workspaceId: number;
  boardId: number;
  boardOwnerId: number;
  canEdit: boolean;
  autoOpenCardId?: number | null;
  onAutoOpenHandled?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  searchState: CardSearchState;
  currentUserId?: number;
  onZIndexChange?: (zIndex: number) => void;
}

const ColumnCardComponent: React.FC<ColumnCardProps> = ({
  column,
  workspaceId,
  boardId,
  boardOwnerId,
  canEdit,
  autoOpenCardId,
  onAutoOpenHandled,
  dragHandleProps,
  searchState,
  currentUserId,
  onZIndexChange,
}) => {
  const { t } = useTranslation(['card', 'common']);
  const { deleteColumn } = useColumn();
  const { cards, loadCards, updateCard, archiveCardsInColumn } = useCard();
  const { confirm } = useDialog();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [modalKey, setModalKey] = useState(0); // Key to force modal remount
  const [showEditColumnModal, setShowEditColumnModal] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [dragOverEmpty, setDragOverEmpty] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardListRef = useRef<HTMLDivElement>(null);

  const [recentlyCreatedCardId, setRecentlyCreatedCardId] = useState<number | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const columnCards = cards[column.id] || [];

  // Track present card IDs to distinguish between entering (target) and exiting (source) cards
  const cardIdsRef = useRef(new Set<number>());
  useEffect(() => {
    cardIdsRef.current = new Set(columnCards.map(c => c.id));
  }, [columnCards]);

  // Track active animations: cardId -> 'source' | 'target'
  const activeAnimations = useRef(new Map<number, 'source' | 'target'>());
  const [animatingCards, setAnimatingCards] = useState<Set<number>>(new Set());

  const updateZIndex = useCallback(() => {
    if (!onZIndexChange) return;

    let hasTarget = false;
    let hasSource = false;

    for (const type of activeAnimations.current.values()) {
      if (type === 'target') hasTarget = true;
      if (type === 'source') hasSource = true;
    }

    if (hasTarget) {
      onZIndexChange(100); // Target column (entering) gets highest priority
    } else if (hasSource) {
      onZIndexChange(50); // Source column (exiting) gets medium priority
    } else {
      onZIndexChange(0); // Idle
    }
  }, [onZIndexChange]);

  const handleAnimationStart = useCallback((cardId: number) => {
    const isTarget = cardIdsRef.current.has(cardId);
    activeAnimations.current.set(cardId, isTarget ? 'target' : 'source');
    setAnimatingCards(prev => new Set(prev).add(cardId));
    updateZIndex();
  }, [updateZIndex]);

  const handleAnimationEnd = useCallback((cardId: number) => {
    activeAnimations.current.delete(cardId);
    setAnimatingCards(prev => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
    updateZIndex();
  }, [updateZIndex]);

  useColumnScrollPersistence({
    boardId,
    columnId: column.id,
    enabled: !cardsLoading,
    containerRef: cardListRef as React.RefObject<HTMLElement>,
  });

  useEffect(() => {
    const loadColumnCards = async () => {
      setCardsLoading(true);
      try {
        await loadCards(workspaceId, boardId, column.id);
      } catch (err) {
        console.error('Failed to load cards:', err);
      } finally {
        setCardsLoading(false);
      }
    };

    loadColumnCards();
  }, [column.id, workspaceId, boardId, loadCards]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!recentlyCreatedCardId) return;
    const container = cardListRef.current;
    if (!container) return;
    const cardElement = container.querySelector<HTMLElement>(`[data-card-id="${recentlyCreatedCardId}"]`);
    cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [cards, column.id, recentlyCreatedCardId]);

  const handleCardCreated = (card: Card) => {
    setRecentlyCreatedCardId(card.id);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setRecentlyCreatedCardId(null);
    }, 3000);
    void loadCards(workspaceId, boardId, column.id);
  };

  const handleDelete = async () => {
    const confirmed = await confirm(t('card:column.deleteConfirm', { defaultValue: '정말 이 칼럼을 삭제하시겠습니까?' }), {
      confirmText: t('common:button.delete'),
      cancelText: t('common:button.cancel'),
      isDestructive: true,
    });

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await deleteColumn(workspaceId, boardId, column.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('card:column.deleteFailed', { defaultValue: '칼럼 삭제에 실패했습니다' });
      setErrorMessage(message);
      console.error('Failed to delete column:', err);
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleArchiveAll = async () => {
    const columnCards = cards[column.id] || [];
    if (columnCards.length === 0) {
      setShowMenu(false);
      return;
    }

    const confirmed = await confirm(t('card:column.confirmArchiveAll', { count: columnCards.length, defaultValue: `이 칼럼의 ${columnCards.length}개 카드를 모두 아카이브하시겠습니까?` }), {
      confirmText: t('card:editModal.archive', { defaultValue: '아카이브' }),
      cancelText: t('common:button.cancel'),
      isDestructive: true,
    });

    if (!confirmed) return;

    try {
      setIsArchiving(true);
      setErrorMessage(null);
      await archiveCardsInColumn(workspaceId, boardId, column.id);
      await loadCards(workspaceId, boardId, column.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('card:column.archiveAllFailed', { defaultValue: '칼럼의 카드들을 아카이브하는데 실패했습니다' });
      setErrorMessage(message);
      console.error('Failed to archive cards in column:', err);
    } finally {
      setIsArchiving(false);
      setShowMenu(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleCardAreaDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return; // Viewers cannot drop cards
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverEmpty(true);
  };

  const handleCardAreaDragLeave = () => {
    if (!canEdit) return;
    setDragOverEmpty(false);
  };

  const handleCardAreaDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) {
      setDragOverEmpty(false);
      return; // Viewers cannot drop cards
    }
    e.preventDefault();
    e.stopPropagation();
    setDragOverEmpty(false);

    const draggedCardId = parseInt(e.dataTransfer.getData('cardId'), 10);
    const sourceColumnId = parseInt(e.dataTransfer.getData('sourceColumnId'), 10);

    // 같은 컬럼에 드롭된 경우 무시 (CardItem이 처리함)
    if (sourceColumnId === column.id) {
      return;
    }

    // 다른 컬럼으로 드롭된 경우: 새 컬럼의 끝에 추가
    const columnCards = cards[column.id] || [];
    const newPosition = columnCards.length;

    try {
      await updateCard(workspaceId, boardId, sourceColumnId, draggedCardId, {
        columnId: column.id,
        position: newPosition,
      });
      // 소스와 타겟 컬럼 모두 새로고침
      await Promise.all([
        loadCards(workspaceId, boardId, sourceColumnId),
        loadCards(workspaceId, boardId, column.id)
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('card:column.moveFailed', { defaultValue: '카드 이동에 실패했습니다' });
      setErrorMessage(message);
      console.error('Failed to move card:', err);
    }
  };

  const bgColorClass = column.bgColor || 'bg-gradient-to-br from-pastel-blue-100 to-pastel-cyan-100';
  const isHexColor = bgColorClass.startsWith('#');

  // hex 색상을 rgba로 변환하여 투명도 적용
  const hexToRgba = (hex: string, alpha: number = 0.5) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const bgStyle = isHexColor ? { backgroundColor: hexToRgba(bgColorClass, 0.33) } : {};
  const bgClassName = isHexColor ? '' : bgColorClass;
  const sortCardsForColumn = (a: Card, b: Card) => {
    const parseDate = (value?: string) => {
      if (!value) return 0;
      const timestamp = Date.parse(value);
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };
    const createdDiff = parseDate(a.createdAt) - parseDate(b.createdAt);
    if (createdDiff !== 0) {
      return createdDiff;
    }
    return a.id - b.id;
  };

  const filteredCards = filterCardsBySearch(columnCards, searchState, currentUserId);
  const isFilterActive = hasActiveSearchFilter(searchState);
  const sortedVisibleCards = [...filteredCards].sort(sortCardsForColumn);

  return (
    <>
      <div
        className={`${bgClassName} rounded-xl shadow-md w-80 flex-shrink-0 flex flex-col h-full transition ${dragOverEmpty ? 'border-4 border-dashed border-black' : 'border border-white/30'}`}
        style={bgStyle}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-2 p-3 border-b border-white/20">
          {/* 드래그 핸들 아이콘 */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="flex-shrink-0 cursor-grab active:cursor-grabbing text-pastel-blue-400 hover:text-pastel-blue-600 transition px-1"
              title="드래그하여 칼럼 순서 변경"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="6" cy="3" r="1.5" />
                <circle cx="10" cy="3" r="1.5" />
                <circle cx="6" cy="8" r="1.5" />
                <circle cx="10" cy="8" r="1.5" />
                <circle cx="6" cy="13" r="1.5" />
                <circle cx="10" cy="13" r="1.5" />
              </svg>
            </div>
          )}

          {/* 제목 영역 (드래그 가능) */}
          <div
            className={`flex-1 min-w-0 ${dragHandleProps ? 'cursor-grab active:cursor-grabbing' : ''}`}
            {...dragHandleProps}
          >
            <h3 className="font-semibold text-sm text-slate-700">{column.name}</h3>
            {column.description && (
              <p className="text-[10px] text-slate-600 mt-0.5">{column.description}</p>
            )}
          </div>

          {/* 액션 버튼들 (드래그 불가) */}
          {canEdit && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {/* 카드 추가 버튼 */}
              <button
                onClick={() => {
                  setModalKey(prev => prev + 1);
                  setShowCreateCardModal(true);
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition text-pastel-blue-900 font-bold text-lg"
                title={t('card:column.addCard')}
              >
                +
              </button>

              {/* 메뉴 버튼 */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="menu-button p-1.5 hover:bg-white/20 rounded-lg transition text-pastel-blue-900 font-bold text-lg"
                  disabled={isDeleting || isArchiving}
                >
                  ⋮
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-40 glass-light rounded-lg shadow-lg z-50 border border-white/30 py-1">
                    <button
                      onClick={() => {
                        setShowEditColumnModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-white/30 transition flex items-center gap-2"
                    >
                      <HiPencilAlt className="w-4 h-4" />
                      <span>{t('common:button.edit')}</span>
                    </button>
                    <button
                      onClick={handleArchiveAll}
                      disabled={isArchiving || cardsLoading}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-white/30 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <HiArchive className="w-4 h-4" />
                      <span>{isArchiving ? t('card:column.archiving') : t('card:column.archiveAll')}</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full text-left px-3 py-1.5 text-xs text-pastel-pink-600 hover:bg-white/30 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <HiTrash className="w-4 h-4" />
                      <span>{isDeleting ? t('common:action.deleting') : t('common:button.delete')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 카드 영역 */}
        <div
          className={`flex-1 p-3 overflow-y-auto min-h-96 ${dragOverEmpty ? 'bg-white/30' : ''} transition flex flex-col gap-2 w-full`}
          onDragOver={handleCardAreaDragOver}
          onDragLeave={handleCardAreaDragLeave}
          onDrop={handleCardAreaDrop}
          ref={cardListRef}
        >
          {cardsLoading ? (
            <div className="text-center text-pastel-blue-400 text-sm">
              <div className="animate-spin inline-block h-4 w-4 border-2 border-pastel-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {sortedVisibleCards.length > 0 ? (
                <div className="space-y-1.5 w-full">
                  {sortedVisibleCards.map((card) => (
                    <motion.div
                      key={card.id}
                      layout
                      layoutId={`card-${card.id}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 25
                      }}
                      className="w-full"
                      style={{ zIndex: animatingCards.has(card.id) ? 9999 : 1 }}
                      onLayoutAnimationStart={() => handleAnimationStart(card.id)}
                      onLayoutAnimationComplete={() => handleAnimationEnd(card.id)}
                    >
                      <CardItem
                        card={card}
                        workspaceId={workspaceId}
                        boardId={boardId}
                        boardOwnerId={boardOwnerId}
                        columnId={column.id}
                        canEdit={canEdit}
                        autoOpen={autoOpenCardId === card.id}
                        onAutoOpenHandled={onAutoOpenHandled}
                        animateOnMount={false}
                        isRecentlyCreated={card.id === recentlyCreatedCardId}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="w-full rounded-xl border border-white/40 bg-white/40 text-center text-xs text-slate-500 py-6">
                  {isFilterActive ? t('card:column.emptyWithFilter') : t('card:column.empty')}
                </div>
              )}

              {canEdit && (
                <button
                  onClick={() => {
                    setModalKey(prev => prev + 1); // Generate new key for fresh modal instance
                    setShowCreateCardModal(true);
                  }}
                  className="w-full rounded-2xl border-4 border-dashed border-white/70 bg-white/10 text-slate-700 font-semibold text-sm min-h-24 flex items-center justify-center hover:bg-white/20 hover:border-black transition"
                >
                  + {t('card:column.addCard')}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Card Modal */}
      {showCreateCardModal && (
        <CreateCardModal
          key={modalKey} // Force remount on each open
          workspaceId={workspaceId}
          boardId={boardId}
          columnId={column.id}
          onClose={() => {
            setShowCreateCardModal(false);
          }}
          onSuccess={handleCardCreated}
        />
      )}

      {/* Edit Column Modal */}
      {showEditColumnModal && (
        <CreateColumnModal
          workspaceId={workspaceId}
          boardId={boardId}
          editColumn={column}
          onClose={() => {
            setShowEditColumnModal(false);
          }}
        />
      )}

      {/* 에러 알림 */}
      {errorMessage && (
        <ErrorNotification
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
          duration={5000}
        />
      )}
    </>
  );
};

// Memoize to prevent unnecessary re-renders when WebSocket events update columns
export const ColumnCard = React.memo(ColumnCardComponent);
