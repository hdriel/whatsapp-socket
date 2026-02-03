import type {
    MenuMessageProps,
    ReplyMessageProps,
    TextMessageProps,
    ButtonsMessageProps,
} from './messages/messages.decs.ts';

type TextMessage = TextMessageProps;
type MenuMessage = { menu: MenuMessageProps };
type ReplyMessage = Omit<ReplyMessageProps, 'buttons'> & { buttons: Array<{ id: number | string; label: string }> };
type ButtonsMessage = ButtonsMessageProps;

type Message = TextMessage | MenuMessage | ReplyMessage | ButtonsMessage;

type Scenario = {
    messages: Message[];
    response: Record<
        string,
        {
            validation: (input: any) => boolean;
            onSubmit: (input: any) => void | Promise<void>;
            next: Scenario;
        }
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
