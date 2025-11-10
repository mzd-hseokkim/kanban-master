import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { memberService } from '@/services/memberService';
import type { BoardMember } from '@/types/member';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import {
  modalOverlayClass,
  modalPanelClass,
  modalPrimaryButtonClass,
  modalSecondaryButtonClass,
} from '@/styles/modalStyles';

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
      className={modalOverlayClass(stage, 'z-[9999]')}
      onClick={handleBackdropClick}
    >
      <div className={modalPanelClass({ stage })}>
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-pastel-blue-500 font-semibold">
              Invitation
            </p>
            <h2 className="text-2xl font-bold text-pastel-blue-900 mt-1">보드 초대</h2>
          </div>
          <button
            onClick={close}
            disabled={loading}
            className="w-10 h-10 rounded-full text-xl text-pastel-blue-500 hover:bg-white/40 transition disabled:opacity-50 flex items-center justify-center"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 p-5 rounded-2xl border border-white/40 bg-white/30 backdrop-blur-sm shadow-glass-sm">
          <p className="text-pastel-blue-900 mb-2">
            <span className="font-semibold">{invitation.invitedByName}</span>님이
            <span className="font-semibold text-pastel-blue-700">
              {' '}
              {invitation.boardName}
            </span>{' '}
            보드에 초대하셨습니다.
          </p>
          <p className="text-sm text-pastel-blue-600">
            초대를 수락하면 보드에 멤버로 추가됩니다.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            disabled={loading}
            className={`flex-1 ${modalSecondaryButtonClass}`}
          >
            거절
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            className={`flex-1 ${modalPrimaryButtonClass} flex items-center justify-center gap-2`}
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
