import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export const MODAL_TRANSITION_DURATION = 320;

export type ModalAnimationStage = 'enter' | 'exit';

export const useModalAnimation = (onClose: () => void, duration = MODAL_TRANSITION_DURATION) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<ModalAnimationStage>('enter');
  const timeoutRef = useRef<number | null>(null);

  const close = useCallback(() => {
    if (prefersReducedMotion) {
      onClose();
      return;
    }

    setStage('exit');

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      onClose();
    }, duration);
  }, [onClose, prefersReducedMotion, duration]);

  useEffect(() => () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    stage,
    close,
    isExiting: stage === 'exit',
    isEntering: stage === 'enter',
  };
};
