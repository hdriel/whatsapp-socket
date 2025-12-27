export const API_ENDPOINTS = {
    GENERATE_QR: '/api/generate-qr',
    UPLOAD_FILE: '/api/upload-file',
    UPLOAD_IMAGE: '/api/upload-image',
    UPLOAD_AUDIO: '/api/upload-audio',
    UPLOAD_VIDEO: '/api/upload-video',
    SEND_MESSAGE: '/api/send-message',
    SEND_MESSAGE_ACTIONS: '/api/send-message-actions',
    SEND_MULTIPLE_INPUTS: '/api/send-multiple-inputs',
};

export const makeApiCall = async (endpoint: string, body: FormData | Record<string, unknown>) => {
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
