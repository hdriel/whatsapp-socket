import React from 'react';

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

export interface Group {
    id: string; // '120363423282807100@g.us';
    addressingMode: string; // 'lid';
    subject: string; // 'st-logger';
    subjectOwner: string; // '972500000000@s.whatsapp.net';
    subjectOwnerLid: string; // '150081944713026@lid';
    subjectTime: number; // 1767217700;
    size: number; // 1;
    creation: number; // 1767217700;
    owner: string; // '972500000000@s.whatsapp.net';
    ownerLid: string; // '150081944713026@lid';
    descOwner: string; // '';
    descOwnerLid: string; // '';
    restrict: boolean; // false;
    announce: boolean; // false;
    isCommunity: boolean; // false;
    isCommunityAnnounce: boolean; // false;
    joinApprovalMode: boolean; // false;
    memberAddMode: boolean; // false;
    participants: Array<{
        id: string; // '150081944713026@lid';
        jid: string; // '972500000000@s.whatsapp.net';
        admin: string; // 'superadmin';
    }>;
}

export interface TabType {
    label: string;
    Component: React.FC;
    init?: boolean;
    group?: boolean;
    phone?: boolean;
    aws?: boolean;
}
