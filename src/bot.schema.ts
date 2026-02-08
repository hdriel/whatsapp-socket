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

type Message =
    | { text: TextMessageProps }
    | { menu: MenuMessageProps }
    | { reply: ReplyMessage }
    | { buttons: ButtonsMessageProps }
    | { survey: SurveyMessageProps }
    | { image: ImageMessageProps }
    | { video: VideoMessageProps }
    | { sticker: StickerMessageProps }
    | { audio: AudioMessageProps }
    | { document: DocumentMessageProps }
    | { location: LocationMessageProps };

export type ScenarioResponse = {
    validate?: (input: string) => boolean;
    validationError?: string | ((input?: string) => string);
    onSubmit?: (messageId: string, options?: any) => void | Promise<void>;
    next?: Scenario;
};

export type Scenario = {
    messages: Message[];
    response?: Record<
        string, // input or buttonId
        ScenarioResponse | undefined
    >;
};

export type BotSchema = {
    name?: string;
    description?: string;
    idleTimeout?: StringValue | number;
    exitCode?: string;
    backCode?: string;
    matches?: (string | RegExp)[];
    flow?: Scenario;
};
