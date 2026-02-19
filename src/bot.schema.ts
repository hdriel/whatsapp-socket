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
    | { timeout?: StringValue | number; forceExit?: boolean; text: TextMessageProps }
    | { timeout?: StringValue | number; forceExit?: boolean; menu: MenuMessageProps }
    | { timeout?: StringValue | number; forceExit?: boolean; reply: ReplyMessage }
    | { timeout?: StringValue | number; forceExit?: boolean; buttons: ButtonsMessageProps }
    | { timeout?: StringValue | number; forceExit?: boolean; survey: SurveyMessageProps }
    | { timeout?: StringValue | number; forceExit?: boolean; image: ImageMessageProps }
    | { timeout?: StringValue | number; forceExit?: boolean; video: VideoMessageProps }
    | { timeout?: StringValue | number; forceExit?: boolean; sticker: StickerMessageProps }
    | { timeout?: StringValue | number; forceExit?: boolean; audio: AudioMessageProps }
    | { timeout?: StringValue | number; forceExit?: boolean; document: DocumentMessageProps }
    | { timeout?: StringValue | number; forceExit?: boolean; location: LocationMessageProps };

export type ScenarioResponse = {
    field?: string;
    parseFieldData?: (input: string) => any;
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
    unknownInputMsg?: Message;
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
