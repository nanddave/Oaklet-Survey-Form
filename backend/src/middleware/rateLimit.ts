/**
 * Rate Limiting Middleware
 * Implements rate limiting for survey submissions
 */

import { Request, Response, NextFunction } from 'express';
import { SurveyConfig } from '../config/survey.config';
import { RateLimitExceededError } from '../errors/SurveyErrors';
import { logger } from '../config/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is within rate limit
   */
  checkLimit(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    this.store[key].count++;
    
    if (this.store[key].count > limit) {
      logger.warn('Rate limit exceeded', {
        identifier,
        limit,
        windowMs,
        currentCount: this.store[key].count
      });
      return false;
    }

    return true;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  /**
   * Get current count for identifier
   */
  getCurrentCount(identifier: string, windowMs: number): number {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    return this.store[key]?.count || 0;
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Rate limiting middleware factory
 */
export const createRateLimit = (limit: number, windowMs: number, keyGenerator?: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!SurveyConfig.features.rateLimiting) {
      return next();
    }

    try {
      // Generate identifier for rate limiting
      const identifier = keyGenerator ? keyGenerator(req) : (req.ip || 'unknown');
      
      // Check rate limit
      const isAllowed = rateLimiter.checkLimit(identifier, limit, windowMs);
      
      if (!isAllowed) {
        const currentCount = rateLimiter.getCurrentCount(identifier, windowMs);
        const error = new RateLimitExceededError(identifier, limit, `${windowMs / 1000} seconds`);
        
        logger.warn('Rate limit exceeded', {
          identifier,
          limit,
          windowMs,
          currentCount,
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown'
        });

        res.status(429).json({
          success: false,
          error: SurveyConfig.messages.rateLimitExceeded,
          retryAfter: Math.ceil(windowMs / 1000),
          currentCount,
          limit
        });
        return;
      }

      // Add rate limit headers
      const currentCount = rateLimiter.getCurrentCount(identifier, windowMs);
      res.set({
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': Math.max(0, limit - currentCount).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      });

      next();
    } catch (error) {
      logger.error('Rate limiting error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip || 'unknown'
      });
      
      // Don't block requests if rate limiting fails
      next();
    }
  };
};

/**
 * Survey submission rate limiting
 */
export const surveyRateLimit = createRateLimit(
  SurveyConfig.rateLimit.perHour,
  60 * 60 * 1000, // 1 hour
  (req: Request) => {
    // Use email if available, otherwise use IP
    const body = req.body;
    if (body?.responses?.email) {
      return `email:${body.responses.email}`;
    }
    return `ip:${req.ip}`;
  }
);

/**
 * Email check rate limiting
 */
export const emailCheckRateLimit = createRateLimit(
  10, // 10 checks per minute
  60 * 1000, // 1 minute
  (req: Request) => {
    const email = req.query.email as string;
    return email ? `email:${email}` : `ip:${req.ip}`;
  }
);

export default rateLimiter;
