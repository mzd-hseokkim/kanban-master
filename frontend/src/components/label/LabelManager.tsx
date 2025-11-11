import { useState, useEffect } from 'react';
import { labelService } from '@/services/labelService';
import type { Label, CreateLabelRequest } from '@/types/label';
import { LabelItem } from './LabelItem';
import { LabelFormModal } from './LabelFormModal';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { useDialog } from '@/hooks/useDialog';
import {
  modalOverlayClass,
  modalPanelClass,
  modalPrimaryButtonClass,
  modalErrorClass,
} from '@/styles/modalStyles';

interface LabelManagerProps {
  boardId: number;
  onClose: () => void;
}

/**
 * 라벨 관리 컴포넌트
 * 보드의 라벨 목록 조회, 생성, 수정, 삭제, 순서 변경
 */
export const LabelManager = ({ boardId, onClose }: LabelManagerProps) => {
  const { stage, close } = useModalAnimation(onClose);
  const { showConfirm } = useDialog();
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
    const confirmed = await showConfirm({
      title: '라벨 삭제',
      message: '이 라벨을 삭제하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'danger',
    });

    if (!confirmed) return;

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
      className={modalOverlayClass(stage)}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          close();
        }
      }}
    >
      <div
        className={modalPanelClass({
          stage,
          maxWidth: 'max-w-2xl',
          extra: 'max-h-[90vh] flex flex-col',
        })}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-pastel-blue-900">라벨 관리</h2>
          <button
            onClick={close}
            className="w-10 h-10 rounded-full text-xl text-pastel-blue-500 hover:bg-white/40 transition flex items-center justify-center"
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
          <div className={`mb-4 ${modalErrorClass}`}>
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-white/40 border-t-pastel-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className={`w-full ${modalPrimaryButtonClass}`}
                >
                  + 새 라벨 만들기
                </button>
              </div>

              <div className="space-y-2 pb-2">
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
        </div>

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
