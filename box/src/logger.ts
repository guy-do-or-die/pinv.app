import pino from "pino";
import { config } from "./config.js";

// Logger
export const logger = pino({
    level: config.logLevel,
});
