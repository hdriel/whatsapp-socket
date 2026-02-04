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
    | (TextMessageProps & { type: 'text' })
    | (MenuMessageProps & { type: 'menu' })
    | (ReplyMessage & { type: 'reply' })
    | (ButtonsMessageProps & { type: 'buttons' })
    | (SurveyMessageProps & { type: 'survey' })
    | (ImageMessageProps & { type: 'image' })
    | (VideoMessageProps & { type: 'video' })
    | (StickerMessageProps & { type: 'sticker' })
    | (AudioMessageProps & { type: 'audio' })
    | (DocumentMessageProps & { type: 'document' })
    | (LocationMessageProps & { type: 'location' });

type Scenario = {
    messages: Message[];
    response?: Record<
        string, // input or buttonId
        | {
              validation?: (input: any) => boolean;
              onSubmit?: (input: any) => void | Promise<void>;
              next?: Scenario;
          }
        | undefined
    >;
};

export type BotSchema = {
    name?: string;
    description?: string;
    idleTimeout?: number;
    exitCode?: string;
    backCode?: string;
    matches?: (string | RegExp)[];
    scenario?: Scenario;
};
