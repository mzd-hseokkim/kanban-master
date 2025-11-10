import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/types/card';
import { useCard } from '@/context/CardContext';
import { ErrorNotification } from '@/components/ErrorNotification';
import { EditCardModal } from '@/components/EditCardModal';

interface CardItemProps {
  card: Card;
  workspaceId: number;
  boardId: number;
  columnId: number;
  autoOpen?: boolean;
  onAutoOpenHandled?: () => void;
  animateOnMount?: boolean;
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  workspaceId,
  boardId,
  columnId,
  autoOpen = false,
  onAutoOpenHandled,
  animateOnMount = false,
}) => {
  const { deleteCard, updateCard, loadCards } = useCard();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDelete = async () => {
    if (!window.confirm('정말 이 카드를 삭제하시겠습니까?')) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      await deleteCard(workspaceId, boardId, columnId, card.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : '카드 삭제에 실패했습니다';
      setErrorMessage(message);
      console.error('Failed to delete card:', err);
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleToggleCompletion = async () => {
    try {
      setErrorMessage(null);
      await updateCard(workspaceId, boardId, columnId, card.id, {
        isCompleted: !card.isCompleted,
      });
      await loadCards(workspaceId, boardId, columnId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '카드 상태 변경에 실패했습니다';
      setErrorMessage(message);
      console.error('Failed to toggle card completion:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cardId', String(card.id));
    e.dataTransfer.setData('sourceColumnId', String(columnId));
    e.dataTransfer.setData('sourcePosition', String(card.position));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (autoOpen && !hasAutoOpened) {
      setShowEditModal(true);
      setHasAutoOpened(true);
      onAutoOpenHandled?.();
    }
  }, [autoOpen, hasAutoOpened, onAutoOpenHandled]);

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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedCardId = parseInt(e.dataTransfer.getData('cardId'), 10);
    const sourceColumnId = parseInt(e.dataTransfer.getData('sourceColumnId'), 10);

    // 같은 카드에 드롭된 경우 무시
    if (draggedCardId === card.id) {
      return;
    }

    // 같은 컬럼 내에서의 이동
    if (sourceColumnId === columnId) {
      try {
        // 드래그된 카드를 현재 카드 위치에 드롭
        // 현재 카드의 position을 드래그된 카드의 새 위치로 설정
        await updateCard(workspaceId, boardId, columnId, draggedCardId, {
          position: card.position,
        });
        // 카드 목록 새로고침하여 서버 상태 반영
        await loadCards(workspaceId, boardId, columnId);
      } catch (err) {
        const message = err instanceof Error ? err.message : '카드 위치 변경에 실패했습니다';
        setErrorMessage(message);
        console.error('Failed to update card position:', err);
      }
    }
  };

  const priorityColors: { [key: string]: string } = {
    HIGH: 'bg-pastel-pink-100 text-pastel-pink-700',
    MEDIUM: 'bg-pastel-yellow-100 text-pastel-yellow-700',
    LOW: 'bg-pastel-green-100 text-pastel-green-700',
  };

  const getPriorityClass = (priority?: string) => {
    if (!priority) return '';
    return priorityColors[priority] || '';
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    try {
      const date = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueDateTime = new Date(dueDate);
      dueDateTime.setHours(0, 0, 0, 0);

      const isOverdue = dueDateTime < today;
      const daysUntilDue = Math.floor((dueDateTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${month}/${day}`;

      return { dateStr, isOverdue, daysUntilDue };
    } catch {
      return null;
    }
  };

  const dueDateInfo = formatDueDate(card.dueDate);
  const isDueSoon = dueDateInfo && dueDateInfo.daysUntilDue <= 3 && dueDateInfo.daysUntilDue >= 0;
  const isOverdue = dueDateInfo && dueDateInfo.isOverdue;

  const handleCardClick = (e: React.MouseEvent) => {
    // 메뉴 버튼이나 체크박스 클릭 시에는 모달을 열지 않음
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="checkbox"]')) {
      return;
    }
    setShowEditModal(true);
  };

  return (
    <div className="relative">
      <div
        className={`bg-white rounded-lg shadow-sm border border-pastel-blue-200 p-3 hover:shadow-md transition cursor-pointer ${
          isDragging ? 'opacity-50' : ''
        } ${animateOnMount ? 'card-enter' : ''}`}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleCardClick}
      >
        {/* Title and Menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1">
            {card.bgColor && (
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: card.bgColor }}
                title="Card color"
              />
            )}
            <div
              role="checkbox"
              className={`flex-shrink-0 w-6 h-6 rounded border-2 transition flex items-center justify-center cursor-pointer ${
              card.isCompleted
                ? 'bg-pastel-green-500 border-pastel-green-500'
                : 'border-pastel-blue-300 hover:border-pastel-green-500 bg-white'
            }`}
              onClick={handleToggleCompletion}
              title={card.isCompleted ? '미완료로 표시' : '완료로 표시'}
            >
              {card.isCompleted && <svg className="w-4 h-4 text-pastel-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
            </div>
            <h4 className={`font-semibold text-sm flex-1 break-words transition ${
              card.isCompleted
                ? 'text-pastel-blue-400 line-through'
                : 'text-pastel-blue-900'
            }`}>{card.title}</h4>
          </div>
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-pastel-blue-100 rounded transition text-xs"
              disabled={isDeleting}
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg z-50 border border-pastel-blue-200 py-1">
                <button
                  onClick={() => {
                    setShowEditModal(true);
                    setShowMenu(false);
                  }}
                  disabled={isDeleting}
                  className="w-full text-left px-3 py-2 text-xs text-pastel-blue-600 hover:bg-pastel-blue-50 transition disabled:opacity-50"
                >
                  ✏️ 수정
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full text-left px-3 py-2 text-xs text-pastel-pink-600 hover:bg-pastel-pink-50 transition disabled:opacity-50"
                >
                  {isDeleting ? '삭제 중...' : '🗑️ 삭제'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-xs text-pastel-blue-600 mb-2 line-clamp-2">{card.description}</p>
        )}

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-2">
            {card.labels.slice(0, 3).map((label) => {
              const colorToken = label.colorToken || 'pastel-blue-500';
              const colorMap: { [key: string]: string } = {
                'pastel-blue-500': '#8fb3ff',
                'pastel-pink-500': '#ffb3e6',
                'pastel-green-500': '#b3ffc4',
                'pastel-purple-500': '#d4a5ff',
                'pastel-yellow-500': '#fff4b3',
                'pastel-orange-500': '#ffd4b3',
                'pastel-red-500': '#ffb3b3',
                'pastel-teal-500': '#b3ffe6',
              };
              const bgColor = colorMap[colorToken] || '#8fb3ff';
              return (
                <span
                  key={label.id}
                  className="text-xs px-2 py-1 rounded font-medium border border-white/50"
                  style={{ backgroundColor: bgColor }}
                  title={label.description || label.name}
                >
                  {label.name}
                </span>
              );
            })}
            {card.labels.length > 3 && (
              <span className="text-xs text-pastel-blue-600 font-medium">
                +{card.labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {card.priority && (
            <span className={`text-xs px-2 py-1 rounded font-medium ${getPriorityClass(card.priority)}`}>
              {card.priority}
            </span>
          )}
          {card.assignee && (
            <span className="text-xs bg-pastel-blue-100 text-pastel-blue-700 px-2 py-1 rounded">
              👤 {card.assignee}
            </span>
          )}
        </div>

        {/* Due Date - 완료된 카드는 평범한 스타일로만 표시 */}
        {dueDateInfo && (
          <div className={`text-xs px-2 py-1 rounded ${
            card.isCompleted
              ? 'bg-pastel-blue-100 text-pastel-blue-700'
              : isOverdue
              ? 'bg-pastel-pink-100 text-pastel-pink-700 font-semibold'
              : isDueSoon
              ? 'bg-pastel-yellow-100 text-pastel-yellow-700 font-semibold'
              : 'bg-pastel-blue-100 text-pastel-blue-700'
          }`}>
            📅 {dueDateInfo.dateStr}
            {!card.isCompleted && isOverdue && ' (지남)'}
            {!card.isCompleted && isDueSoon && !isOverdue && ` (${dueDateInfo.daysUntilDue}일)`}
          </div>
        )}
      </div>

      {/* Edit Card Modal */}
      {showEditModal && (
        <EditCardModal
          card={card}
          workspaceId={workspaceId}
          boardId={boardId}
          columnId={columnId}
          onClose={() => {
            setShowEditModal(false);
            onAutoOpenHandled?.();
          }}
        />
      )}

      {errorMessage && (
        <ErrorNotification
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
          duration={5000}
        />
      )}
    </div>
  );
};
