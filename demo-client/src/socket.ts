import { io, type Socket } from 'socket.io-client';

const url = import.meta.env.VITE_SERVER_URL;
if (!url) throw new Error('VITE_SERVER_URL is not defined');
console.log('socketURL', url);

let socket: null | Socket;

export const getSocket = () => socket;

export const disconnectSocket = () => {
    socket?.disconnect();
    socket = null;
};

export const connectSocketIO = () => {
    if (!socket) {
        socket = io(url, { withCredentials: true });

        socket.on('connect', () => {
            console.log('connected!');
        });
    }

    return socket;
};
