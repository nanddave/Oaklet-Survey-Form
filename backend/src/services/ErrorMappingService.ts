/**
 * Error Mapping Service
 * Maps internal errors to user-friendly messages
 */

import { SurveyConfig } from '../config/survey.config';
import { 
  EmailAlreadyExistsError, 
  SubmissionAlreadyProcessedError, 
  RateLimitExceededError,
  SurveyValidationError,
  SurveySubmissionError 
} from '../errors/SurveyErrors';

export interface ErrorMapping {
  userMessage: string;
  retryAction: 'start_over' | 'retry' | 'contact_support' | 'none';
  supportMessage: string;
  statusCode: number;
  logLevel: 'warn' | 'error';
}

export class ErrorMappingService {
  private errorMappings: Map<string, ErrorMapping> = new Map();

  constructor() {
    this.initializeMappings();
  }

  /**
   * Initialize error mappings
   */
  private initializeMappings(): void {
    // Email already exists
    this.errorMappings.set('EMAIL_ALREADY_EXISTS', {
      userMessage: SurveyConfig.messages.emailExists,
      retryAction: 'start_over',
      supportMessage: 'Please use a different email address or contact support if you believe this is an error.',
      statusCode: 409,
      logLevel: 'warn'
    });

    // Submission already processed
    this.errorMappings.set('SUBMISSION_ALREADY_PROCESSED', {
      userMessage: SurveyConfig.messages.submissionExists,
      retryAction: 'none',
      supportMessage: 'This submission has already been processed. Please check your email for confirmation.',
      statusCode: 409,
      logLevel: 'warn'
    });

    // Rate limit exceeded
    this.errorMappings.set('RATE_LIMIT_EXCEEDED', {
      userMessage: SurveyConfig.messages.rateLimitExceeded,
      retryAction: 'retry',
      supportMessage: 'Please wait before trying again. If you continue to experience issues, contact support.',
      statusCode: 429,
      logLevel: 'warn'
    });

    // Validation errors
    this.errorMappings.set('SURVEY_VALIDATION_ERROR', {
      userMessage: 'Please check your information and try again.',
      retryAction: 'start_over',
      supportMessage: 'Please ensure all required fields are completed correctly.',
      statusCode: 400,
      logLevel: 'warn'
    });

    // Survey submission errors
    this.errorMappings.set('SURVEY_SUBMISSION_ERROR', {
      userMessage: SurveyConfig.messages.genericError,
      retryAction: 'retry',
      supportMessage: 'If this problem persists, please contact support@oaklet.com',
      statusCode: 500,
      logLevel: 'error'
    });

    // Network errors
    this.errorMappings.set('NETWORK_ERROR', {
      userMessage: 'Connection issue. Please check your internet connection and try again.',
      retryAction: 'retry',
      supportMessage: 'Please check your internet connection. If the problem persists, contact support.',
      statusCode: 503,
      logLevel: 'warn'
    });

    // AWS/DynamoDB errors
    this.errorMappings.set('AWS_ERROR', {
      userMessage: 'Service temporarily unavailable. Please try again in a few moments.',
      retryAction: 'retry',
      supportMessage: 'Our service is experiencing temporary issues. Please try again shortly.',
      statusCode: 503,
      logLevel: 'error'
    });

    // Oaklet Nest service errors
    this.errorMappings.set('OAKLET_NEST_ERROR', {
      userMessage: 'Unable to schedule appointment. Please try again or contact support.',
      retryAction: 'retry',
      supportMessage: 'There was an issue scheduling your appointment. Please try again or contact support@oaklet.com',
      statusCode: 502,
      logLevel: 'error'
    });

    // Generic fallback
    this.errorMappings.set('UNKNOWN_ERROR', {
      userMessage: SurveyConfig.messages.genericError,
      retryAction: 'contact_support',
      supportMessage: 'An unexpected error occurred. Please contact support@oaklet.com for assistance.',
      statusCode: 500,
      logLevel: 'error'
    });
  }

  /**
   * Map error to user-friendly response
   */
  mapError(error: Error): ErrorMapping {
    // Check for custom error types first
    if (error instanceof EmailAlreadyExistsError) {
      return this.errorMappings.get('EMAIL_ALREADY_EXISTS')!;
    }

    if (error instanceof SubmissionAlreadyProcessedError) {
      return this.errorMappings.get('SUBMISSION_ALREADY_PROCESSED')!;
    }

    if (error instanceof RateLimitExceededError) {
      return this.errorMappings.get('RATE_LIMIT_EXCEEDED')!;
    }

    if (error instanceof SurveyValidationError) {
      return this.errorMappings.get('SURVEY_VALIDATION_ERROR')!;
    }

    if (error instanceof SurveySubmissionError) {
      return this.errorMappings.get('SURVEY_SUBMISSION_ERROR')!;
    }

    // Check error message patterns
    const message = error.message.toLowerCase();

    if (message.includes('econnreset') || 
        message.includes('etimedout') || 
        message.includes('enotfound') ||
        message.includes('network')) {
      return this.errorMappings.get('NETWORK_ERROR')!;
    }

    if (message.includes('aws') || 
        message.includes('dynamodb') || 
        message.includes('throttling') ||
        message.includes('service unavailable')) {
      return this.errorMappings.get('AWS_ERROR')!;
    }

    if (message.includes('oaklet') || 
        message.includes('nest') || 
        message.includes('appointment')) {
      return this.errorMappings.get('OAKLET_NEST_ERROR')!;
    }

    // Default fallback
    return this.errorMappings.get('UNKNOWN_ERROR')!;
  }

  /**
   * Get error mapping by key
   */
  getErrorMapping(key: string): ErrorMapping | undefined {
    return this.errorMappings.get(key);
  }

  /**
   * Add custom error mapping
   */
  addErrorMapping(key: string, mapping: ErrorMapping): void {
    this.errorMappings.set(key, mapping);
  }

  /**
   * Get all available error mappings
   */
  getAllMappings(): Map<string, ErrorMapping> {
    return new Map(this.errorMappings);
  }
}
