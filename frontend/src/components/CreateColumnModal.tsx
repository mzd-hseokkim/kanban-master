import React, { useState } from 'react';
import { useColumn } from '@/context/ColumnContext';
import { ErrorNotification } from '@/components/ErrorNotification';
import { useModalAnimation } from '@/hooks/useModalAnimation';

interface CreateColumnModalProps {
  workspaceId: number;
  boardId: number;
  onClose: () => void;
}

const columnColors = [
  { value: 'bg-gradient-to-br from-pastel-blue-100 to-pastel-cyan-100', label: 'Blue', hex: '#8fb3ff' },
  { value: 'bg-gradient-to-br from-pastel-pink-100 to-pastel-rose-100', label: 'Pink', hex: '#ffb3e6' },
  { value: 'bg-gradient-to-br from-pastel-green-100 to-pastel-emerald-100', label: 'Green', hex: '#b3ffc4' },
  { value: 'bg-gradient-to-br from-pastel-purple-100 to-pastel-indigo-100', label: 'Purple', hex: '#d4a5ff' },
  { value: 'bg-gradient-to-br from-pastel-yellow-100 to-pastel-amber-100', label: 'Yellow', hex: '#fff4b3' },
];

export const CreateColumnModal: React.FC<CreateColumnModalProps> = ({
  workspaceId,
  boardId,
  onClose,
}) => {
  const { createColumn } = useColumn();
  const { stage, close } = useModalAnimation(onClose);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(columnColors[0].hex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('칼럼 이름을 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createColumn(workspaceId, boardId, {
        name: name.trim(),
        description: description.trim() || undefined,
        bgColor: selectedColor,
      });

      close();
    } catch (err) {
      const message = err instanceof Error ? err.message : '칼럼 생성에 실패했습니다';
      setError(message);
      console.error('Failed to create column:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`modal-overlay modal-overlay-${stage} bg-black/40 backdrop-blur-sm p-4`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            close();
          }
        }}
      >
        <div className={`modal-panel modal-panel-${stage} bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-pastel-blue-200`}>
          {/* 헤더 */}
          <h2 className="text-2xl font-bold text-pastel-blue-900 mb-1">칼럼 생성</h2>
          <p className="text-sm text-pastel-blue-600 mb-6">새로운 칼럼을 생성하세요</p>

          <form onSubmit={handleSubmit}>
            {/* 이름 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
                칼럼 이름 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: To Do, In Progress, Done"
                className="w-full px-4 py-2 rounded-lg bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-900 placeholder-pastel-blue-400 focus:outline-none focus:ring-2 focus:ring-pastel-blue-400"
                disabled={loading}
              />
            </div>

            {/* 설명 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="칼럼에 대한 설명을 입력하세요 (선택사항)"
                className="w-full px-4 py-2 rounded-lg bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-900 placeholder-pastel-blue-400 focus:outline-none focus:ring-2 focus:ring-pastel-blue-400 resize-none"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* 색상 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-pastel-blue-900 mb-3">
                색상 선택
              </label>
              <div className="grid grid-cols-5 gap-2">
                {columnColors.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setSelectedColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    className={`w-full aspect-square rounded-lg transition ${
                      selectedColor === color.hex
                        ? 'ring-2 ring-pastel-blue-500 ring-offset-2 ring-offset-white'
                        : 'hover:shadow-md'
                    }`}
                    title={color.label}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-pastel-pink-100/50 border border-pastel-pink-300 text-pastel-pink-700 text-sm">
                {error}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-pastel-blue-100 text-pastel-blue-700 font-semibold hover:bg-pastel-blue-200 transition disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-pastel-blue-500 to-pastel-cyan-400 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? '생성 중...' : '생성'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 에러 알림 (모달 외부 표시) */}
      {error && (
        <ErrorNotification
          message={error}
          onClose={() => setError(null)}
          duration={5000}
        />
      )}
    </>
  );
};
