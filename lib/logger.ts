/**
 * Logger Service - Centralized logging with environment awareness
 * Implements Fail Fast and Security by Design principles
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  context?: string;
}

class Logger {
  private isDevelopment: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment && (level === 'debug' || level === 'info')) {
      return false;
    }
    return true;
  }

  private createEntry(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context,
    };
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  private sanitizeData(data: any): any {
    if (data == null) return data;
    
    // Remove sensitive fields from logging
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];
    
    if (typeof data === 'object') {
      const sanitized = Array.isArray(data) ? [...data] : { ...data };
      
      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }
      
      return sanitized;
    }
    
    return data;
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createEntry('debug', message, this.sanitizeData(data), context);
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.debug(`[DEBUG]${context ? ` [${context}]` : ''} ${message}`, data);
    }
  }

  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createEntry('info', message, this.sanitizeData(data), context);
    this.addToBuffer(entry);
    
    if (this.isDevelopment) {
      console.info(`[INFO]${context ? ` [${context}]` : ''} ${message}`, data);
    }
  }

  warn(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createEntry('warn', message, this.sanitizeData(data), context);
    this.addToBuffer(entry);
    
    console.warn(`[WARN]${context ? ` [${context}]` : ''} ${message}`, data);
    
    // In production, you might want to send warnings to a monitoring service
    if (!this.isDevelopment) {
      this.sendToMonitoring(entry);
    }
  }

  error(message: string, error?: any, context?: string): void {
    const entry = this.createEntry('error', message, this.sanitizeData(error), context);
    this.addToBuffer(entry);
    
    console.error(`[ERROR]${context ? ` [${context}]` : ''} ${message}`, error);
    
    // In production, always send errors to monitoring service
    if (!this.isDevelopment) {
      this.sendToMonitoring(entry);
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    // TODO: Integrate with monitoring service (e.g., Sentry, LogRocket, etc.)
    // For now, we just keep it in the buffer
    // Example:
    // if (window.Sentry) {
    //   Sentry.captureMessage(entry.message, { level: entry.level, extra: entry.data });
    // }
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  clearBuffer(): void {
    this.logBuffer = [];
  }
}

// Export singleton instance
export const logger = new Logger();
