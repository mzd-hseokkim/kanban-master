import checklistService, { ChecklistItem, ChecklistProgress } from '@/services/checklistService';
import { useEffect, useState } from 'react';
import { HiCheck, HiPlus, HiTrash } from 'react-icons/hi';

interface ChecklistSectionProps {
  cardId: number;
  workspaceId: number;
  boardId: number;
  columnId: number;
  canEdit: boolean;
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  cardId,
  workspaceId,
  boardId,
  columnId,
  canEdit,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [progress, setProgress] = useState<ChecklistProgress | null>(null);
  const [newItemContent, setNewItemContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  const loadChecklist = async () => {
    try {
      const [itemsData, progressData] = await Promise.all([
        checklistService.getChecklistItems(workspaceId, boardId, columnId, cardId),
        checklistService.getChecklistProgress(workspaceId, boardId, columnId, cardId),
      ]);
      setItems(itemsData);
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load checklist:', error);
    }
  };

  useEffect(() => {
    loadChecklist();
  }, [cardId]);

  const handleAddItem = async () => {
    if (!newItemContent.trim() || loading) return;

    try {
      setLoading(true);
      await checklistService.createChecklistItem(workspaceId, boardId, columnId, cardId, {
        content: newItemContent.trim(),
      });
      setNewItemContent('');
      await loadChecklist();
    } catch (error) {
      console.error('Failed to create checklist item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheck = async (item: ChecklistItem) => {
    try {
      await checklistService.updateChecklistItem(workspaceId, boardId, columnId, cardId, item.id, {
        isChecked: !item.isChecked,
      });
      await loadChecklist();
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await checklistService.deleteChecklistItem(workspaceId, boardId, columnId, cardId, itemId);
      await loadChecklist();
    } catch (error) {
      console.error('Failed to delete checklist item:', error);
    }
  };

  const filteredItems = hideCompleted ? items.filter(item => !item.isChecked) : items;

  return (
    <div className="space-y-3">
      {/* 헤더 및 진행률 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-pastel-blue-900">체크리스트</h3>
          {items.length > 0 && (
            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className="text-xs text-pastel-blue-600 hover:text-pastel-blue-800 transition"
            >
              {hideCompleted ? '완료 항목 보기' : '완료 항목 숨기기'}
            </button>
          )}
        </div>

        {progress && progress.totalCount > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{progress.checkedCount}/{progress.totalCount} 완료</span>
              <span>{progress.progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-pastel-green-500 h-full transition-all duration-300"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 체크리스트 항목 */}
      {filteredItems.length > 0 && (
        <div className="space-y-1.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/40 transition group"
            >
              <button
                onClick={() => handleToggleCheck(item)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                  item.isChecked
                    ? 'bg-white border-pastel-green-500'
                    : 'bg-white border-gray-300 hover:border-pastel-green-400'
                }`}
                disabled={!canEdit}
              >
                {item.isChecked && <HiCheck className="text-pastel-green-500 text-sm font-bold" />}
              </button>
              <span
                className={`flex-1 text-sm ${
                  item.isChecked ? 'text-gray-500 line-through' : 'text-pastel-blue-900'
                }`}
              >
                {item.content}
              </span>
              {canEdit && (
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition"
                >
                  <HiTrash className="text-sm" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 새 항목 추가 */}
      {canEdit && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                handleAddItem();
              }
            }}
            placeholder="새 항목 추가..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-white/40 bg-white/40 backdrop-blur-sm text-pastel-blue-900 placeholder-pastel-blue-400 focus:outline-none focus:border-pastel-blue-400 focus:ring-2 focus:ring-pastel-blue-300/50 transition"
            disabled={loading}
          />
          <button
            onClick={handleAddItem}
            disabled={!newItemContent.trim() || loading}
            className="p-2 rounded-lg bg-pastel-blue-500 text-white hover:bg-pastel-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiPlus className="text-base" />
          </button>
        </div>
      )}
    </div>
  );
};
