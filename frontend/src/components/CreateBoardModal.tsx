import { useState } from 'react';
import { useBoard } from '@/context/BoardContext';
import type { CreateBoardRequest } from '@/types/board';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import {
  modalOverlayClass,
  modalPanelClass,
  modalLabelClass,
  modalInputClass,
  modalTextareaClass,
  modalSecondaryButtonClass,
  modalPrimaryButtonClass,
  modalErrorClass,
  modalColorButtonClass,
} from '@/styles/modalStyles';

interface CreateBoardModalProps {
  workspaceId: number;
  onClose: () => void;
}

export const CreateBoardModal = ({
  workspaceId,
  onClose,
}: CreateBoardModalProps) => {
  const { createBoard, loading, error, clearError } = useBoard();
  const { stage, close } = useModalAnimation(onClose);
  const [formData, setFormData] = useState<CreateBoardRequest>({
    name: '',
    description: '',
    themeColor: 'pastel-blue-500',
    icon: 'sparkles',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Board name is required';
    }
    if (formData.name.length > 100) {
      errors.name = 'Board name must be less than 100 characters';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await createBoard(workspaceId, formData);
      // 성공하면 모달 닫기 - onClose에서 보드 페이지로 이동
      close();
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  };

  const themeColors = [
    { value: 'pastel-blue-500', label: 'Blue', color: '#8fb3ff' },
    { value: 'pastel-pink-500', label: 'Pink', color: '#ffb3e6' },
    { value: 'pastel-green-500', label: 'Green', color: '#b3ffc4' },
    { value: 'pastel-purple-500', label: 'Purple', color: '#d4a5ff' },
    { value: 'pastel-yellow-500', label: 'Yellow', color: '#fff4b3' },
  ];

  return (
    <div
      className={modalOverlayClass(stage)}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          close();
        }
      }}
    >
      <div className={modalPanelClass({ stage })}>
        <h2 className="text-2xl font-bold text-pastel-blue-900 mb-6">새 보드 만들기</h2>

        {error && (
          <div className={`mb-4 ${modalErrorClass}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={modalLabelClass}>
              보드 이름 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setFieldErrors({ ...fieldErrors, name: '' });
              }}
              maxLength={100}
              placeholder="예: 제품 로드맵"
              className={modalInputClass}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-pastel-pink-600 font-medium">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className={modalLabelClass}>
              설명 (선택사항)
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              placeholder="보드에 대한 설명을 입력하세요..."
              rows={3}
              className={modalTextareaClass}
            />
          </div>

          <div>
            <label className={`${modalLabelClass} !mb-3`}>
              테마 색상
            </label>
            <div className="flex gap-3 justify-between">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, themeColor: color.value })}
                  style={{ backgroundColor: color.color }}
                  className={`flex-1 h-12 ${modalColorButtonClass(
                    formData.themeColor === color.value,
                  )}`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={close}
              disabled={loading}
              className={`flex-1 ${modalSecondaryButtonClass}`}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className={`flex-1 ${modalPrimaryButtonClass}`}
            >
              {loading ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
