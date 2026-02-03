import type { Logger } from 'stack-trace-logger';
import type { WASocket } from '@fadzzzslebew/baileys';
import type { SurveyMessageProps } from './messages.decs.ts';

export async function sendSurveyMessage(
    { debug, logger, socket }: { debug?: boolean; logger?: Logger; socket: WASocket | null },
    jid: string,
    { question, options, allowMultipleAnswers = false }: SurveyMessageProps
): Promise<any> {
    if (!question || !options || options.length < 2) {
        throw new Error('sendSurveyMessage: question and at least 2 options are required.');
    }

    if (options.length > 12) {
        throw new Error('sendSurveyMessage: maximum 12 options allowed.');
    }

    const pollOptions = options;

    if (debug) {
        logger?.debug('WHATSAPP', 'send survey message', {
            jid,
            question,
            options: pollOptions,
            allowMultipleAnswers,
        });
    }

    return socket?.sendMessage(jid, {
        poll: {
            name: question,
            values: pollOptions,
            selectableCount: allowMultipleAnswers ? options.length : 1,
        },
    });
}
