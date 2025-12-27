import ms, { type StringValue } from 'ms';

export const getTotalSeconds = (msValue: StringValue) => {
    const value = ms(msValue);
    return value / 1000;
};

export async function getUrlBuffer(url: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
}
