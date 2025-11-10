import React, { useState, useEffect, useRef } from 'react';
import { Column } from '@/types/column';
import { useColumn } from '@/context/ColumnContext';
import { useCard } from '@/context/CardContext';
import { ErrorNotification } from '@/components/ErrorNotification';
import { CardItem } from '@/components/CardItem';
import { CreateCardModal } from '@/components/CreateCardModal';

interface ColumnCardProps {
  column: Column;
  workspaceId: number;
  boardId: number;
  canEdit: boolean;
  autoOpenCardId?: number | null;
  onAutoOpenHandled?: () => void;
}

export const ColumnCard: React.FC<ColumnCardProps> = ({ column, workspaceId, boardId, canEdit, autoOpenCardId, onAutoOpenHandled }) => {
  const { deleteColumn } = useColumn();
  const { cards, loadCards, updateCard } = useCard();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [dragOverEmpty, setDragOverEmpty] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [animatedCardIds, setAnimatedCardIds] = useState<Set<number>>(new Set());

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
    const columnCards = cards[column.id] || [];
    if (columnCards.length === 0) {
      return;
    }

    setAnimatedCardIds((prev) => {
      let hasChanges = false;
      const next = new Set(prev);
      columnCards.forEach((card) => {
        if (!next.has(card.id)) {
          next.add(card.id);
          hasChanges = true;
        }
      });

      return hasChanges ? next : prev;
    });
  }, [cards, column.id]);

  const handleDelete = async () => {
    if (!window.confirm('정말 이 칼럼을 삭제하시겠습니까?')) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await deleteColumn(workspaceId, boardId, column.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : '칼럼 삭제에 실패했습니다';
      setErrorMessage(message);
      console.error('Failed to delete column:', err);
    } finally {
      setIsDeleting(false);
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
    if (!canEdit) return; // Viewers cannot drop cards
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
      const message = err instanceof Error ? err.message : '카드 이동에 실패했습니다';
      setErrorMessage(message);
      console.error('Failed to move card:', err);
    }
  };

  const bgColorClass = column.bgColor || 'bg-gradient-to-br from-pastel-blue-100 to-pastel-cyan-100';

  return (
    <>
      <div className={`${bgColorClass} rounded-xl shadow-md border border-white/30 min-w-80 flex flex-col h-full`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex-1">
            <h3 className="font-bold text-pastel-blue-900">{column.name}</h3>
            {column.description && (
              <p className="text-xs text-pastel-blue-600 mt-1">{column.description}</p>
            )}
          </div>
          {canEdit && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="menu-button p-2 hover:bg-white/20 rounded-lg transition"
                disabled={isDeleting}
              >
                ⋮
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 glass-light rounded-lg shadow-lg z-50 border border-white/30 py-1">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full text-left px-4 py-2 text-sm text-pastel-pink-600 hover:bg-white/30 transition disabled:opacity-50"
                  >
                    {isDeleting ? '삭제 중...' : '🗑️ 삭제'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 카드 영역 */}
        <div
          className={`flex-1 p-4 overflow-y-auto min-h-96 ${dragOverEmpty ? 'bg-white/30' : ''} transition flex flex-col gap-3`}
          onDragOver={handleCardAreaDragOver}
          onDragLeave={handleCardAreaDragLeave}
          onDrop={handleCardAreaDrop}
        >
          {cardsLoading ? (
            <div className="text-center text-pastel-blue-400 text-sm">
              <div className="animate-spin inline-block h-4 w-4 border-2 border-pastel-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {cards[column.id] && cards[column.id].length > 0 && (
                <div className="space-y-2">
                  {cards[column.id]
                    .sort((a, b) => a.position - b.position)
                    .map((card) => (
                      <CardItem
                        key={card.id}
                        card={card}
                        workspaceId={workspaceId}
                        boardId={boardId}
                        columnId={column.id}
                        canEdit={canEdit}
                        autoOpen={autoOpenCardId === card.id}
                        onAutoOpenHandled={onAutoOpenHandled}
                        animateOnMount={!animatedCardIds.has(card.id)}
                      />
                    ))}
                </div>
              )}

              {canEdit && (
                <button
                  onClick={() => setShowCreateCardModal(true)}
                  className="w-full rounded-2xl border-4 border-dashed border-white/70 bg-white/10 text-pastel-blue-800 font-semibold text-base min-h-28 flex items-center justify-center hover:bg-white/20 hover:border-black transition"
                >
                  + 카드 추가
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Card Modal */}
      {showCreateCardModal && (
        <CreateCardModal
          workspaceId={workspaceId}
          boardId={boardId}
          columnId={column.id}
          onClose={() => {
            setShowCreateCardModal(false);
            // 카드 목록 새로고침
            loadCards(workspaceId, boardId, column.id);
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
