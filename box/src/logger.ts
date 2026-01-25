import pino from "pino";
import { config } from "./config.js";

// Logger
export const logger = pino({
    level: config.logLevel,
    transport: config.logLevel === 'debug' ? { target: 'pino-pretty' } : undefined
});
