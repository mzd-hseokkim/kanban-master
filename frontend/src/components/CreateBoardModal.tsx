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
import { useTranslation } from 'react-i18next';

interface CreateBoardModalProps {
  workspaceId: number;
  onClose: () => void;
}

export const CreateBoardModal = ({
  workspaceId,
  onClose,
}: CreateBoardModalProps) => {
  const { t } = useTranslation(['board', 'common']);
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
      errors.name = t('board:create.required');
    }
    if (formData.name.length > 100) {
      errors.name = t('board:create.nameMax');
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
    { value: 'pastel-blue-500', label: t('board:create.colors.blue'), color: '#8fb3ff' },
    { value: 'pastel-pink-500', label: t('board:create.colors.pink'), color: '#ffb3e6' },
    { value: 'pastel-green-500', label: t('board:create.colors.green'), color: '#b3ffc4' },
    { value: 'pastel-purple-500', label: t('board:create.colors.purple'), color: '#d4a5ff' },
    { value: 'pastel-yellow-500', label: t('board:create.colors.yellow'), color: '#fff4b3' },
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
        <h2 className="text-2xl font-bold text-pastel-blue-900 mb-6">{t('board:create.title')}</h2>

        {error && (
          <div className={`mb-4 ${modalErrorClass}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={modalLabelClass}>
              {t('board:create.nameLabel')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setFieldErrors({ ...fieldErrors, name: '' });
              }}
              maxLength={100}
              placeholder={t('board:create.namePlaceholder')}
              className={modalInputClass}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-pastel-pink-600 font-medium">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className={modalLabelClass}>
              {t('board:create.descriptionLabel')}
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              placeholder={t('board:create.descriptionPlaceholder')}
              rows={3}
              className={modalTextareaClass}
            />
          </div>

          <div>
            <label className={`${modalLabelClass} !mb-3`}>
              {t('board:create.themeColor')}
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
              {t('common:button.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className={`flex-1 ${modalPrimaryButtonClass}`}
            >
              {loading ? t('board:create.creating') : t('common:button.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
