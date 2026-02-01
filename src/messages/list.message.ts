import { WAProto as proto, type WASocket, generateWAMessageFromContent } from '@fadzzzslebew/baileys';
import type { Logger } from 'stack-trace-logger';

export async function sendListMessage(
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
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
    if (!title || !buttonText || !sections || sections.length === 0) {
        throw new Error('sendListMessage: title, buttonText, and sections are required.');
    }

    const msg = generateWAMessageFromContent(
        jid,
        {
            viewOnceMessage: {
                message: {
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({ text: title }),
                        ...(subtitle && {
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: subtitle }),
                        }),
                        header: proto.Message.InteractiveMessage.Header.create({
                            title: buttonText,
                            hasMediaAttachment: false,
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: [
                                {
                                    name: 'single_select',
                                    buttonParamsJson: JSON.stringify({
                                        title: buttonText,
                                        sections: sections.map((section) => ({
                                            title: section.title,
                                            rows: section.rows.map((row) => ({
                                                header: row.title,
                                                title: row.title,
                                                description: row.description || '',
                                                id: row.id,
                                            })),
                                        })),
                                    }),
                                },
                            ],
                        }),
                    }),
                },
            },
        },
        { userJid: jid }
    );

    if (debug) {
        logger?.debug('WHATSAPP', 'send list message', {
            jid,
            title,
            buttonText,
            sectionsCount: sections.length,
            totalRows: sections.reduce((acc, s) => acc + s.rows.length, 0),
        });
    }

    return socket?.relayMessage(jid, msg.message!, { messageId: msg.key.id! });
}
