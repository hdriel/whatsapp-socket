import { type MiscMessageGenerationOptions, generateWAMessageFromContent } from '@fadzzzslebew/baileys';
import { WAProto as proto } from '@fadzzzslebew/baileys';
import { WhatsappSocketGroups, type WhatsappSocketGroupsProps } from './whatsappSocket.group.management';
import type {
    ButtonURL,
    ButtonCopy,
    ButtonPhone,
    ButtonParamsJson,
    CallToActionButtons,
    GroupMessageOptions,
} from './decs';

export type { WhatsappSocketGroupsProps as WhatsappSocketGroupMessagesProps } from './whatsappSocket.group.management';

export class WhatsappSocketGroupMessages extends WhatsappSocketGroups {
    constructor(props: WhatsappSocketGroupsProps) {
        super(props);
    }

    /**
     * Send text message to group
     */
    async sendTextMessage(groupId: string, text: string, options?: GroupMessageOptions): Promise<any> {
        if (!groupId || !text) {
            throw new Error('sendTextMessage: Group ID and text are required.');
        }
        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const messageOptions: MiscMessageGenerationOptions = {};

        // // Add mentions if provided
        // if (options?.mentions?.length) {
        //     const formattedMentions = options.mentions.map((phone) =>
        //         WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)
        //     );
        //     messageOptions.mentions = formattedMentions;
        // }

        // Add reply if provided
        if (options?.replyToMessageId) {
            messageOptions.quoted = { key: { id: options.replyToMessageId } };
        }

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending text message to group', {
                groupId: formattedGroupId,
                textLength: text.length,
                hasMentions: !!options?.mentions?.length,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, { text }, messageOptions);
    }

    /**
     * Send buttons message to group
     */
    async sendButtonsMessage(
        groupId: string,
        {
            title,
            subtitle,
            buttons,
        }: {
            title: string;
            subtitle?: string;
            buttons: CallToActionButtons;
        }
    ): Promise<any> {
        if (!groupId || !title || !buttons?.length) {
            throw new Error('sendButtonsMessage: Group ID, title, and buttons are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);

        const buttonsValue = buttons
            ?.map((btn) => {
                const buttonParamsJson: ButtonParamsJson = { display_text: btn.label };

                let name: string;
                switch (true) {
                    case !!(btn as ButtonURL).url:
                        name = 'cta_url';
                        buttonParamsJson.url = (btn as ButtonURL).url;
                        break;
                    case !!(btn as ButtonCopy).copy:
                        name = 'cta_copy';
                        buttonParamsJson.copy_code = (btn as ButtonCopy).copy;
                        break;
                    case !!(btn as ButtonPhone).tel:
                        name = 'cta_call';
                        buttonParamsJson.phone_number = (btn as ButtonPhone).tel;
                        break;
                    default:
                        name = '';
                        break;
                }

                return { name, buttonParamsJson: JSON.stringify(buttonParamsJson) };
            })
            .filter((v) => v.name);

        const msg = generateWAMessageFromContent(
            formattedGroupId,
            {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body: proto.Message.InteractiveMessage.Body.create({ text: title }),
                            ...(subtitle && {
                                footer: proto.Message.InteractiveMessage.Footer.create({ text: subtitle }),
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons: buttonsValue,
                            }),
                        }),
                    },
                },
            },
            { userJid: formattedGroupId }
        );

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending buttons message to group', {
                groupId: formattedGroupId,
                title,
                buttonsCount: buttonsValue.length,
            });
        }

        return this.socket?.relayMessage(formattedGroupId, msg.message!, { messageId: msg.key.id! });
    }

    /**
     * Send reply buttons message to group
     */
    async sendReplyButtonsMessage(
        groupId: string,
        {
            title,
            subtitle,
            buttons,
            mentions,
        }: {
            title: string;
            subtitle?: string;
            buttons: Array<string | { id: number | string; label: string }>;
            mentions?: string[];
        }
    ): Promise<any> {
        if (!groupId || !title || !buttons?.length) {
            throw new Error('sendReplyButtonsMessage: Group ID, title, and buttons are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);

        const buttonsValue = buttons
            .filter((v) => v)
            .map((btn, index) =>
                typeof btn === 'string'
                    ? { buttonId: `id-${index}`, buttonText: { displayText: btn }, type: 1 }
                    : { buttonId: `${btn.id}`, buttonText: { displayText: btn.label }, type: 1 }
            );

        const messageOptions: any = {
            text: title,
            buttons: buttonsValue,
            ...(subtitle && { footer: subtitle }),
        };

        if (mentions?.length) {
            messageOptions.mentions = mentions.map((phone) =>
                WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)
            );
        }

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending reply buttons message to group', {
                groupId: formattedGroupId,
                title,
                buttonsCount: buttonsValue.length,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, messageOptions);
    }

    /**
     * Send image to group
     */
    async sendImageMessage(
        groupId: string,
        imageBuffer: Buffer, // todo: handle also stream and string url
        { caption, mentions }: GroupMessageOptions & { caption?: string } = {}
    ): Promise<any> {
        if (!groupId || !imageBuffer) {
            throw new Error('sendImage: Group ID and image buffer are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const messageOptions: any = { image: imageBuffer, ...(caption && { caption }) };

        if (mentions?.length) {
            messageOptions.mentions = mentions.map((phone) =>
                WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)
            );
        }

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending image to group', {
                groupId: formattedGroupId,
                hasCaption: !!caption,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, messageOptions);
    }

    /**
     * Send video to group
     */
    async sendVideoMessage(
        groupId: string,
        videoBuffer: Buffer, // todo: handle also stream and string url
        caption?: string,
        options?: GroupMessageOptions
    ): Promise<any> {
        if (!groupId || !videoBuffer) {
            throw new Error('sendVideo: Group ID and video buffer are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const messageOptions: any = { video: videoBuffer, ...(caption && { caption }) };

        if (options?.mentions?.length) {
            messageOptions.mentions = options.mentions.map((phone) =>
                WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)
            );
        }

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending video to group', {
                groupId: formattedGroupId,
                hasCaption: !!caption,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, messageOptions);
    }

    /**
     * Send audio to group
     */
    async sendAudioMessage(
        groupId: string,
        audioBuffer: Buffer, // todo: handle also stream and string url
        options?: { ptt?: boolean; mentions?: string[] }
    ): Promise<any> {
        if (!groupId || !audioBuffer) {
            throw new Error('sendAudio: Group ID and audio buffer are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const messageOptions: any = {
            audio: audioBuffer,
            ptt: options?.ptt ?? false, // PTT = Push To Talk (voice message)
        };

        if (options?.mentions?.length) {
            messageOptions.mentions = options.mentions.map((phone) =>
                WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)
            );
        }

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending audio to group', {
                groupId: formattedGroupId,
                isPTT: messageOptions.ptt,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, messageOptions);
    }

    /**
     * Send document to group
     */
    async sendDocumentMessage(
        groupId: string,
        documentBuffer: Buffer, // todo: handle also stream and string url
        fileName: string,
        mimeType?: string,
        options?: GroupMessageOptions
    ): Promise<any> {
        if (!groupId || !documentBuffer || !fileName) {
            throw new Error('sendDocument: Group ID, document buffer, and fileName are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const messageOptions: any = {
            document: documentBuffer,
            fileName,
            ...(mimeType && { mimetype: mimeType }),
        };

        if (options?.mentions?.length) {
            messageOptions.mentions = options.mentions.map((phone) =>
                WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)
            );
        }

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending document to group', {
                groupId: formattedGroupId,
                fileName,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, messageOptions);
    }

    /**
     * Send location to group
     */
    async sendLocationMessage(
        groupId: string,
        position: { latitude: number; longitude: number },
        name?: string,
        address?: string
    ): Promise<any> {
        const { longitude, latitude } = position;
        if (!groupId || latitude === undefined || longitude === undefined) {
            throw new Error('sendLocation: Group ID, latitude, and longitude are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending location to group', {
                groupId: formattedGroupId,
                latitude,
                longitude,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, {
            location: {
                degreesLatitude: latitude,
                degreesLongitude: longitude,
                ...(name && { name }),
                ...(address && { address }),
            },
        });
    }

    /**
     * Send message mentioning all group participants
     */
    async sendMentionAll(groupId: string, text: string): Promise<any> {
        if (!groupId || !text) {
            throw new Error('sendMentionAll: Group ID and text are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);

        // Get all group participants
        const groupMetadata = await this.getGroupMetadata(formattedGroupId);
        if (!groupMetadata) {
            throw new Error('Could not fetch group metadata');
        }

        const participants = groupMetadata.participants.map((p) => p.id);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending mention all message to group', {
                groupId: formattedGroupId,
                participantsCount: participants.length,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, {
            text,
            mentions: participants,
        });
    }

    /**
     * Send reaction to a message in group
     */
    async sendReactionMessage(groupId: string, messageId: string, emoji: string): Promise<any> {
        if (!groupId || !messageId || !emoji) {
            throw new Error('sendReaction: Group ID, message ID, and emoji are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending reaction to group message', {
                groupId: formattedGroupId,
                messageId,
                emoji,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, {
            react: {
                text: emoji,
                key: { id: messageId, remoteJid: formattedGroupId },
            },
        });
    }

    /**
     * Delete a message in group (only works for own messages)
     */
    async deleteGroupMessage(groupId: string, messageId: string): Promise<any> {
        if (!groupId || !messageId) {
            throw new Error('deleteGroupMessage: Group ID and message ID are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Deleting message in group', {
                groupId: formattedGroupId,
                messageId,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, {
            delete: {
                id: messageId,
                remoteJid: formattedGroupId,
                fromMe: true,
            },
        });
    }

    async sendSurveyMessage(
        groupId: string,
        question: string,
        options: string[],
        allowMultipleAnswers = false
    ): Promise<any> {
        if (!groupId || !question || !options || options.length < 2) {
            throw new Error('sendSurveyMessage: question and at least 2 options are required.');
        }

        if (options.length > 12) {
            throw new Error('sendSurveyMessage: maximum 12 options allowed.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const pollOptions = options;

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'send survey message', {
                groupId: formattedGroupId,
                question,
                options: pollOptions,
                allowMultipleAnswers,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, {
            poll: {
                name: question,
                values: pollOptions,
                selectableCount: allowMultipleAnswers ? options.length : 1,
            },
        });
    }
}
