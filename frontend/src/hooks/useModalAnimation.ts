import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export const MODAL_TRANSITION_DURATION = 320;

export type ModalAnimationStage = 'enter' | 'exit';

export const useModalAnimation = (onClose: () => void, duration = MODAL_TRANSITION_DURATION) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<ModalAnimationStage>('enter');
  const timeoutRef = useRef<number | null>(null);

  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const close = useCallback(() => {
    if (prefersReducedMotion) {
      onCloseRef.current();
      return;
    }

    setStage('exit');

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      onCloseRef.current();
    }, duration);
  }, [prefersReducedMotion, duration]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [close]);

  return {
    stage,
    close,
    isExiting: stage === 'exit',
    isEntering: stage === 'enter',
  };
};
