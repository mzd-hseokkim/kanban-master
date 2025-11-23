import { Avatar } from '@/components/common/Avatar';
import { ErrorNotification } from '@/components/ErrorNotification';
import { useCard } from '@/context/CardContext';
import { useDialog } from '@/context/DialogContext';
import cardService from '@/services/cardService';
import { Card } from '@/types/card';
import React, { useMemo, useState } from 'react';
import { HiCheckCircle } from 'react-icons/hi2';

interface ListCardRowProps {
  card: Card;
  workspaceId: number;
  boardId: number;
  boardOwnerId: number;
  columnId: number;
  canEdit: boolean;
  onEditCard: (card: Card) => void;
  onDropComplete?: () => void;
}

export const ListCardRow = ({
  card,
  workspaceId,
  boardId,
  columnId,
  canEdit,
  onEditCard,
  onDropComplete,
}: ListCardRowProps) => {
  const { deleteCard, updateCard, loadCards } = useCard();
  const { confirm } = useDialog();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm('정말 이 카드를 삭제하시겠습니까?', {
      confirmText: '삭제',
      cancelText: '취소',
      isDestructive: true,
    });

    if (!confirmed) return;

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
    }
  };

  const handleToggleCompletion = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    if (!canEdit) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cardId', String(card.id));
    e.dataTransfer.setData('sourceColumnId', String(columnId));
    e.dataTransfer.setData('sourcePosition', String(card.position));
  };

  const handleDragEnd = () => {
    if (!canEdit) return;
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    const draggedCardId = parseInt(e.dataTransfer.getData('cardId'), 10);
    const sourceColumnId = parseInt(e.dataTransfer.getData('sourceColumnId'), 10);

    if (draggedCardId === card.id) return;

    if (sourceColumnId === columnId) {
      e.preventDefault();
      e.stopPropagation();
      try {
        await updateCard(workspaceId, boardId, columnId, draggedCardId, {
          position: card.position,
        });
        await loadCards(workspaceId, boardId, columnId);
      } catch (err) {
          const message = err instanceof Error ? err.message : '카드 위치 변경에 실패했습니다';
          setErrorMessage(message);
          console.error('Failed to update card position:', err);
        }
    }
    onDropComplete?.();
  };

  const handleCardClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="checkbox"]')) {
      return;
    }

    try {
      setIsLoadingRelations(true);
      setErrorMessage(null);
      const fullCard = await cardService.getCard(
        workspaceId,
        boardId,
        columnId,
        card.id,
        true
      );

      onEditCard(fullCard);
    } catch (err) {
      const message = err instanceof Error ? err.message : '카드 정보를 불러오는데 실패했습니다';
      setErrorMessage(message);
      console.error('Failed to load card with relations:', err);
    } finally {
      setIsLoadingRelations(false);
    }
  };

  const priorityColors: { [key: string]: string } = {
    HIGH: 'bg-pastel-pink-100 text-pastel-pink-800 border-pastel-pink-200',
    MEDIUM: 'bg-pastel-yellow-100 text-pastel-yellow-800 border-pastel-yellow-200',
    LOW: 'bg-pastel-green-100 text-pastel-green-800 border-pastel-green-200',
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
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return { dateStr: `${month}/${day}`, isOverdue };
    } catch {
      return null;
    }
  };

  const dueDateInfo = formatDueDate(card.dueDate);
  const isOverdue = dueDateInfo && dueDateInfo.isOverdue;

  const completedLabel = useMemo(() => {
    if (!card.completedAt) return null;
    return new Date(card.completedAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  }, [card.completedAt]);

  const startedLabel = useMemo(() => {
    if (!card.startedAt) return null;
    return new Date(card.startedAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  }, [card.startedAt]);

  const descriptionPreview = useMemo(() => {
    if (!card.description) return '';
    const plainText = card.description.replace(/<[^>]+>/g, ' ').trim();
    return plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText;
  }, [card.description]);

  return (
    <>
      <div
        className={`group grid grid-cols-[40px_minmax(300px,3fr)_100px_120px_minmax(200px,2fr)_100px_100px_100px_150px_40px] gap-4 items-center px-4 py-1 bg-white border-b border-slate-300 hover:bg-slate-50 transition-colors text-sm last:border-b-0 ${
          isDragging ? 'opacity-50' : ''
        } ${isLoadingRelations ? 'cursor-wait opacity-70' : canEdit ? 'cursor-pointer' : 'cursor-default'}`}
        draggable={canEdit && !isLoadingRelations}
        onDragStart={canEdit && !isLoadingRelations ? handleDragStart : undefined}
        onDragEnd={canEdit && !isLoadingRelations ? handleDragEnd : undefined}
        onDragOver={canEdit && !isLoadingRelations ? handleDragOver : undefined}
        onDrop={canEdit && !isLoadingRelations ? handleDrop : undefined}
        onClick={!isLoadingRelations ? handleCardClick : undefined}
      >
        {/* Checkbox */}
        <div className="flex justify-center">
          <div
            role="checkbox"
            className={`w-5 h-5 rounded border transition flex items-center justify-center ${
              canEdit ? 'cursor-pointer' : 'cursor-default'
            } ${
              card.isCompleted
                ? 'bg-white border-pastel-green-500'
                : 'border-slate-300 hover:border-pastel-green-500 bg-white'
            }`}
            onClick={canEdit ? handleToggleCompletion : undefined}
          >
            {card.isCompleted && (
              <svg className="w-3.5 h-3.5 text-pastel-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <div className={`truncate font-medium ${card.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
          {card.title}
        </div>

        {/* Priority */}
        <div>
          {card.priority && (
            <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${priorityColors[card.priority]}`}>
              {card.priority}
            </span>
          )}
        </div>

        {/* Labels */}
        <div className="flex items-center gap-1 flex-wrap">
          {card.labels && card.labels.slice(0, 2).map((label) => {
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
            const bgColor = colorMap[label.colorToken || 'pastel-blue-500'] || '#8fb3ff';
            return (
              <span
                key={label.id}
                className="w-3 h-3 rounded-full block"
                style={{ backgroundColor: bgColor }}
                title={label.name}
              />
            );
          })}
          {card.labels && card.labels.length > 2 && (
            <span className="text-[10px] text-slate-400">+{card.labels.length - 2}</span>
          )}
        </div>

        {/* Description */}
        <div className="truncate text-slate-400 text-xs">
          {descriptionPreview}
        </div>

        {/* Due Date */}
        <div className={`text-xs ${isOverdue && !card.isCompleted ? 'text-rose-500 font-medium' : 'text-slate-500'}`}>
          {dueDateInfo?.dateStr || '-'}
        </div>

        {/* Started At */}
        <div className="text-xs text-slate-500">
          {startedLabel || '-'}
        </div>

        {/* Completed At */}
        <div className="text-xs text-slate-500">
          {completedLabel ? (
            <div className="flex items-center gap-1 text-emerald-600">
              <HiCheckCircle className="w-3.5 h-3.5" />
              <span>{completedLabel}</span>
            </div>
          ) : '-'}
        </div>

        {/* Assignee */}
        <div className="flex items-center gap-2">
          {card.assignee && (
            <>
              <Avatar avatarUrl={card.assigneeAvatarUrl} userName={card.assignee} size="xs" />
              <span className="truncate text-xs text-slate-600">{card.assignee}</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          {canEdit && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                isDeleting
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
              }`}
              title="삭제"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

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
