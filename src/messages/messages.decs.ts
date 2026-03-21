import type { CallToActionButtons } from '../decs.ts';
import Stream from 'node:stream';

export type MenuMessageProps = {
    title: string;
    subtitle?: string;
    buttonText: string;
    sections: Array<{
        title: string;
        rows: Array<{
            id: string;
            title: string;
            description?: string;
        }>;
    }>;
};

export type AudioMessageProps = {
    filename?: string;
    replyToMessageId?: string;
    mimetype?: string;
    seconds?: number;
    ptt?: boolean;
    mentions?: string[];
};

export type ButtonsMessageProps = {
    title: string;
    subtitle?: string;
    buttons: CallToActionButtons;
};

export type DocumentMessageProps = {
    filename?: string;
    caption?: string;
    mimetype?: string;
    mentions?: string[];
    jpegThumbnail?: Buffer | string;
};

export type FileMessageProps = {
    caption?: string;
    mimetype?: string;
    filename: string;
    autoMessageClassification?: boolean;
    jpegThumbnailSrc?: string | Buffer<any> | Stream;
    mentions?: string[];
};

export type ImageMessageProps = { caption?: string; filename?: string; mentions?: string[] };

export type ReactionMessageProps = { messageId: string; emoji: string };

export type ReplyMessageProps = {
    title: string;
    subtitle?: string;
    buttons: Array<string | { id: number | string; label: string }>;
};

export type SurveyMessageProps = {
    question: string;
    options: string[];
    allowMultipleAnswers?: boolean;
};

export type TextMessageProps = { text: string };

export type VideoMessageProps = {
    caption?: string;
    sendAsGifPlayback?: boolean;
    filename?: string;
    mentions?: string[];
};

export type LocationMessageProps = {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
};

export type StickerMessageProps = { mentions?: string[] };
