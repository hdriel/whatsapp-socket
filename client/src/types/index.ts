export interface ApiResponse {
    success: boolean;
    message?: string;
    data?: unknown;
}

export interface MessageAction {
    copyButton?: [string, string];
    urlLink?: [string, string];
    callTo?: [string, string];
    email?: [string, string];
    reminder?: [string, number];
}
