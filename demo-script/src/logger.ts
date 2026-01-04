import { Logger, LOGGER_LEVEL } from 'stack-trace-logger';

const logger = new Logger({
    runLocally: true,
    loggingModeLevel: LOGGER_LEVEL.SILLY,
    serviceName: 'TEST',
});

export default logger;
