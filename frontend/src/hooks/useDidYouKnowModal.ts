import { didYouKnowStorage } from '@/utils/didYouKnowStorage';
import { useCallback, useState } from 'react';

export const useDidYouKnowModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAutoShowEnabled, setIsAutoShowEnabled] = useState(!didYouKnowStorage.isDisabled());

  /**
   * 모달 열기 (마지막 표시 시간 기록)
   */
  const open = useCallback(() => {
    didYouKnowStorage.setLastShownTime();
    setIsOpen(true);
  }, []);

  /**
   * 모달 닫기
   */
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * 자동 표시 설정 토글
   */
  const toggleAutoShow = useCallback(() => {
    if (isAutoShowEnabled) {
      didYouKnowStorage.disable();
      setIsAutoShowEnabled(false);
    } else {
      didYouKnowStorage.enable();
      setIsAutoShowEnabled(true);
    }
  }, [isAutoShowEnabled]);

  /**
   * 모달을 표시해야 하는지 판단
   */
  const shouldShow = useCallback(() => {
    return didYouKnowStorage.shouldShow();
  }, []);

  /**
   * 마지막 표시 시간 (포맷팅)
   */
  const getLastShownTimeFormatted = useCallback((): string | null => {
    const lastShown = didYouKnowStorage.getLastShownTime();
    if (!lastShown) {
      return null;
    }

    try {
      const date = new Date(lastShown);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  }, []);

  return {
    isOpen,
    open,
    close,
    shouldShow,
    toggleAutoShow,
    isAutoShowEnabled,
    lastShownTime: getLastShownTimeFormatted(),
  };
};
