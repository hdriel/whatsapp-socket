import ms, { type StringValue } from 'ms';

export const sleep = (timeout: StringValue | number) => {
    return new Promise((resolve) => setTimeout(resolve, typeof timeout === 'number' ? timeout : ms(timeout)));
};
