/**
 * Retry Service
 * Handles retry logic for failed operations
 */

import { logger } from '../config/logger';

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export class RetryService {
  private defaultOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    jitter: true
  };

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    operationName: string = 'operation'
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        logger.info(`Attempting ${operationName}`, {
          attempt,
          maxAttempts: config.maxAttempts
        });

        const result = await operation();
        
        logger.info(`${operationName} succeeded`, {
          attempt,
          totalTime: Date.now() - startTime
        });

        return {
          success: true,
          result,
          attempts: attempt,
          totalTime: Date.now() - startTime
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        logger.warn(`${operationName} failed`, {
          attempt,
          maxAttempts: config.maxAttempts,
          error: lastError.message,
          willRetry: attempt < config.maxAttempts
        });

        // Don't retry on the last attempt
        if (attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config);
        
        logger.info(`Waiting before retry`, {
          attempt,
          delayMs: delay
        });

        await this.sleep(delay);
      }
    }

    logger.error(`${operationName} failed after all retries`, {
      attempts: config.maxAttempts,
      totalTime: Date.now() - startTime,
      finalError: lastError?.message
    });

    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(attempt: number, options: RetryOptions): number {
    let delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1);
    
    // Cap at max delay
    delay = Math.min(delay, options.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (options.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error: Error): boolean {
    // Network errors
    if (error.message.includes('ECONNRESET') || 
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND')) {
      return true;
    }

    // AWS SDK errors
    if (error.message.includes('ThrottlingException') ||
        error.message.includes('ServiceUnavailableException') ||
        error.message.includes('InternalServerError')) {
      return true;
    }

    // HTTP 5xx errors
    if (error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504')) {
      return true;
    }

    return false;
  }

  /**
   * Execute with retry only for retryable errors
   */
  async executeWithConditionalRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    operationName: string = 'operation'
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        return {
          success: true,
          result,
          attempts: attempt,
          totalTime: Date.now() - startTime
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          logger.warn(`${operationName} failed with non-retryable error`, {
            attempt,
            error: lastError.message
          });
          break;
        }

        logger.warn(`${operationName} failed with retryable error`, {
          attempt,
          maxAttempts: config.maxAttempts,
          error: lastError.message,
          willRetry: attempt < config.maxAttempts
        });

        // Don't retry on the last attempt
        if (attempt === config.maxAttempts) {
          break;
        }

        const delay = this.calculateDelay(attempt, config);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts,
      totalTime: Date.now() - startTime
    };
  }
}
