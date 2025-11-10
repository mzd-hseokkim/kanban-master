import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export type PresenceStage = 'enter' | 'exit';

export const usePresenceTransition = (isOpen: boolean, duration = 360) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [stage, setStage] = useState<PresenceStage>(isOpen ? 'enter' : 'exit');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isOpen) {
      setShouldRender(true);
      setStage('enter');
    } else if (prefersReducedMotion) {
      setShouldRender(false);
    } else {
      setStage('exit');
      timeoutRef.current = window.setTimeout(() => {
        setShouldRender(false);
        timeoutRef.current = null;
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isOpen, duration, prefersReducedMotion]);

  return {
    shouldRender,
    stage,
    isEntering: stage === 'enter',
    isExiting: stage === 'exit',
  };
};
