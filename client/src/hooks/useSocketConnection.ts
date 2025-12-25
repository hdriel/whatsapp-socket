import { useEffect, useState } from 'react';
import { connectSocketIO, disconnectSocket } from '../socket';

export const useSocketConnection = () => {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socket = connectSocketIO();

        const handleConnect = () => {
            console.debug('✅ Socket connected:', socket.id);
            setConnected(true);
        };

        const handleDisconnect = (reason: string) => {
            console.debug('❌ Socket disconnected:', reason);
            setConnected(false);
        };

        const handleConnectError = (error: Error) => {
            console.error('🔥 Connection error:', error.message);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            disconnectSocket();
        };
    }, []);

    return connected;
};
