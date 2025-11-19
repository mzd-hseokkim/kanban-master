import { Client } from '@stomp/stompjs';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { authStorage } from '../utils/authStorage';

interface WebSocketContextType {
    client: Client | null;
    isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
    client: null,
    isConnected: false,
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [client, setClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const token = authStorage.getToken();

        const newClient = new Client({
            brokerURL: 'ws://localhost:8080/ws', // Adjust if backend port differs
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket');
                setIsConnected(true);
            },
            onDisconnect: () => {
                console.log('Disconnected from WebSocket');
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        newClient.activate();
        setClient(newClient);
        clientRef.current = newClient;

        return () => {
            newClient.deactivate();
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ client, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
};
