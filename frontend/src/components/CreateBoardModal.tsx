import { useState } from 'react';
import { useBoard } from '@/context/BoardContext';
import type { CreateBoardRequest } from '@/types/board';

interface CreateBoardModalProps {
  workspaceId: number;
  onClose: () => void;
}

export const CreateBoardModal = ({
  workspaceId,
  onClose,
}: CreateBoardModalProps) => {
  const { createBoard, loading, error, clearError } = useBoard();
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
      setTimeout(() => onClose(), 300);
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
      className="fixed inset-0 bg-gradient-pastel/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="glass-light rounded-3xl shadow-glass-lg w-full max-w-md mx-4 p-8 border border-white/30">
        <h2 className="text-2xl font-bold text-pastel-blue-900 mb-6">새 보드 만들기</h2>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-pastel-pink-100/70 text-pastel-pink-700 text-sm border border-pastel-pink-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
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
              className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/40 backdrop-blur-sm text-pastel-blue-900 placeholder-pastel-blue-500 focus:outline-none focus:border-pastel-blue-400 focus:ring-2 focus:ring-pastel-blue-300/50 transition"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-pastel-pink-600 font-medium">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
              설명 (선택사항)
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              placeholder="보드에 대한 설명을 입력하세요..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/40 backdrop-blur-sm text-pastel-blue-900 placeholder-pastel-blue-500 focus:outline-none focus:border-pastel-blue-400 focus:ring-2 focus:ring-pastel-blue-300/50 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-pastel-blue-900 mb-3">
              테마 색상
            </label>
            <div className="flex gap-3 justify-between">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, themeColor: color.value })}
                  style={{ backgroundColor: color.color }}
                  className={`flex-1 h-12 rounded-xl transition-all shadow-glass-sm ${
                    formData.themeColor === color.value
                      ? 'ring-3 ring-white/60 scale-105 shadow-lg'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-white/30 hover:bg-white/40 backdrop-blur-sm text-pastel-blue-700 font-semibold border border-white/40 transition disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:shadow-lg transition disabled:opacity-50 shadow-glass-sm"
            >
              {loading ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
