import { useEffect, useState } from 'react';
import { connectSocketIO, disconnectSocket } from '../socket';

export const useSocketConnection = (): [boolean, 'open' | 'close' | 'connecting'] => {
    const [serverConnected, setServerConnected] = useState(false);
    const [clientStatus, setClientStatus] = useState<'open' | 'close' | 'connecting'>('close');

    useEffect(() => {
        const socket = connectSocketIO();

        const handleConnect = () => {
            console.debug('✅ Socket connected:', socket.id);
            setServerConnected(true);
        };

        const handleDisconnect = (reason: string) => {
            console.debug('❌ Socket disconnected:', reason);
            setServerConnected(false);
        };

        const handleConnectError = (error: Error) => {
            console.error('🔥 Connection error:', error.message);
        };

        const handleConnectionStatusChange = (status: 'open' | 'close' | 'connecting') => {
            console.debug('Connection status:', status);
            setClientStatus(status);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('connection-status', handleConnectionStatusChange);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            socket.off('connection-status', handleConnectionStatusChange);
            disconnectSocket();
        };
    }, []);

    return [serverConnected, clientStatus];
};
