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
