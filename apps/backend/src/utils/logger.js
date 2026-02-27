import winston from "winston";
import path from "path";
import fs from "fs";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const auditLogFormat = winston.format.printf(
  ({ timestamp, level, message, ...metadata }) => {
    const {
      userId,
      action,
      entityType,
      entityId,
      ipAddress,
      metadata: extraMetadata,
    } = metadata;

    return JSON.stringify({
      timestamp,
      level,
      userId,
      action,
      entityType,
      entityId,
      ipAddress,
      metadata: extraMetadata,
      message,
    });
  }
);

export const auditLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), auditLogFormat),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "auditlogs.log"),
      level: "info",
    }),
  ],
});

export const loginLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "loginLogs.log"),
      format: winston.format.combine(winston.format.json()),
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export default loginLogger;
