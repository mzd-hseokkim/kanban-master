import { Avatar } from '@/components/common/Avatar';
import { EditCardModal } from '@/components/EditCardModal';
import { ErrorNotification } from '@/components/ErrorNotification';
import { useCard } from '@/context/CardContext';
import { useDialog } from '@/context/DialogContext';
import { useSprint } from '@/context/SprintContext';
import cardService from '@/services/cardService';
import { Card } from '@/types/card';
import React, { useEffect, useMemo, useState } from 'react';
import { HiCalendar, HiCheckCircle, HiPlay } from 'react-icons/hi2';

const SprintBadge = ({ sprintId }: { sprintId: number }) => {
  const { sprints } = useSprint();
  const sprint = sprints.find((s) => s.id === sprintId);

  // Format name to "S-{number}" or first 3 chars
  const displayName = useMemo(() => {
    if (!sprint) return '';
    const match = sprint.name.match(/(\d+)/);
    return match ? `S-${match[0]}` : sprint.name.substring(0, 3).toUpperCase();
  }, [sprint]);

  if (!sprint) return null;

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center px-1.5 h-5 rounded text-[10px] font-bold border-none ${
        sprint.status === 'ACTIVE'
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
          : 'bg-slate-600 text-white'
      }`}
      title={sprint.name}
    >
      {displayName}
    </div>
  );
};

interface CardItemProps {
  card: Card;
  workspaceId: number;
  boardId: number;
  boardOwnerId: number;
  columnId: number;
  canEdit: boolean;
  autoOpen?: boolean;
  onAutoOpenHandled?: () => void;
  animateOnMount?: boolean;
  isRecentlyCreated?: boolean;
}

const CardItemComponent: React.FC<CardItemProps> = ({
  card,
  workspaceId,
  boardId,
  boardOwnerId,
  columnId,
  canEdit,
  autoOpen = false,
  onAutoOpenHandled,
  animateOnMount = false,
  isRecentlyCreated = false,
}) => {
  const { deleteCard, updateCard, loadCards } = useCard();
  const { confirm } = useDialog();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [cardWithRelations, setCardWithRelations] = useState<Card | null>(null);
  const [isLoadingRelations, setIsLoadingRelations] = useState(false);

  const handleDelete = async () => {
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

  useEffect(() => {
    const loadCardForAutoOpen = async () => {
      if (autoOpen && !hasAutoOpened) {
        try {
          setIsLoadingRelations(true);
          const fullCard = await cardService.getCard(
            workspaceId,
            boardId,
            columnId,
            card.id,
            true // includeRelations
          );
          setCardWithRelations(fullCard);
          setShowEditModal(true);
          setHasAutoOpened(true);
          onAutoOpenHandled?.();
        } catch (err) {
          console.error('Failed to load card for auto-open:', err);
          const message = err instanceof Error ? err.message : '카드 정보를 불러오는데 실패했습니다';
          setErrorMessage(message);
        } finally {
          setIsLoadingRelations(false);
        }
      }
    };

    loadCardForAutoOpen();
  }, [autoOpen, hasAutoOpened, onAutoOpenHandled, workspaceId, boardId, columnId, card.id]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    const draggedCardId = parseInt(e.dataTransfer.getData('cardId'), 10);
    const sourceColumnId = parseInt(e.dataTransfer.getData('sourceColumnId'), 10);

    // 같은 카드에 드롭된 경우 무시
    if (draggedCardId === card.id) {
      return;
    }

    // 같은 컬럼 내에서의 이동
    if (sourceColumnId === columnId) {
      e.preventDefault();
      e.stopPropagation();
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
    HIGH: 'bg-pastel-pink-200 text-pastel-pink-800 border border-pastel-pink-300',
    MEDIUM: 'bg-pastel-yellow-200 text-pastel-yellow-800 border border-pastel-yellow-300',
    LOW: 'bg-pastel-green-200 text-pastel-green-800 border border-pastel-green-300',
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

    // 1. 멘션 태그를 텍스트로 변환 (@이름)
    // <span class="mention" data-user-id="...">@이름</span> -> @이름
    const withMentions = card.description.replace(
      /<span[^>]*class="mention"[^>]*>@([^<]+)<\/span>/gi,
      '@$1'
    );

    const withListBullets = withMentions
      .replace(/<\/li>\s*/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ');

    const withLineBreaks = withListBullets
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|blockquote)>/gi, '\n')
      .replace(/<(p|div|h[1-6]|blockquote)([^>]*)>/gi, '\n');

    const plainText = withLineBreaks
      .replace(/<[^>]+>/g, ' ')
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\f/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');

    // HTML Entity Decode
    const textarea = document.createElement('textarea');
    textarea.innerHTML = plainText;
    return textarea.value;
  }, [card.description]);

  const handleCardClick = async (e: React.MouseEvent) => {
    // 메뉴 버튼이나 체크박스 클릭 시에는 모달을 열지 않음
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="checkbox"]')) {
      return;
    }

    // includeRelations=true로 카드 정보 조회 후 모달 열기
    try {
      setIsLoadingRelations(true);
      setErrorMessage(null);
      const fullCard = await cardService.getCard(
        workspaceId,
        boardId,
        columnId,
        card.id,
        true // includeRelations
      );
      setCardWithRelations(fullCard);
      setShowEditModal(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '카드 정보를 불러오는데 실패했습니다';
      setErrorMessage(message);
      console.error('Failed to load card with relations:', err);
    } finally {
      setIsLoadingRelations(false);
    }
  };

  return (
    <div className="relative w-full group" data-card-id={card.id}>
      <div
        className={`bg-white rounded-lg shadow-sm border border-pastel-blue-200 group-hover:border-pastel-blue-800 p-2.5 group-hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)] group-hover:-translate-y-2 group-hover:scale-[1.02] group-hover:z-10 transition-all duration-200 w-full ${
          isDragging ? 'opacity-50' : ''
        } ${animateOnMount ? 'card-enter' : ''} ${isLoadingRelations ? 'opacity-70 cursor-wait' : !canEdit ? 'cursor-default' : 'cursor-pointer'} ${
          isRecentlyCreated ? 'card-new-glow' : ''
        }`}
        draggable={canEdit && !isLoadingRelations}
        onDragStart={canEdit && !isLoadingRelations ? handleDragStart : undefined}
        onDragEnd={canEdit && !isLoadingRelations ? handleDragEnd : undefined}
        onDragOver={canEdit && !isLoadingRelations ? handleDragOver : undefined}
        onDrop={canEdit && !isLoadingRelations ? handleDrop : undefined}
        onClick={!isLoadingRelations ? handleCardClick : undefined}
      >
        {/* Title and Menu */}
        <div className="flex items-start justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {card.bgColor && (
              <div
                className="w-2.5 h-5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: card.bgColor, border: '1px solid rgba(0, 0, 0, 0.15)' }}
                title="Card color"
              />
            )}
            <div
              role="checkbox"
              className={`flex-shrink-0 w-5 h-5 rounded border-2 transition flex items-center justify-center ${
                canEdit ? 'cursor-pointer' : 'cursor-default'
              } ${
              card.isCompleted
                ? 'bg-white border-pastel-green-500'
                : canEdit
                  ? 'border-pastel-blue-300 hover:border-pastel-green-500 bg-white'
                  : 'border-pastel-blue-300 bg-white'
            }`}
              onClick={canEdit ? handleToggleCompletion : undefined}
              title={canEdit ? (card.isCompleted ? '미완료로 표시' : '완료로 표시') : '읽기 전용'}
            >
              {card.isCompleted && <svg className="w-3.5 h-3.5 text-pastel-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
            </div>
            {card.sprintId && <SprintBadge sprintId={card.sprintId} />}
            <h4 className={`text-base sm:text-[15px] flex-1 min-w-0 leading-tight line-clamp-2 transition ${
              card.isCompleted
                ? 'text-slate-400 line-through font-medium'
                : 'text-slate-700 font-bold'
            }`}>{card.title}</h4>
            {card.priority && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${getPriorityClass(card.priority)}`}>
                {card.priority}
              </span>
            )}
          </div>
          {canEdit && (
            <div className="relative flex-shrink-0">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                title="카드 삭제"
                aria-label="카드 삭제"
                className={`w-6 h-6 inline-flex items-center justify-center rounded-full transition border border-transparent self-start -mt-0.5 ${
                  isDeleting
                    ? 'text-pastel-pink-300 cursor-not-allowed'
                    : 'text-pastel-pink-600 hover:text-pastel-pink-700 hover:bg-pastel-pink-50 border-pastel-pink-100'
                }`}
              >
                {isDeleting ? (
                  <span className="text-xs font-medium">삭제 중...</span>
                ) : (
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4.5a1.5 1.5 0 011.5-1.5h5a1.5 1.5 0 011.5 1.5V6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        {descriptionPreview && (
          <div className="text-[11px] text-slate-600 mb-1.5 line-clamp-2 whitespace-pre-line">
            {descriptionPreview}
          </div>
        )}

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-1.5">
            {[...card.labels].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 3).map((label) => {
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
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold border border-white/30 text-slate-700"
                  style={{ backgroundColor: bgColor }}
                  title={label.description || label.name}
                >
                  {label.name}
                </span>
              );
            })}
            {card.labels.length > 3 && (
              <span className="text-[10px] text-slate-500 font-medium">
                +{card.labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Assignee */}
        {card.assignee && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Avatar
              avatarUrl={card.assigneeAvatarUrl}
              userName={card.assignee}
              size="xs"
            />
            <span className="text-[10px] text-slate-600 font-medium">
              {card.assignee}
            </span>
          </div>
        )}

        {/* 일정/시작/완료 정보 */}
        {(dueDateInfo || startedLabel || completedLabel) && (() => {
          const showAllThree = !!(dueDateInfo && startedLabel && completedLabel);
          const badges: React.ReactNode[] = [];

          if (!showAllThree && dueDateInfo) {
            badges.push(
              <div
                key="due"
                className={`flex flex-1 min-w-0 items-center justify-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  card.isCompleted
                    ? 'border-slate-200 bg-white text-slate-400'
                    : isOverdue
                    ? 'border-pastel-pink-500 bg-pastel-pink-50 text-pastel-pink-700'
                    : isDueSoon
                    ? 'border-pastel-yellow-500 bg-pastel-yellow-50 text-pastel-yellow-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <HiCalendar className="w-3 h-3" />
                <span className="truncate">{dueDateInfo.dateStr}</span>
                {!card.isCompleted && isOverdue && ' (지남)'}
                {!card.isCompleted && isDueSoon && !isOverdue && ` (${dueDateInfo.daysUntilDue}일)`}
              </div>
            );
          }

          if (startedLabel) {
            badges.push(
              <div
                key="started"
                className="flex flex-1 min-w-0 items-center justify-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border border-pastel-blue-200 bg-pastel-blue-50 text-pastel-blue-700"
              >
                <HiPlay className="w-3 h-3" />
                <span className="truncate">시작 {startedLabel}</span>
              </div>
            );
          }

          if (completedLabel) {
            badges.push(
              <div
                key="completed"
                className="flex flex-1 min-w-0 items-center justify-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border border-pastel-green-200 bg-pastel-green-50 text-pastel-green-700"
              >
                <HiCheckCircle className="w-3 h-3" />
                <span className="truncate">완료 {completedLabel}</span>
              </div>
            );
          }

          return (
            <div className="flex items-stretch gap-1.5 mt-1">
              {badges}
            </div>
          );
        })()}

        {/* 자식 카드 개수 배지 (있는 경우에만 표시) */}
        {card.childCount !== undefined && card.childCount > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-pastel-blue-100 text-pastel-blue-700 text-[10px] font-medium border border-pastel-blue-200">
              <span>🔗</span>
              <span>하위 카드 {card.childCount}개</span>
            </div>
          </div>
        )}


      </div>

      {/* Edit Card Modal */}
      {showEditModal && cardWithRelations && (
        <EditCardModal
          card={cardWithRelations}
          workspaceId={workspaceId}
          boardId={boardId}
          boardOwnerId={boardOwnerId}
          columnId={columnId}
          canEdit={canEdit}
          onClose={() => {
            setShowEditModal(false);
            setCardWithRelations(null);
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

// Memoize to prevent unnecessary re-renders when WebSocket events update cards
export const CardItem = React.memo(CardItemComponent);
