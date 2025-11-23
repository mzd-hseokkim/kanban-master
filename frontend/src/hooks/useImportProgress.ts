import { useWebSocket } from '@/context/WebSocketContext';
import excelService from '@/services/excelService';
import type { ImportJobStatus } from '@/types/excel';
import { useCallback, useEffect, useRef, useState } from 'react';

export const useImportProgress = (boardId: number, jobId?: string | null) => {
  const { client, isConnected } = useWebSocket();
  const [status, setStatus] = useState<ImportJobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!jobId) return null;
    try {
      const data = await excelService.getStatus(jobId);
      setStatus(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch import status', err);
      return null;
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId || !boardId) {
      setStatus(null);
      return;
    }

    const subscribeWebSocket = () => {
      if (!client || !isConnected) return;
      return client.subscribe(
        `/topic/boards/${boardId}/import/${jobId}`,
        (message) => {
          try {
            const payload: ImportJobStatus = JSON.parse(message.body);
            setStatus(payload);
            if (payload.state === 'COMPLETED' || payload.state === 'FAILED') {
              if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }
            }
          } catch (error) {
            console.error('Failed to parse import event', error);
          }
        }
      );
    };

    const startPolling = () => {
      setIsPolling(true);
      fetchStatus();
      pollRef.current = setInterval(fetchStatus, 1800);
    };

    const subscription = subscribeWebSocket();
    if (!subscription) {
      startPolling();
    } else {
      setIsPolling(false);
      fetchStatus();
    }

    return () => {
      subscription?.unsubscribe();
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [boardId, client, fetchStatus, isConnected, jobId]);

  return { status, isPolling, refresh: fetchStatus };
};
