import React, { useState } from 'react';
import { useCard } from '@/context/CardContext';
import { ErrorNotification } from '@/components/ErrorNotification';

interface CreateCardModalProps {
  workspaceId: number;
  boardId: number;
  columnId: number;
  onClose: () => void;
}

const cardPriorities = ['HIGH', 'MEDIUM', 'LOW'];

const cardColors = [
  { label: 'Blue', hex: '#e8f1ff' },
  { label: 'Pink', hex: '#ffe8f1' },
  { label: 'Green', hex: '#e8ffe8' },
  { label: 'Yellow', hex: '#ffffee' },
  { label: 'Purple', hex: '#f0e8ff' },
];

export const CreateCardModal: React.FC<CreateCardModalProps> = ({
  workspaceId,
  boardId,
  columnId,
  onClose,
}) => {
  const { createCard } = useCard();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(cardColors[0].hex);
  const [priority, setPriority] = useState<string>('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('카드 제목을 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createCard(workspaceId, boardId, columnId, {
        title: title.trim(),
        description: description.trim() || undefined,
        bgColor: selectedColor,
        priority: priority || undefined,
        assignee: assignee.trim() || undefined,
        dueDate: dueDate || undefined,
      });

      // 모달 닫기 전에 약간의 딜레이
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      const message = err instanceof Error ? err.message : '카드 생성에 실패했습니다';
      setError(message);
      console.error('Failed to create card:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-pastel-blue-200">
          {/* 헤더 */}
          <h2 className="text-2xl font-bold text-pastel-blue-900 mb-1">카드 생성</h2>
          <p className="text-sm text-pastel-blue-600 mb-6">새로운 카드를 생성하세요</p>

          <form onSubmit={handleSubmit}>
            {/* 제목 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
                카드 제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 로그인 기능 구현"
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
                placeholder="카드에 대한 설명을 입력하세요 (선택사항)"
                className="w-full px-4 py-2 rounded-lg bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-900 placeholder-pastel-blue-400 focus:outline-none focus:ring-2 focus:ring-pastel-blue-400 resize-none"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* 우선순위 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
                우선순위
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-900 focus:outline-none focus:ring-2 focus:ring-pastel-blue-400"
                disabled={loading}
              >
                <option value="">우선순위 선택 (선택사항)</option>
                {cardPriorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* 할당자 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
                할당자
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="담당자 이름 (선택사항)"
                className="w-full px-4 py-2 rounded-lg bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-900 placeholder-pastel-blue-400 focus:outline-none focus:ring-2 focus:ring-pastel-blue-400"
                disabled={loading}
              />
            </div>

            {/* 마감 날짜 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-pastel-blue-900 mb-2">
                마감 날짜
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-pastel-blue-50 border border-pastel-blue-200 text-pastel-blue-900 focus:outline-none focus:ring-2 focus:ring-pastel-blue-400"
                disabled={loading}
              />
            </div>

            {/* 색상 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-pastel-blue-900 mb-3">
                색상 선택
              </label>
              <div className="grid grid-cols-5 gap-2">
                {cardColors.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setSelectedColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    className={`w-full aspect-square rounded-lg transition border-2 ${
                      selectedColor === color.hex
                        ? 'border-pastel-blue-500 ring-2 ring-pastel-blue-500'
                        : 'border-transparent hover:shadow-md'
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
                onClick={onClose}
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
