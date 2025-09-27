/**
 * Survey Validation Service
 * Handles all validation logic for survey submissions
 */

import { SurveyConfig } from '../config/survey.config';
import { 
  EmailAlreadyExistsError, 
  SubmissionAlreadyProcessedError, 
  RateLimitExceededError,
  SurveyValidationError 
} from '../errors/SurveyErrors';
import { OakletNestService } from './oakletNestService';
import { DynamoDBService } from './dynamodbService';
import { logger } from '../config/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SurveySubmissionData {
  responses: {
    firstName: string;
    lastName: string;
    email: string;
    q1: string;
    q2?: string;
    q3: string;
    q4?: string;
    q5: string;
    location: string;
    scheduling: string;
  };
  appointment: {
    selectedDateTime: string;
    appointmentDate: string;
    appointmentTime: string;
  };
  organizationId: string;
  submissionId?: string;
}

export class SurveyValidationService {
  private oakletNest: OakletNestService;
  private dynamodb: DynamoDBService;

  constructor() {
    this.oakletNest = new OakletNestService();
    this.dynamodb = new DynamoDBService();
  }

  /**
   * Validate complete survey submission
   */
  async validateSubmission(data: SurveySubmissionData): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Run all validations in parallel for better performance
      const validationPromises = [
        this.validateRequiredFields(data),
        this.validateEmailFormat(data.responses.email),
        this.validateAppointmentData(data.appointment),
        SurveyConfig.features.duplicatePrevention ? this.checkEmailUniqueness(data.responses.email) : Promise.resolve(true),
        SurveyConfig.features.duplicatePrevention ? this.checkSubmissionUniqueness(data.submissionId) : Promise.resolve(true),
        SurveyConfig.features.rateLimiting ? this.checkRateLimit(data.responses.email) : Promise.resolve(true),
      ];

      const results = await Promise.allSettled(validationPromises);

      // Process validation results
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const error = result.reason;
          if (error instanceof EmailAlreadyExistsError) {
            errors.push(SurveyConfig.messages.emailExists);
          } else if (error instanceof SubmissionAlreadyProcessedError) {
            errors.push(SurveyConfig.messages.submissionExists);
          } else if (error instanceof RateLimitExceededError) {
            errors.push(SurveyConfig.messages.rateLimitExceeded);
          } else {
            errors.push(error.message);
          }
        } else if (typeof result.value === 'string') {
          warnings.push(result.value);
        }
      });

      logger.info('Survey validation completed', {
        submissionId: data.submissionId,
        email: data.responses.email,
        isValid: errors.length === 0,
        errorCount: errors.length,
        warningCount: warnings.length
      });

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      logger.error('Survey validation failed', {
        submissionId: data.submissionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        isValid: false,
        errors: [SurveyConfig.messages.genericError],
        warnings: []
      };
    }
  }

  /**
   * Validate required fields
   */
  private async validateRequiredFields(data: SurveySubmissionData): Promise<void> {
    const requiredFields = [
      { field: 'firstName', value: data.responses.firstName },
      { field: 'lastName', value: data.responses.lastName },
      { field: 'email', value: data.responses.email },
      { field: 'q1', value: data.responses.q1 },
      { field: 'q3', value: data.responses.q3 },
      { field: 'q5', value: data.responses.q5 },
      { field: 'location', value: data.responses.location },
      { field: 'selectedDateTime', value: data.appointment.selectedDateTime },
      { field: 'appointmentDate', value: data.appointment.appointmentDate },
      { field: 'appointmentTime', value: data.appointment.appointmentTime },
    ];

    const missingFields = requiredFields.filter(field => !field.value || field.value.trim() === '');
    
    if (missingFields.length > 0) {
      throw new SurveyValidationError(
        `Missing required fields: ${missingFields.map(f => f.field).join(', ')}`
      );
    }
  }

  /**
   * Validate email format
   */
  private async validateEmailFormat(email: string): Promise<void> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new SurveyValidationError('Invalid email format', 'email');
    }
  }

  /**
   * Validate appointment data
   */
  private async validateAppointmentData(appointment: SurveySubmissionData['appointment']): Promise<void> {
    // Parse YYYY-MM-DD string into local date components
    const [year, month, day] = appointment.appointmentDate.split('-').map(Number);
    const appointmentDate = new Date(year, month - 1, day); // Local midnight

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Local midnight

    if (appointmentDate < today) {
      throw new SurveyValidationError('Appointment date cannot be in the past', 'appointmentDate');
    }

    // Validate appointment time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(appointment.appointmentTime)) {
      throw new SurveyValidationError('Invalid appointment time format', 'appointmentTime');
    }
  }

  /**
   * Check if email already exists
   */
  private async checkEmailUniqueness(email: string): Promise<void> {
    try {
      const existingSubmissions = await this.dynamodb.getSubmissionsByEmail(email);
      if (existingSubmissions.length > 0) {
        throw new EmailAlreadyExistsError(email);
      }
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        throw error;
      }
      logger.warn('Email uniqueness check failed', { email, error: error instanceof Error ? error.message : 'Unknown error' });
      // Don't fail validation if uniqueness check fails due to technical issues
    }
  }

  /**
   * Check if submission already exists
   */
  private async checkSubmissionUniqueness(submissionId?: string): Promise<void> {
    if (!submissionId) return;

    try {
      const existingSubmission = await this.dynamodb.getSurveySubmission(submissionId);
      if (existingSubmission) {
        throw new SubmissionAlreadyProcessedError(submissionId);
      }
    } catch (error) {
      if (error instanceof SubmissionAlreadyProcessedError) {
        throw error;
      }
      logger.warn('Submission uniqueness check failed', { submissionId, error: error instanceof Error ? error.message : 'Unknown error' });
      // Don't fail validation if uniqueness check fails due to technical issues
    }
  }

  /**
   * Check rate limit for email
   */
  private async checkRateLimit(email: string): Promise<void> {
    try {
      const recentSubmissions = await this.dynamodb.getSubmissionsByEmail(email);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const hourlySubmissions = recentSubmissions.filter(submission => 
        new Date(submission.completedAt || submission.submissionDate) > oneHourAgo
      );

      const dailySubmissions = recentSubmissions.filter(submission => 
        new Date(submission.completedAt || submission.submissionDate) > oneDayAgo
      );

      if (hourlySubmissions.length >= SurveyConfig.rateLimit.perHour) {
        throw new RateLimitExceededError(email, SurveyConfig.rateLimit.perHour, 'hour');
      }

      if (dailySubmissions.length >= SurveyConfig.rateLimit.perDay) {
        throw new RateLimitExceededError(email, SurveyConfig.rateLimit.perDay, 'day');
      }
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        throw error;
      }
      logger.warn('Rate limit check failed', { email, error: error instanceof Error ? error.message : 'Unknown error' });
      // Don't fail validation if rate limit check fails due to technical issues
    }
  }
}
