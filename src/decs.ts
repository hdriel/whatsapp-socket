import { type StringValue } from 'ms';

export type ButtonURL = { label: string; url: string };
export type ButtonCopy = { label: string; copy: string };
export type ButtonPhone = { label: string; tel: string };
export type ButtonEmail = { label: string; email: string };
export type ButtonReminder = { label: string; reminderName: string } & (
    | { reminderOn?: StringValue; reminderDate: number }
    | { reminderOn: StringValue; reminderDate?: number | Date | string }
);

export type ButtonParamsJson = {
    display_text: string;
    url?: string;
    copy_code?: string;
    phone_number?: string;
    email?: string;
    reminder_name?: string;
    reminder_timestamp?: number;
};

export type CallToActionButtons = Array<
    ButtonURL | ButtonCopy | ButtonPhone
    // ButtonEmail | ButtonReminder // not supported
>;

export type GroupMessageOptions = {
    mentions?: string[]; // phone numbers to mention
    replyToMessageId?: string;
};

export type CallToActionFullButtons = Array<ButtonURL | ButtonCopy | ButtonPhone | ButtonEmail | ButtonReminder>;

export type GroupParticipant = {
    id: string;
    admin?: 'admin' | 'superadmin' | null;
};

export type CreateGroupOptions = {
    name: string;
    participants?: string[]; // phone numbers
    description?: string;
};

export type UpdateGroupOptions = {
    name?: string;
    description?: string;
};

export type GroupSettingsType = 'announcement' | 'not_announcement' | 'locked' | 'unlocked';
