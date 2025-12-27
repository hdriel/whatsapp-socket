import { useEffect, useState } from 'react';
import { getSocket } from '../socket';

export const useQR = () => {
    const [QRImage, setQRImage] = useState('');
    const [QRCode, setQRCode] = useState('');
    const socket = getSocket();

    useEffect(() => {
        const onQRStart = ({ qrImage, qrCode }: { qrCode: string; qrImage: string }) => {
            console.log('get new qr code/image', { qrImage, qrCode });
            qrCode && setQRCode(qrCode);
            qrImage && setQRImage(qrImage);
        };

        const onQRDone = () => {
            setQRCode('');
            setQRImage('');
        };

        socket?.on('qr-connected', onQRDone);
        socket?.on('qr', onQRStart);

        return () => {
            socket?.off('qr-connected', onQRDone);
            socket?.off('qr', onQRStart);
        };
    }, [socket]);

    return { QRImage, QRCode };
};
