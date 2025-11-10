import { useState } from 'react';
import type { Label, CreateLabelRequest } from '@/types/label';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import {
  modalOverlayClass,
  modalPanelClass,
  modalLabelClass,
  modalInputClass,
  modalSecondaryButtonClass,
  modalPrimaryButtonClass,
  modalColorButtonClass,
} from '@/styles/modalStyles';

interface ColorToken {
  value: string;
  label: string;
  color: string;
}

interface LabelFormModalProps {
  boardId: number;
  label?: Label;
  colorTokens: ColorToken[];
  onSubmit: (data: CreateLabelRequest) => Promise<void>;
  onClose: () => void;
}

/**
 * 라벨 생성/수정 폼 모달
 */
export const LabelFormModal = ({
  label,
  colorTokens,
  onSubmit,
  onClose,
}: LabelFormModalProps) => {
  const { stage, close } = useModalAnimation(onClose);
  const [formData, setFormData] = useState<CreateLabelRequest>({
    name: label?.name || '',
    colorToken: label?.colorToken || 'pastel-blue-500',
    description: label?.description || '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = '라벨 이름은 필수입니다';
    }
    if (formData.name.length > 30) {
      errors.name = '라벨 이름은 30자 이내여야 합니다';
    }
    if (formData.description && formData.description.length > 100) {
      errors.description = '설명은 100자 이내여야 합니다';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
      close();
    } catch (err) {
      console.error('Failed to submit label:', err);
    } finally {
      setSubmitting(false);
    }
  };

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
        <h3 className="text-xl font-bold text-pastel-blue-900 mb-6">
          {label ? '라벨 수정' : '새 라벨 만들기'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={modalLabelClass}>
              라벨 이름 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setFieldErrors({ ...fieldErrors, name: '' });
              }}
              maxLength={30}
              placeholder="예: 긴급, 버그, 개선"
              className={modalInputClass}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-pastel-pink-600 font-medium">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className={modalLabelClass}>
              색상 *
            </label>
            <div className="grid grid-cols-4 gap-3">
              {colorTokens.map((token) => (
                <button
                  key={token.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, colorToken: token.value })
                  }
                  className={`w-full h-12 ${modalColorButtonClass(formData.colorToken === token.value)}`}
                  style={{ backgroundColor: token.color }}
                  title={token.label}
                ></button>
              ))}
            </div>
          </div>

          <div>
            <label className={modalLabelClass}>
              설명 (선택)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setFieldErrors({ ...fieldErrors, description: '' });
              }}
              maxLength={100}
              placeholder="라벨에 대한 간단한 설명"
              className={modalInputClass}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-pastel-pink-600 font-medium">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={close}
              className={`flex-1 ${modalSecondaryButtonClass}`}
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className={`flex-1 ${modalPrimaryButtonClass}`}
              disabled={submitting}
            >
              {submitting ? '저장 중...' : label ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
