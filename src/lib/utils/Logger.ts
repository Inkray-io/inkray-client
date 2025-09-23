/**
 * Production-Safe Logging Utility
 * 
 * Provides conditional logging that can be disabled in production
 * while maintaining structured logging during development.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  component?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Set log level based on environment
    if (this.isDevelopment) {
      this.logLevel = LogLevel.DEBUG;
    } else {
      // In production, only log warnings and errors
      this.logLevel = LogLevel.WARN;
    }

    // Allow override via environment variable
    const envLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL;
    if (envLogLevel) {
      const level = LogLevel[envLogLevel.toUpperCase() as keyof typeof LogLevel];
      if (level !== undefined) {
        this.logLevel = level;
      }
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(level: LogLevel, message: string, data?: unknown, component?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      component
    };
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(-this.maxHistorySize);
    }
  }

  private formatMessage(entry: LogEntry): string {
    const prefix = entry.component ? `[${entry.component}]` : '';
    return `${prefix} ${entry.message}`;
  }

  /**
   * Debug level logging - only shown in development
   */
  debug(message: string, data?: unknown, component?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.createLogEntry(LogLevel.DEBUG, message, data, component);
    this.addToHistory(entry);

    if (this.isDevelopment) {
      if (data !== undefined) {
        console.log(`🔍 ${this.formatMessage(entry)}`, data);
      } else {
        console.log(`🔍 ${this.formatMessage(entry)}`);
      }
    }
  }

  /**
   * Info level logging
   */
  info(message: string, data?: unknown, component?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.createLogEntry(LogLevel.INFO, message, data, component);
    this.addToHistory(entry);

    if (this.isDevelopment) {
      if (data !== undefined) {
        console.log(`ℹ️ ${this.formatMessage(entry)}`, data);
      } else {
        console.log(`ℹ️ ${this.formatMessage(entry)}`);
      }
    }
  }

  /**
   * Warning level logging - shown in development and production
   */
  warn(message: string, data?: unknown, component?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.createLogEntry(LogLevel.WARN, message, data, component);
    this.addToHistory(entry);

    if (data !== undefined) {
      console.warn(`⚠️ ${this.formatMessage(entry)}`, data);
    } else {
      console.warn(`⚠️ ${this.formatMessage(entry)}`);
    }
  }

  /**
   * Error level logging - always shown
   */
  error(message: string, data?: unknown, component?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry = this.createLogEntry(LogLevel.ERROR, message, data, component);
    this.addToHistory(entry);

    if (data !== undefined) {
      console.error(`❌ ${this.formatMessage(entry)}`, data);
    } else {
      console.error(`❌ ${this.formatMessage(entry)}`);
    }
  }

  /**
   * Conditional logging based on development environment
   */
  devLog(message: string, data?: unknown, component?: string): void {
    if (this.isDevelopment) {
      this.debug(message, data, component);
    }
  }

  /**
   * Get log history for debugging
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Set log level programmatically
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Check if logging is enabled for a specific level
   */
  isEnabled(level: LogLevel): boolean {
    return this.shouldLog(level);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const log = {
  debug: (message: string, data?: unknown, component?: string) => 
    logger.debug(message, data, component),
  
  info: (message: string, data?: unknown, component?: string) => 
    logger.info(message, data, component),
  
  warn: (message: string, data?: unknown, component?: string) => 
    logger.warn(message, data, component),
  
  error: (message: string, data?: unknown, component?: string) => 
    logger.error(message, data, component),
  
  dev: (message: string, data?: unknown, component?: string) => 
    logger.devLog(message, data, component),
};

// Legacy console.log replacement functions
export const createComponentLogger = (componentName: string) => ({
  debug: (message: string, data?: unknown) => logger.debug(message, data, componentName),
  info: (message: string, data?: unknown) => logger.info(message, data, componentName),
  warn: (message: string, data?: unknown) => logger.warn(message, data, componentName),
  error: (message: string, data?: unknown) => logger.error(message, data, componentName),
  dev: (message: string, data?: unknown) => logger.devLog(message, data, componentName),
});

export default logger;