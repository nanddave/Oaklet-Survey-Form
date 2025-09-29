/**
 * Authentication middleware for Survey Form backend
 * @copyright (c) 2025 Oaklet
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface AuthenticatedRequest extends Request {
  isServiceToken?: boolean;
}

/**
 * Validate service token for internal API calls
 */
export const validateServiceToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const serviceToken = req.headers['x-service-token'] as string;
  const expectedToken = process.env.SURVEY_SERVICE_TOKEN;

  // Require service token in all environments for security
  if (!expectedToken) {
    logger.error('SURVEY_SERVICE_TOKEN environment variable not configured');
    res.status(500).json({
      success: false,
      error: 'Service configuration error'
    });
    return;
  }

  if (!serviceToken) {
    logger.warn('Missing service token in request', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    res.status(401).json({
      success: false,
      error: 'Service token required'
    });
    return;
  }

  if (serviceToken !== expectedToken) {
    logger.warn('Invalid service token provided', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    res.status(401).json({
      success: false,
      error: 'Invalid service token'
    });
    return;
  }

  req.isServiceToken = true;
  next();
};

/**
 * Optional service token validation (allows requests without token)
 */
export const optionalServiceToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const serviceToken = req.headers['x-service-token'] as string;
  const expectedToken = process.env.SURVEY_SERVICE_TOKEN;

  if (serviceToken && expectedToken && serviceToken === expectedToken) {
    req.isServiceToken = true;
  }

  next();
};
