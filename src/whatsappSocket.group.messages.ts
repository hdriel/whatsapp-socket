import { WhatsappSocketGroups, type WhatsappSocketGroupsProps } from './whatsappSocket.group.management';
import type { CallToActionButtons, MessageOptions } from './decs';
import Stream from 'node:stream';
import { getAudioFileDuration, getFilenameFromStream, getUrlBuffer, MIME_TO_TYPES, streamToBuffer } from './helpers.ts';
import { basename } from 'node:path';
import { ReadStream } from 'node:fs';
import {
    sendButtonsMessage,
    sendSurveyMessage,
    sendTextMessage,
    sendReplyMessage,
    sendListMessage,
    sendLocationMessage,
} from './messages';

export type { WhatsappSocketGroupsProps as WhatsappSocketGroupMessagesProps } from './whatsappSocket.group.management';

export class WhatsappSocketGroupMessages extends WhatsappSocketGroups {
    constructor(props: WhatsappSocketGroupsProps) {
        super(props);
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
        if (!groupId || !imageSrc) {
            throw new Error('sendImageMessage: Group ID and image source are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const imageBuffer =
            typeof imageSrc === 'string'
                ? await getUrlBuffer(imageSrc)
                : imageSrc instanceof Stream
                  ? await streamToBuffer(imageSrc)
                  : imageSrc;

        const decodedFilename = filename && decodeURIComponent(filename);

        const messageOptions: any = {
            image: imageBuffer,
            ...(caption && { caption }),
            ...(decodedFilename && { filename: decodedFilename }),
        };

        if (mentions?.length) {
            messageOptions.mentions = mentions.map((phone) =>
                WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)
            );
        }

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending image to group', {
                groupId: formattedGroupId,
                hasCaption: !!caption,
                filename: decodedFilename,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, messageOptions);
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
            sendAsGifPlayback: gifPlayback = false,
            mentions,
        }: MessageOptions & {
            caption?: string;
            filename?: string;
            sendAsGifPlayback?: boolean;
        } = {}
    ): Promise<any> {
        if (!groupId || !videoSrc) {
            throw new Error('sendVideoMessage: Group ID and video source are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const videoBuffer =
            typeof videoSrc === 'string'
                ? await getUrlBuffer(videoSrc)
                : videoSrc instanceof Stream
                  ? await streamToBuffer(videoSrc)
                  : videoSrc;

        const decodedFilename = filename && decodeURIComponent(filename);

        const messageOptions: any = {
            video: videoBuffer,
            ...(caption && { caption }),
            gifPlayback,
            ...(decodedFilename && { filename: decodedFilename }),
        };

        if (mentions?.length) {
            messageOptions.mentions = mentions.map((phone) =>
                WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)
            );
        }

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending video to group', {
                groupId: formattedGroupId,
                hasCaption: !!caption,
                filename: decodedFilename,
                gifPlayback,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, messageOptions);
    }

    /**
     * Send audio to group
     */
    async sendAudioMessage(
        groupId: string,
        audioSrc: string | Buffer | Stream,
        {
            filename,
            replyToMessageId,
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
        if (!groupId || !audioSrc) {
            throw new Error('sendAudioMessage: Group ID and audio source are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const audioBuffer =
            typeof audioSrc === 'string'
                ? await getUrlBuffer(audioSrc)
                : audioSrc instanceof Stream
                  ? await streamToBuffer(audioSrc)
                  : audioSrc;

        let durationInSeconds =
            seconds || (await getAudioFileDuration(audioBuffer as unknown as ReadStream, mimetype).catch(() => 0));

        const decodedFilename = filename && decodeURIComponent(filename);

        const messageOptions: any = {
            audio: audioBuffer,
            ptt, // PTT = Push To Talk (voice message)
            ...(decodedFilename && { filename: decodedFilename }),
            ...(mimetype && { mimetype }),
            ...(durationInSeconds && { seconds: durationInSeconds }),
        };

        if (mentions?.length) {
            messageOptions.mentions = mentions.map((phone) =>
                WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)
            );
        }

        const quotedOptions: any = {};
        if (replyToMessageId) {
            quotedOptions.quoted = { key: { id: replyToMessageId } };
        }

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending audio to group', {
                groupId: formattedGroupId,
                isPTT: ptt,
                mimetype,
                filename: decodedFilename,
                seconds: durationInSeconds,
                replyToMessageId,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, messageOptions, quotedOptions);
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
            replyToMessageId,
            jpegThumbnail,
            mentions,
        }: {
            fileName: string;
            caption?: string;
            mimetype?: string;
            replyToMessageId?: string;
            jpegThumbnail?: Buffer;
            mentions?: string[];
        }
    ): Promise<any> {
        if (!groupId || !documentSrc || !fileName) {
            throw new Error('sendDocumentMessage: Group ID, document source, and fileName are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const documentBuffer =
            typeof documentSrc === 'string'
                ? await getUrlBuffer(documentSrc)
                : documentSrc instanceof Stream
                  ? await streamToBuffer(documentSrc)
                  : documentSrc;

        const decodedFilename = fileName && decodeURIComponent(fileName);

        const messageOptions: any = {
            document: documentBuffer,
            fileName: decodedFilename,
            ...(caption && { caption }),
            ...(mimetype && { mimetype }),
            ...(jpegThumbnail && { jpegThumbnail }),
        };

        if (mentions?.length) {
            messageOptions.mentions = mentions.map((phone) =>
                WhatsappSocketGroupMessages.formatPhoneNumberToWhatsappPattern(phone)
            );
        }

        const quotedOptions: any = {};
        if (replyToMessageId) {
            quotedOptions.quoted = { key: { id: replyToMessageId } };
        }

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'Sending document to group', {
                groupId: formattedGroupId,
                fileName: decodedFilename,
                mimetype,
                hasCaption: !!caption,
                hasThumbnail: !!jpegThumbnail,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, messageOptions, quotedOptions);
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
            throw new Error('sendReactionMessage: Group ID, message ID, and emoji are required.');
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

    /**
     * Send sticker to group
     * Requirements:
     * * format .webp
     * * imageSize 512px x 512px
     * * maxSize: 100kb
     * * transparent background
     */
    async sendStickerMessage(groupId: string, imageSrc: string | Buffer | Stream): Promise<any> {
        if (!groupId || !imageSrc) {
            throw new Error('sendStickerMessage: Group ID and image source are required.');
        }

        await this.ensureSocketConnected();

        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);
        const stickerBuffer =
            typeof imageSrc === 'string'
                ? await getUrlBuffer(imageSrc)
                : imageSrc instanceof Stream
                  ? await streamToBuffer(imageSrc)
                  : imageSrc;

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'send sticker message', {
                groupId: formattedGroupId,
            });
        }

        return this.socket?.sendMessage(formattedGroupId, { sticker: stickerBuffer });
    }

    async sendFileMessage(
        groupId: string,
        fileSrc: string | Buffer | Stream,
        {
            caption = '',
            mimetype,
            replyToMessageId,
            jpegThumbnailSrc,
            autoMessageClassification = true,
            filename,
        }: {
            caption?: string;
            mimetype?: string;
            filename: string;
            autoMessageClassification?: boolean;
            replyToMessageId?: string;
            jpegThumbnailSrc?: string | Buffer | Stream;
        }
    ): Promise<any> {
        await this.ensureSocketConnected();
        const formattedGroupId = WhatsappSocketGroupMessages.formatGroupId(groupId);

        let jpegThumbnailBuffer: Buffer | undefined;
        if (typeof jpegThumbnailSrc === 'string') {
            jpegThumbnailBuffer = await getUrlBuffer(jpegThumbnailSrc);
        } else if (jpegThumbnailSrc instanceof Stream) {
            jpegThumbnailBuffer = await streamToBuffer(jpegThumbnailSrc);
        } else {
            jpegThumbnailBuffer = jpegThumbnailSrc;
        }

        let fileBuffer: Buffer;
        if (typeof fileSrc === 'string') {
            fileBuffer = await getUrlBuffer(fileSrc);
            filename = filename || basename(fileSrc);
        } else if (fileSrc instanceof Stream) {
            fileBuffer = await streamToBuffer(fileSrc);
            const fname = getFilenameFromStream(fileSrc);
            if (fname) filename = fname;
        } else {
            fileBuffer = fileSrc;
        }

        filename = filename && decodeURIComponent(filename);
        mimetype ||= this.getMimetypeFromFilename(filename);
        mimetype = mimetype?.toLowerCase();

        if (this.debug) {
            this.logger?.debug('WHATSAPP', 'send file message', {
                groupId: formattedGroupId,
                caption,
                mimetype,
                filename,
                replyToMessageId,
                includeJpegThumbnail: !!jpegThumbnailBuffer,
            });
        }

        let sendSuccess = true;
        let response: any;
        if (autoMessageClassification) {
            switch (MIME_TO_TYPES[mimetype as string]) {
                case 'Image':
                    response = await this.sendImageMessage(formattedGroupId, fileBuffer, {
                        caption,
                        filename,
                    }).catch(() => (sendSuccess = false));
                    break;
                case 'Sticker':
                    response = await this.sendStickerMessage(formattedGroupId, fileBuffer).catch(
                        () => (sendSuccess = false)
                    );
                    break;
                case 'Video':
                    response = await this.sendVideoMessage(formattedGroupId, fileBuffer, {
                        caption,
                        filename,
                    }).catch(() => (sendSuccess = false));
                    break;
                case 'Audio':
                    response = await this.sendAudioMessage(formattedGroupId, fileBuffer, {
                        mimetype,
                        filename,
                        replyToMessageId,
                    }).catch(() => (sendSuccess = false));
                    break;
                default:
                    return await this.sendDocumentMessage(formattedGroupId, fileBuffer, {
                        fileName: filename,
                        caption,
                        mimetype,
                        replyToMessageId,
                        jpegThumbnail: jpegThumbnailBuffer,
                    });
            }
        }

        if (response && sendSuccess) return response;
        if (!autoMessageClassification || !sendSuccess) {
            return await this.sendDocumentMessage(formattedGroupId, fileBuffer, {
                fileName: filename,
                caption,
                mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                replyToMessageId,
                jpegThumbnail: jpegThumbnailBuffer,
            });
        }
    }
}
