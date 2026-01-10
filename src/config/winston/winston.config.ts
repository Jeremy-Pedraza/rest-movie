import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, context, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  if (context) {
    msg += ` [${context}]`;
  }
  msg += `: ${message}`;
  if (stack) {
    msg += `\n${stack}`;
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
  level: process.env.LOG_LEVEL || 'debug',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  transports: [
    consoleTransport,
    ...(process.env.NODE_ENV !== 'test' ? [errorFileTransport, combinedFileTransport] : []),
  ],
  exceptionHandlers: [new winston.transports.File({ filename: 'logs/exceptions.log' })],
  rejectionHandlers: [new winston.transports.File({ filename: 'logs/rejections.log' })],
};
