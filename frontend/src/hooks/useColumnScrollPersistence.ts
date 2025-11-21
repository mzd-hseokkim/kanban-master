import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

type UseColumnScrollPersistenceParams = {
  boardId: number;
  columnId: number;
  enabled: boolean;
  containerRef: RefObject<HTMLElement>;
};

const STORAGE_KEY = (boardId: number, columnId: number) => `scroll:${boardId}:${columnId}`;
const THROTTLE_MS = 250;

const throttle = <Args extends unknown[]>(fn: (...args: Args) => void, wait: number) => {
  let lastCall = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const throttled = (...args: Args) => {
    const now = Date.now();
    const remaining = wait - (now - lastCall);

    if (remaining <= 0) {
      clear();
      lastCall = now;
      fn(...args);
      return;
    }

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      lastCall = Date.now();
      fn(...args);
      timer = null;
    }, remaining);
  };

  throttled.cancel = clear;
  return throttled;
};

const readScrollTop = (key: string) => {
  try {
    const value = window.localStorage.getItem(key);
    if (value === null) {
      return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  } catch (error) {
    console.warn('scroll persistence read failed', error);
    return null;
  }
};

const writeScrollTop = (key: string, value: number) => {
  try {
    window.localStorage.setItem(key, String(value));
  } catch (error) {
    console.warn('scroll persistence write failed', error);
  }
};

export const useColumnScrollPersistence = ({
  boardId,
  columnId,
  enabled,
  containerRef,
}: UseColumnScrollPersistenceParams) => {
  const restoredRef = useRef(false);

  useEffect(() => {
    restoredRef.current = false;
  }, [boardId, columnId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) {
      return;
    }

    const key = STORAGE_KEY(boardId, columnId);
    const applySavedScroll = () => {
      const savedTop = readScrollTop(key);
      if (savedTop === null) {
        return;
      }
      if (Math.abs(container.scrollTop - savedTop) < 1) {
        return;
      }
      container.scrollTo({ top: savedTop, behavior: 'smooth' });
    };

    let raf1 = 0;
    let raf2 = 0;
    if (!restoredRef.current) {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(applySavedScroll);
      });
      restoredRef.current = true;
    }

    const handleScroll = throttle(() => {
      writeScrollTop(key, container.scrollTop);
    }, THROTTLE_MS);

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [boardId, columnId, enabled, containerRef]);
};
