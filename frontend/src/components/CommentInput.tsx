/**
 * 댓글 입력 컴포넌트
 *
 * Spec § 4.2: CommentInput - 댓글 작성 폼
 * Spec § FR-06a: 댓글 작성
 * Spec § FR-06g: 빈 댓글 방지
 * Spec § FR-06i: XSS 방지
 */

import { useState } from 'react';
import { MentionInput } from './common/MentionInput';
import { useTranslation } from 'react-i18next';

interface CommentInputProps {
  boardId: number;
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
}

export const CommentInput = ({
  boardId,
  onSubmit,
  placeholder = '댓글을 입력하세요...',
}: CommentInputProps) => {
  const { t, i18n } = useTranslation(['board', 'common']);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Spec § FR-06g: 빈 댓글 방지
    if (!content.trim()) {
      alert(t('board:comments.required'));
      return;
    }

    // Spec § NFR-06c: 최대 10,000자 제한
    if (content.length > 10000) {
      alert(t('board:comments.maxLength'));
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(content);
      setContent(''); // 성공 시 입력 필드 초기화
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert(error instanceof Error ? error.message : t('board:comments.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-b border-gray-200 pb-3 mb-3">
      <div style={{ minHeight: '120px' }}>
        <MentionInput
          boardId={boardId}
          value={content}
          onChange={setContent}
          placeholder={placeholder}
          maxLength={10000}
        />
      </div>
      <div className="flex justify-end items-center mt-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !content.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('common:action.loading') : t('board:comments.submit')}
        </button>
      </div>
    </div>
  );
};
