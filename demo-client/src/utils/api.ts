export const API_ENDPOINTS = {
    CONNECT: '/api/connect',
    DISCONNECT: '/api/disconnect',
    GENERATE_QR: '/api/generate-qr',
    UPLOAD_FILE: '/api/private/upload-file',
    UPLOAD_IMAGE: '/api/private/upload-image',
    UPLOAD_STICKER: '/api/private/upload-sticker',
    UPLOAD_AUDIO: '/api/private/upload-audio',
    UPLOAD_VIDEO: '/api/private/upload-video',
    SEND_MESSAGE: '/api/private/send-message',
    SEND_MESSAGE_ACTIONS: '/api/private/send-message-actions',
    SEND_MULTIPLE_INPUTS: '/api/private/send-multiple-inputs',
    GROUP_UPLOAD_FILE: '/api/groups/{groupId}/upload-file',
    GROUP_UPLOAD_IMAGE: '/api/groups/{groupId}/upload-image',
    GROUP_UPLOAD_STICKER: '/api/groups/{groupId}/upload-sticker',
    GROUP_UPLOAD_AUDIO: '/api/groups/{groupId}/upload-audio',
    GROUP_UPLOAD_VIDEO: '/api/groups/{groupId}/upload-video',
    GROUP_SEND_MESSAGE: '/api/groups/{groupId}/send-message',
    GROUP_SEND_MESSAGE_ACTIONS: '/api/groups/{groupId}/send-message-actions',
    GROUP_SEND_MULTIPLE_INPUTS: '/api/groups/{groupId}/send-multiple-inputs',
};

export const makeApiCall = async (endpoint: string, body?: FormData | Record<string, unknown>) => {
    try {
        const isFormData = body instanceof FormData;
        const options: RequestInit = {
            method: 'POST',
            body: isFormData ? body : JSON.stringify(body),
        };

        if (!isFormData) {
            options.headers = {
                'Content-Type': 'application/json',
            };
        }

        const baseURL = import.meta.env.VITE_SERVER_URL;
        const response = await fetch(`${baseURL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
};
