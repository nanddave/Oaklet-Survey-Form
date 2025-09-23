/**
 * Survey Configuration Management
 * Centralized configuration for survey form functionality
 */

export interface SurveyConfig {
  rateLimit: {
    perHour: number;
    perDay: number;
  };
  timeouts: {
    submission: number;
    autoAdvance: number;
  };
  features: {
    duplicatePrevention: boolean;
    rateLimiting: boolean;
    caching: boolean;
  };
  messages: {
    emailExists: string;
    submissionExists: string;
    genericError: string;
    rateLimitExceeded: string;
  };
}

export const SurveyConfig: SurveyConfig = {
  rateLimit: {
    perHour: parseInt(process.env.SURVEY_RATE_LIMIT_PER_HOUR || '5'),
    perDay: parseInt(process.env.SURVEY_RATE_LIMIT_PER_DAY || '10'),
  },
  timeouts: {
    submission: parseInt(process.env.SURVEY_SUBMISSION_TIMEOUT || '30000'),
    autoAdvance: parseInt(process.env.SURVEY_AUTO_ADVANCE_TIMEOUT || '300'),
  },
  features: {
    duplicatePrevention: process.env.FEATURE_DUPLICATE_PREVENTION !== 'false',
    rateLimiting: process.env.FEATURE_RATE_LIMITING !== 'false',
    caching: process.env.FEATURE_SURVEY_CACHING !== 'false',
  },
  messages: {
    emailExists: process.env.SURVEY_EMAIL_EXISTS_MESSAGE || 'This email already has an appointment. Please use a different email.',
    submissionExists: process.env.SURVEY_SUBMISSION_EXISTS_MESSAGE || 'This submission has already been processed.',
    genericError: process.env.SURVEY_GENERIC_ERROR_MESSAGE || 'An error occurred. Please try again.',
    rateLimitExceeded: process.env.SURVEY_RATE_LIMIT_MESSAGE || 'Too many submissions. Please try again later.',
  }
};

export default SurveyConfig;
