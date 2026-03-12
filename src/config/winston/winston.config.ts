import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = winston.format;
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';
const effectiveLogLevel = process.env.LOG_LEVEL || (isProduction ? 'error' : 'info');
const enableConsole =
  process.env.LOG_CONSOLE === 'true' ||
  (process.env.LOG_CONSOLE !== 'false' && nodeEnv === 'development');
const writeLogsToFiles = process.env.LOG_TO_FILE === 'true';

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, context, ...metadata }) => {
  let msg = `${String(timestamp)} [${String(level)}]`;
  if (context) {
    msg += ` [${context as string}]`;
  }
  msg += `: ${String(message)}`;
  if (stack) {
    msg += `\n${stack as string}`;
  }
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Daily rotate file transport for errors
const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/error/%DATE%-error.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '14d',
  level: 'error',
});

// Daily rotate file transport for combined logs
const combinedFileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/combined/%DATE%-combined.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '14d',
});

// Console transport
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat,
  ),
});

export const winstonConfig: WinstonModuleOptions = {
  level: effectiveLogLevel,
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  transports: [
    ...(enableConsole ? [consoleTransport] : []),
    ...(!isTest && writeLogsToFiles ? [errorFileTransport, combinedFileTransport] : []),
  ],
  exceptionHandlers: writeLogsToFiles
    ? [new winston.transports.File({ filename: 'logs/exceptions.log' })]
    : [new winston.transports.Console()],
  rejectionHandlers: writeLogsToFiles
    ? [new winston.transports.File({ filename: 'logs/rejections.log' })]
    : [new winston.transports.Console()],
};
