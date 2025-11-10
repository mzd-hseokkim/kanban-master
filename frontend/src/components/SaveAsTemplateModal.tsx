import { useState } from 'react';
import { templateService } from '@/services/templateService';
import { CreateTemplateRequest } from '@/types/template';
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
} from '@/styles/modalStyles';

interface SaveAsTemplateModalProps {
  workspaceId: number;
  boardId: number;
  boardName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SaveAsTemplateModal = ({
  workspaceId,
  boardId,
  boardName,
  onClose,
  onSuccess,
}: SaveAsTemplateModalProps) => {
  const [name, setName] = useState(boardName);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { stage, close } = useModalAnimation(onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('템플릿 이름을 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: CreateTemplateRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        isPublic,
      };

      await templateService.saveAsTemplate(workspaceId, boardId, request);
      onSuccess();
      close();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '템플릿 저장에 실패했습니다';
      setError(errorMessage);
      console.error('Failed to save template:', err);
    } finally {
      setLoading(false);
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
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-pastel-blue-500 font-semibold">
              Save Template
            </p>
            <h2 className="text-2xl font-bold text-pastel-blue-900 mt-1">템플릿으로 저장</h2>
          </div>
          <button
            onClick={close}
            disabled={loading}
            className="w-10 h-10 rounded-full text-xl text-pastel-blue-500 hover:bg-white/40 transition disabled:opacity-50 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className={modalErrorClass}>{error}</div>}

          {/* Template Name */}
          <div>
            <label htmlFor="name" className={modalLabelClass}>
              템플릿 이름 *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              placeholder="예: 개발 프로젝트 템플릿"
              className={modalInputClass}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className={modalLabelClass}>
              설명 (선택사항)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="템플릿에 대한 설명을 입력하세요"
              rows={3}
              className={modalTextareaClass}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className={modalLabelClass}>
              카테고리 (선택사항)
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              placeholder="예: Development, Marketing, Design"
              className={modalInputClass}
            />
          </div>

          {/* Public Toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={loading}
                className="w-5 h-5 rounded border-pastel-blue-300 text-pastel-blue-600 focus:ring-pastel-blue-500 focus:ring-offset-0 disabled:opacity-50"
              />
              <div>
                <span className="text-sm font-medium text-pastel-blue-900">공개 템플릿</span>
                <p className="text-xs text-pastel-blue-500">
                  모든 사용자가 이 템플릿을 사용할 수 있습니다
                </p>
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
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
              disabled={loading || !name.trim()}
              className={`flex-1 ${modalPrimaryButtonClass}`}
            >
              {loading ? '저장 중…' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
