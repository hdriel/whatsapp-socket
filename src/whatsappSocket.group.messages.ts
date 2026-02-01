import { WhatsappSocketGroups, type WhatsappSocketGroupsProps } from './whatsappSocket.group.management';
import type { CallToActionButtons, MessageOptions } from './decs';
import Stream from 'node:stream';
import {
    sendButtonsMessage,
    sendSurveyMessage,
    sendTextMessage,
    sendReplyMessage,
    sendListMessage,
    sendLocationMessage,
    sendAudioMessage,
    sendImageMessage,
    sendVideoMessage,
    sendStickerMessage,
    sendFileMessage,
    sendDocumentMessage,
    sendDeleteMessage,
    sendReactionMessage,
} from './messages';

export type { WhatsappSocketGroupsProps as WhatsappSocketGroupMessagesProps } from './whatsappSocket.group.management';

export class WhatsappSocketGroupMessages extends WhatsappSocketGroups {
    constructor(props: WhatsappSocketGroupsProps) {
        super(props);
    }

    /**
     * Send message mentioning all group participants
     */
    async sendMentionAll(groupId: string, text: string): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        // Get all group participants
        const groupMetadata = await this.getGroupMetadata(formattedGroupId);
        if (!groupMetadata) {
            throw new Error('Could not fetch group metadata');
        }

        const groupParticipants = groupMetadata.participants.map((p) => p.id);

        return sendTextMessage(baseProps, formattedGroupId, { text, mentions: groupParticipants });
    }

    /**
     * Send reaction to a message in group
     */
    async sendReactionMessage(groupId: string, messageId: string, emoji: string): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendReactionMessage(baseProps, formattedGroupId, { messageId, emoji });
    }

    /**
     * Delete a message in group (only works for own messages)
     */
    async deleteGroupMessage(groupId: string, messageId: string): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendDeleteMessage(baseProps, formattedGroupId, { messageId });
    }

    /**
     * Send text message to group
     */
    async sendTextMessage(groupId: string, text: string): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendTextMessage(baseProps, formattedGroupId, { text });
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
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendButtonsMessage(baseProps, formattedGroupId, { subtitle, title, buttons });
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
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendReplyMessage(baseProps, formattedGroupId, {
            subtitle,
            title,
            buttons,
            mentions: mentions?.map((phone) => WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)),
        });
    }

    async sendListMessage(
        groupId: string,
        {
            title,
            subtitle,
            buttonText,
            sections,
        }: {
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
        }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendListMessage(baseProps, formattedGroupId, { subtitle, title, sections, buttonText });
    }

    /**
     * Send location to group
     */
    async sendLocationMessage(
        groupId: string,
        {
            latitude,
            longitude,
            name,
            address,
        }: {
            latitude: number;
            longitude: number;
            name?: string;
            address?: string;
        }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendLocationMessage(baseProps, formattedGroupId, { latitude, longitude, name, address });
    }

    async sendSurveyMessage(
        groupId: string,
        {
            question,
            options,
            allowMultipleAnswers = false,
        }: { question: string; options: string[]; allowMultipleAnswers?: boolean }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendSurveyMessage(baseProps, formattedGroupId, { options, question, allowMultipleAnswers });
    }

    /**
     * Send image to group
     */
    async sendImageMessage(
        groupId: string,
        imageSrc: string | Buffer | Stream,
        { caption = '', filename, mentions }: MessageOptions & { caption?: string; filename?: string } = {}
    ): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendImageMessage(baseProps, formattedGroupId, imageSrc, {
            caption,
            filename,
            mentions: mentions?.map((phone) => WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)),
        });
    }

    /**
     * Send video to group
     */
    async sendVideoMessage(
        groupId: string,
        videoSrc: string | Buffer | Stream,
        {
            caption = '',
            filename,
            sendAsGifPlayback = false,
            mentions,
        }: MessageOptions & {
            caption?: string;
            filename?: string;
            sendAsGifPlayback?: boolean;
        } = {}
    ): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendVideoMessage(baseProps, formattedGroupId, videoSrc, {
            caption,
            filename,
            sendAsGifPlayback,
            mentions: mentions?.map((phone) => WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)),
        });
    }

    /**
     * Send audio to group
     */
    async sendAudioMessage(
        groupId: string,
        audioSrc: string | Buffer | Stream,
        {
            filename,
            mimetype,
            seconds,
            ptt = false,
            mentions,
        }: {
            filename?: string;
            replyToMessageId?: string;
            mimetype?: string;
            seconds?: number;
            ptt?: boolean;
            mentions?: string[];
        } = {}
    ): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendAudioMessage(baseProps, formattedGroupId, audioSrc, {
            filename,
            mimetype,
            seconds,
            ptt,
            mentions: mentions?.map((phone) => WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)),
        });
    }

    /**
     * Send document to group
     */
    async sendDocumentMessage(
        groupId: string,
        documentSrc: string | Buffer | Stream,
        {
            fileName,
            caption,
            mimetype,
            jpegThumbnail,
            mentions,
        }: {
            fileName: string;
            caption?: string;
            mimetype?: string;
            jpegThumbnail?: Buffer;
            mentions?: string[];
        }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendDocumentMessage(baseProps, formattedGroupId, documentSrc, {
            filename: fileName,
            caption,
            mimetype,
            jpegThumbnail,
            mentions: mentions?.map((phone) => WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)),
        });
    }

    /**
     * Send sticker to group
     * Requirements:
     * * format .webp
     * * imageSize 512px x 512px
     * * maxSize: 100kb
     * * transparent background
     */
    async sendStickerMessage(
        groupId: string,
        imageSrc: string | Buffer | Stream,
        { mentions }: { mentions?: string[] } = {}
    ): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendStickerMessage(baseProps, formattedGroupId, imageSrc, {
            mentions: mentions?.map((phone) => WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)),
        });
    }

    async sendFileMessage(
        groupId: string,
        fileSrc: string | Buffer | Stream,
        {
            caption = '',
            mimetype,
            jpegThumbnailSrc,
            autoMessageClassification = true,
            filename,
            mentions,
        }: {
            caption?: string;
            mimetype?: string;
            filename: string;
            autoMessageClassification?: boolean;
            jpegThumbnailSrc?: string | Buffer | Stream;
            mentions?: string[];
        }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const baseProps = { socket: this.socket, debug: this.debug, logger: this.logger };

        return sendFileMessage(baseProps, formattedGroupId, fileSrc, {
            caption,
            mimetype,
            jpegThumbnailSrc,
            autoMessageClassification,
            filename,
            mentions: mentions?.map((phone) => WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)),
        });
    }
}
