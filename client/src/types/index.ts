export interface ApiResponse {
    success: boolean;
    message?: string;
    data?: unknown;
}

export interface MessageAction {
    copyButton?: string;
    urlLink?: string;
    callAction?: string;
    email?: string;
}
