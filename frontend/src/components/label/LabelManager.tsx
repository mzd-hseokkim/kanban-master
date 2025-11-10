import { useState, useEffect } from 'react';
import { labelService } from '@/services/labelService';
import type { Label, CreateLabelRequest } from '@/types/label';
import { LabelItem } from './LabelItem';
import { LabelFormModal } from './LabelFormModal';

interface LabelManagerProps {
  boardId: number;
  onClose: () => void;
}

/**
 * 라벨 관리 컴포넌트
 * 보드의 라벨 목록 조회, 생성, 수정, 삭제, 순서 변경
 */
export const LabelManager = ({ boardId, onClose }: LabelManagerProps) => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  // 라벨 목록 로드
  useEffect(() => {
    loadLabels();
  }, [boardId]);

  const loadLabels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await labelService.getLabels(boardId);
      setLabels(data);
    } catch (err) {
      console.error('Failed to load labels:', err);
      setError('라벨을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLabel = async (data: CreateLabelRequest) => {
    try {
      setError(null);
      await labelService.createLabel(boardId, data);
      await loadLabels();
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create label:', err);
      setError('라벨 생성에 실패했습니다');
      throw err;
    }
  };

  const handleUpdateLabel = async (labelId: number, data: CreateLabelRequest) => {
    try {
      setError(null);
      await labelService.updateLabel(boardId, labelId, data);
      await loadLabels();
      setEditingLabel(null);
    } catch (err) {
      console.error('Failed to update label:', err);
      setError('라벨 수정에 실패했습니다');
      throw err;
    }
  };

  const handleDeleteLabel = async (labelId: number) => {
    if (!confirm('이 라벨을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setError(null);
      await labelService.deleteLabel(boardId, labelId);
      await loadLabels();
    } catch (err) {
      console.error('Failed to delete label:', err);
      setError('라벨 삭제에 실패했습니다');
    }
  };

  // 색상 토큰 옵션
  const colorTokens = [
    { value: 'pastel-blue-500', label: 'Blue', color: '#8fb3ff' },
    { value: 'pastel-pink-500', label: 'Pink', color: '#ffb3e6' },
    { value: 'pastel-green-500', label: 'Green', color: '#b3ffc4' },
    { value: 'pastel-purple-500', label: 'Purple', color: '#d4a5ff' },
    { value: 'pastel-yellow-500', label: 'Yellow', color: '#fff4b3' },
    { value: 'pastel-orange-500', label: 'Orange', color: '#ffd4b3' },
    { value: 'pastel-red-500', label: 'Red', color: '#ffb3b3' },
    { value: 'pastel-teal-500', label: 'Teal', color: '#b3ffe6' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl mx-4 p-8 border border-pastel-blue-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-pastel-blue-900">라벨 관리</h2>
          <button
            onClick={onClose}
            className="text-pastel-blue-700 hover:text-pastel-blue-900 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-pastel-pink-100/70 text-pastel-pink-700 text-sm border border-pastel-pink-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-pastel-blue-200 border-t-pastel-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary w-full py-3 rounded-xl font-semibold"
              >
                + 새 라벨 만들기
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {labels.length === 0 ? (
                <div className="text-center py-8 text-pastel-blue-600">
                  라벨이 없습니다. 새 라벨을 만들어보세요.
                </div>
              ) : (
                labels.map((label) => (
                  <LabelItem
                    key={label.id}
                    label={label}
                    colorTokens={colorTokens}
                    onEdit={() => setEditingLabel(label)}
                    onDelete={() => handleDeleteLabel(label.id)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {showCreateModal && (
          <LabelFormModal
            boardId={boardId}
            colorTokens={colorTokens}
            onSubmit={handleCreateLabel}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {editingLabel && (
          <LabelFormModal
            boardId={boardId}
            label={editingLabel}
            colorTokens={colorTokens}
            onSubmit={(data) => handleUpdateLabel(editingLabel.id, data)}
            onClose={() => setEditingLabel(null)}
          />
        )}
      </div>
    </div>
  );
};
