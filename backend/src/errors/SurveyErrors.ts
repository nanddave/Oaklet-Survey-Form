/**
 * Survey-specific error types
 * Custom error classes for better error handling
 */

export class EmailAlreadyExistsError extends Error {
  public readonly code = 'EMAIL_ALREADY_EXISTS';
  public readonly statusCode = 409;
  
  constructor(email: string) {
    super(`Email ${email} already has an appointment`);
    this.name = 'EmailAlreadyExistsError';
  }
}

export class SubmissionAlreadyProcessedError extends Error {
  public readonly code = 'SUBMISSION_ALREADY_PROCESSED';
  public readonly statusCode = 409;
  
  constructor(submissionId: string) {
    super(`Submission ${submissionId} has already been processed`);
    this.name = 'SubmissionAlreadyProcessedError';
  }
}

export class RateLimitExceededError extends Error {
  public readonly code = 'RATE_LIMIT_EXCEEDED';
  public readonly statusCode = 429;
  
  constructor(email: string, limit: number, period: string) {
    super(`Rate limit exceeded for ${email}. Maximum ${limit} submissions per ${period}`);
    this.name = 'RateLimitExceededError';
  }
}

export class SurveyValidationError extends Error {
  public readonly code = 'SURVEY_VALIDATION_ERROR';
  public readonly statusCode = 400;
  
  constructor(message: string, field?: string) {
    super(field ? `${field}: ${message}` : message);
    this.name = 'SurveyValidationError';
  }
}

export class SurveySubmissionError extends Error {
  public readonly code = 'SURVEY_SUBMISSION_ERROR';
  public readonly statusCode = 500;
  public readonly originalError?: Error;
  
  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'SurveySubmissionError';
    this.originalError = originalError;
  }
}

export type SurveyError = 
  | EmailAlreadyExistsError 
  | SubmissionAlreadyProcessedError 
  | RateLimitExceededError 
  | SurveyValidationError 
  | SurveySubmissionError;
