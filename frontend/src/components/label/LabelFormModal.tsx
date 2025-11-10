import { useState } from 'react';
import type { Label, CreateLabelRequest } from '@/types/label';

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
      onClose();
    } catch (err) {
      console.error('Failed to submit label:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-glass-lg w-full max-w-md mx-4 p-8 border border-white/60">
        <h3 className="text-xl font-bold text-pastel-blue-900 mb-6">
          {label ? '라벨 수정' : '새 라벨 만들기'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
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
              className="w-full px-4 py-3 rounded-xl border border-pastel-blue-100 bg-white text-pastel-blue-900 placeholder-pastel-blue-400 shadow-sm focus:outline-none focus:border-pastel-blue-400 focus:ring-2 focus:ring-pastel-blue-200/70 transition"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-pastel-pink-600 font-medium">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
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
                  className={`h-12 rounded-lg border-2 transition ${
                    formData.colorToken === token.value
                      ? 'border-pastel-blue-600 ring-2 ring-pastel-blue-300/60 scale-105'
                      : 'border-pastel-blue-100 hover:border-pastel-blue-200'
                  }`}
                  style={{ backgroundColor: token.color }}
                  title={token.label}
                ></button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
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
              className="w-full px-4 py-3 rounded-xl border border-pastel-blue-100 bg-white text-pastel-blue-900 placeholder-pastel-blue-400 shadow-sm focus:outline-none focus:border-pastel-blue-400 focus:ring-2 focus:ring-pastel-blue-200/70 transition"
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
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-pastel-blue-700 bg-white border border-pastel-blue-100 hover:bg-pastel-blue-50 transition"
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold shadow-glass-sm hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
