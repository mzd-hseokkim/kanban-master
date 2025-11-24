import { StompSubscription } from '@stomp/stompjs';
import { useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';

export interface BoardEvent {
    type: string;
    boardId: number;
    payload: any;
    triggeredByUserId: number;
    timestamp: number;
}

export const useBoardSubscription = (boardId: number | undefined, onEvent: (event: BoardEvent) => void) => {
    const { client, isConnected } = useWebSocket();

    useEffect(() => {
        if (!client || !isConnected || !boardId) return;

        const subscription: StompSubscription = client.subscribe(`/topic/board/${boardId}`, (message) => {
            try {
                const event: BoardEvent = JSON.parse(message.body);
                onEvent(event);
            } catch (error) {
                console.error('Error parsing board event:', error);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [client, isConnected, boardId, onEvent]);
};
