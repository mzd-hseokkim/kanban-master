import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { memberService } from '@/services/memberService';
import type { BoardMember } from '@/types/member';
import { useModalAnimation } from '@/hooks/useModalAnimation';

interface InvitationResponseModalProps {
  invitation: BoardMember | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InvitationResponseModal: React.FC<InvitationResponseModalProps> = ({
  invitation,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const { stage, close } = useModalAnimation(onClose);

  if (!isOpen || !invitation) {
    return null;
  }

  const handleAccept = async () => {
    if (!invitation.invitationToken) return;
    try {
      setLoading(true);
      await memberService.acceptInvitation(invitation.invitationToken);
      close();
      onSuccess?.();
      // 보드 목록을 갱신하기 위해 페이지 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      alert('초대 수락에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation.invitationToken) return;
    try {
      setLoading(true);
      await memberService.declineInvitation(invitation.invitationToken);
      close();
      onSuccess?.();
      // 초대 목록 갱신을 위해 페이지 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      console.error('Failed to decline invitation:', err);
      alert('초대 거절에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  const modalContent = (
    <div
      className={`modal-overlay modal-overlay-${stage} bg-black/50 z-[9999]`}
      onClick={handleBackdropClick}
    >
      <div className={`modal-panel modal-panel-${stage} bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl`}>
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">보드 초대</h2>
          <button
            onClick={close}
            disabled={loading}
            className="text-2xl text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">{invitation.invitedByName}</span>님이
            <span className="font-semibold text-blue-600"> {invitation.boardName}</span> 보드에 초대하셨습니다.
          </p>
          <p className="text-sm text-gray-600">
            초대를 수락하면 보드에 멤버로 추가됩니다.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition"
          >
            거절
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                수락 중…
              </>
            ) : (
              '수락'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
