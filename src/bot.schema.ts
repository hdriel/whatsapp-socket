import { type StringValue } from 'ms';
import type {
    MenuMessageProps,
    ReplyMessageProps,
    TextMessageProps,
    ButtonsMessageProps,
    SurveyMessageProps,
    ImageMessageProps,
    VideoMessageProps,
    StickerMessageProps,
    AudioMessageProps,
    DocumentMessageProps,
    LocationMessageProps,
} from './messages/messages.decs.ts';

type ReplyMessage = Omit<ReplyMessageProps, 'buttons'> & { buttons: Array<{ id: number | string; label: string }> };

export type Message =
    | { forceExit?: boolean; text: TextMessageProps }
    | { forceExit?: boolean; menu: MenuMessageProps }
    | { forceExit?: boolean; reply: ReplyMessage }
    | { forceExit?: boolean; buttons: ButtonsMessageProps }
    | { forceExit?: boolean; survey: SurveyMessageProps }
    | { forceExit?: boolean; image: ImageMessageProps }
    | { forceExit?: boolean; video: VideoMessageProps }
    | { forceExit?: boolean; sticker: StickerMessageProps }
    | { forceExit?: boolean; audio: AudioMessageProps }
    | { forceExit?: boolean; document: DocumentMessageProps }
    | { forceExit?: boolean; location: LocationMessageProps };

export type ScenarioResponse = {
    field?: string;
    validate?: (input: string) => boolean;
    validationError?: string | ((input?: string) => string);
    onSubmit?: (values: { messageId: string; options?: any; data?: any; remoteJid: string }) => void | Promise<void>;
    next?: Scenario;
};

export type MessageCB = (remoteJid: string, dataFlow: any) => Message | Promise<Message>;
export type MessageItem = MessageCB | Message;
export type Scenario = {
    messages: MessageItem[];
    response?: Record<
        string, // input or buttonId
        ScenarioResponse | undefined
    >;
};

export type BotSchema = {
    name?: string;
    description?: string;
    exitCode?: string;
    exitMsg?: Message;
    idleTimeout?: StringValue | number;
    timeoutMsg?: Message;
    backCode?: string;
    matches?: (
        | string
        | RegExp
        | ((remoteJid: string, textMsg: string, fromMe?: boolean) => boolean | Promise<boolean>)
    )[];
    flow?: Scenario;
};
