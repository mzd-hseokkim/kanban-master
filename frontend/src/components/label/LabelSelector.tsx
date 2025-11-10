import { useState, useEffect } from 'react';
import { labelService } from '@/services/labelService';
import type { Label } from '@/types/label';

interface LabelSelectorProps {
  boardId: number;
  cardId?: number;
  selectedLabelIds: number[];
  onChange: (labelIds: number[]) => void;
}

/**
 * 라벨 선택기 컴포넌트
 * 보드의 라벨 목록을 표시하고 선택/해제 가능
 */
export const LabelSelector = ({
  boardId,
  cardId: _cardId,
  selectedLabelIds,
  onChange,
}: LabelSelectorProps) => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadLabels();
  }, [boardId]);

  const loadLabels = async () => {
    try {
      setLoading(true);
      const data = await labelService.getLabels(boardId);
      setLabels(data);
    } catch (err) {
      console.error('Failed to load labels:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = (labelId: number) => {
    if (selectedLabelIds.includes(labelId)) {
      onChange(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      onChange([...selectedLabelIds, labelId]);
    }
  };

  const handleCreateLabel = async () => {
    const trimmedName = newLabelName.trim();
    if (!trimmedName) return;

    // 중복 체크
    if (labels.some((label) => label.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert('동일한 이름의 라벨이 이미 존재합니다');
      return;
    }

    try {
      setCreating(true);

      // 색상 자동 할당 (순환)
      const availableColors = [
        'pastel-blue-500',
        'pastel-pink-500',
        'pastel-green-500',
        'pastel-purple-500',
        'pastel-yellow-500',
        'pastel-orange-500',
        'pastel-red-500',
        'pastel-teal-500',
      ];
      const colorToken = availableColors[labels.length % availableColors.length];

      const newLabel = await labelService.createLabel(boardId, {
        name: trimmedName,
        colorToken,
      });

      // 라벨 목록 업데이트
      setLabels((prev) => [...prev, newLabel]);

      // 자동으로 선택
      onChange([...selectedLabelIds, newLabel.id]);

      // 입력 필드 초기화
      setNewLabelName('');
    } catch (err) {
      console.error('Failed to create label:', err);
      alert('라벨 생성에 실패했습니다');
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateLabel();
    }
  };

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

  return (
    <div className="space-y-3">
      {/* 빠른 라벨 생성 입력 필드 */}
      <div className="flex items-center gap-2 m-1">
        <div className="flex-1 px-3 py-2 rounded-lg bg-white border border-pastel-blue-200 focus-within:ring-2 focus-within:ring-pastel-blue-400">
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="라벨 이름 입력 후 Enter..."
            className="w-full bg-transparent text-sm text-pastel-blue-900 placeholder-pastel-blue-400 focus:outline-none"
            disabled={creating || loading}
          />
        </div>
        <button
          type="button"
          onClick={handleCreateLabel}
          disabled={!newLabelName.trim() || creating || loading}
          className="px-4 py-2 text-sm rounded-lg bg-pastel-blue-500 text-white font-medium hover:bg-pastel-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? '...' : '추가'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-pastel-blue-200 border-t-pastel-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && labels.length === 0 && (
        <div className="text-center py-4 text-sm text-pastel-blue-600">
          라벨이 없습니다. 위에서 라벨을 생성해주세요.
        </div>
      )}

      {!loading && labels.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {labels.map((label) => {
            const bgColor = colorMap[label.colorToken] || '#8fb3ff';
            const isSelected = selectedLabelIds.includes(label.id);

            return (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.id)}
                className={`w-full h-9 px-3 rounded-full border text-sm font-normal tracking-tight flex items-center justify-between transition ${
                  isSelected
                    ? 'border-pastel-blue-600 text-pastel-blue-900 shadow-sm'
                    : 'border-pastel-blue-200 text-pastel-blue-700 hover:border-pastel-blue-400'
                }`}
                style={{
                  backgroundColor: bgColor,
                  opacity: isSelected ? 0.95 : 0.6,
                }}
                title={label.description || label.name}
              >
                <span className="truncate">{label.name}</span>
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-pastel-blue-700 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
