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
    // ADHD Questionnaire Responses
    psychiatric_diagnosis: string;
    medical_diagnosis: string;
    current_medications: string;
    psychiatric_hospitalizations: string;
    family_psychiatric_history: string;
    family_adhd_history: string;
    academic_difficulties: string;
    hyperactive_impulsive: string;
    social_difficulties: string;
    home_stress: string;
    childhood_trauma: string;
    careless_mistakes: string;
    sustaining_attention: string;
    restless_fidgety: string;
    interrupt_others: string;
    procrastinate: string;
    lose_things: string;
    finish_details: string;
    organize_tasks: string;
    remember_appointments: string;
    delay_starting: string;
    fidget_sitting: string;
    overly_active: string;
    elevated_mood: string;
    increased_energy: string;
    less_sleep: string;
    more_talkative: string;
    risky_behaviors: string;
    mood_problems: string;
    nervous_anxious: string;
    unable_control_worry: string;
    worrying_too_much: string;
    trouble_relaxing: string;
    restlessness: string;
    irritability: string;
    fear_awful: string;
    little_interest: string;
    feeling_down: string;
    sleep_problems: string;
    feeling_tired: string;
    appetite_problems: string;
    feeling_bad_self: string;
    trouble_concentrating: string;
    psychomotor_changes: string;
    suicidal_thoughts: string;
    anhedonia_expanded: string;
    home_stress_trauma: string;
    abuse_exposure: string;
    other_information: string;
    // Contact and scheduling
    firstName: string;
    lastName: string;
    email: string;
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
        hasEmail: !!data.responses.email,
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
      { field: 'psychiatric_diagnosis', value: data.responses.psychiatric_diagnosis },
      { field: 'medical_diagnosis', value: data.responses.medical_diagnosis },
      { field: 'current_medications', value: data.responses.current_medications },
      { field: 'psychiatric_hospitalizations', value: data.responses.psychiatric_hospitalizations },
      { field: 'family_psychiatric_history', value: data.responses.family_psychiatric_history },
      { field: 'family_adhd_history', value: data.responses.family_adhd_history },
      { field: 'academic_difficulties', value: data.responses.academic_difficulties },
      { field: 'hyperactive_impulsive', value: data.responses.hyperactive_impulsive },
      { field: 'social_difficulties', value: data.responses.social_difficulties },
      { field: 'home_stress', value: data.responses.home_stress },
      { field: 'childhood_trauma', value: data.responses.childhood_trauma },
      { field: 'careless_mistakes', value: data.responses.careless_mistakes },
      { field: 'sustaining_attention', value: data.responses.sustaining_attention },
      { field: 'restless_fidgety', value: data.responses.restless_fidgety },
      { field: 'interrupt_others', value: data.responses.interrupt_others },
      { field: 'procrastinate', value: data.responses.procrastinate },
      { field: 'lose_things', value: data.responses.lose_things },
      { field: 'finish_details', value: data.responses.finish_details },
      { field: 'organize_tasks', value: data.responses.organize_tasks },
      { field: 'remember_appointments', value: data.responses.remember_appointments },
      { field: 'delay_starting', value: data.responses.delay_starting },
      { field: 'fidget_sitting', value: data.responses.fidget_sitting },
      { field: 'overly_active', value: data.responses.overly_active },
      { field: 'elevated_mood', value: data.responses.elevated_mood },
      { field: 'increased_energy', value: data.responses.increased_energy },
      { field: 'less_sleep', value: data.responses.less_sleep },
      { field: 'more_talkative', value: data.responses.more_talkative },
      { field: 'risky_behaviors', value: data.responses.risky_behaviors },
      { field: 'mood_problems', value: data.responses.mood_problems },
      { field: 'nervous_anxious', value: data.responses.nervous_anxious },
      { field: 'unable_control_worry', value: data.responses.unable_control_worry },
      { field: 'worrying_too_much', value: data.responses.worrying_too_much },
      { field: 'trouble_relaxing', value: data.responses.trouble_relaxing },
      { field: 'restlessness', value: data.responses.restlessness },
      { field: 'irritability', value: data.responses.irritability },
      { field: 'fear_awful', value: data.responses.fear_awful },
      { field: 'little_interest', value: data.responses.little_interest },
      { field: 'feeling_down', value: data.responses.feeling_down },
      { field: 'sleep_problems', value: data.responses.sleep_problems },
      { field: 'feeling_tired', value: data.responses.feeling_tired },
      { field: 'appetite_problems', value: data.responses.appetite_problems },
      { field: 'feeling_bad_self', value: data.responses.feeling_bad_self },
      { field: 'trouble_concentrating', value: data.responses.trouble_concentrating },
      { field: 'psychomotor_changes', value: data.responses.psychomotor_changes },
      { field: 'suicidal_thoughts', value: data.responses.suicidal_thoughts },
      { field: 'anhedonia_expanded', value: data.responses.anhedonia_expanded },
      { field: 'home_stress_trauma', value: data.responses.home_stress_trauma },
      { field: 'abuse_exposure', value: data.responses.abuse_exposure },
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
    // Check for empty email
    if (!email || email.trim() === '') {
      throw new SurveyValidationError('Email is required', 'email');
    }
    
    // Check for consecutive dots
    if (email.includes('..')) {
      throw new SurveyValidationError('Invalid email format', 'email');
    }
    
    // Check for basic structure requirements
    if (!email.includes('@')) {
      throw new SurveyValidationError('Invalid email format', 'email');
    }
    
    const parts = email.split('@');
    if (parts.length !== 2) {
      throw new SurveyValidationError('Invalid email format', 'email');
    }
    
    const [localPart, domainPart] = parts;
    
    // Check local part (before @)
    if (!localPart || localPart.length === 0) {
      throw new SurveyValidationError('Invalid email format', 'email');
    }
    
    // Check domain part (after @)
    if (!domainPart || domainPart.length === 0) {
      throw new SurveyValidationError('Invalid email format', 'email');
    }
    
    // Domain must contain at least one dot
    if (!domainPart.includes('.')) {
      throw new SurveyValidationError('Invalid email format', 'email');
    }
    
    // More comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    // Check basic format
    if (!emailRegex.test(email)) {
      throw new SurveyValidationError('Invalid email format', 'email');
    }
  }

  /**
   * Validate appointment data
   */
  private async validateAppointmentData(appointment: SurveySubmissionData['appointment']): Promise<void> {
    // Validate appointment date format first
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(appointment.appointmentDate)) {
      throw new SurveyValidationError('Invalid appointment date format. Expected YYYY-MM-DD', 'appointmentDate');
    }

    // Parse YYYY-MM-DD string into local date components with validation
    const dateParts = appointment.appointmentDate.split('-');
    if (dateParts.length !== 3) {
      throw new SurveyValidationError('Invalid appointment date format', 'appointmentDate');
    }

    const [yearStr, monthStr, dayStr] = dateParts;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    // Validate date components
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new SurveyValidationError('Invalid appointment date values', 'appointmentDate');
    }

    if (year < 2024 || year > 2030) {
      throw new SurveyValidationError('Appointment year must be between 2024 and 2030', 'appointmentDate');
    }

    if (month < 1 || month > 12) {
      throw new SurveyValidationError('Invalid appointment month', 'appointmentDate');
    }

    if (day < 1 || day > 31) {
      throw new SurveyValidationError('Invalid appointment day', 'appointmentDate');
    }

    // Create date and validate it's actually valid (handles Feb 30, etc.)
    const appointmentDate = new Date(year, month - 1, day); // Local midnight
    
    // Check if the date is actually valid (Date constructor can create invalid dates)
    if (appointmentDate.getFullYear() !== year || 
        appointmentDate.getMonth() !== month - 1 || 
        appointmentDate.getDate() !== day) {
      throw new SurveyValidationError('Invalid appointment date (e.g., February 30th)', 'appointmentDate');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Local midnight

    if (appointmentDate < today) {
      throw new SurveyValidationError('Appointment date cannot be in the past', 'appointmentDate');
    }

    // Validate appointment time format - accept both HH:MM and full datetime
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    
    if (!timeRegex.test(appointment.appointmentTime) && !datetimeRegex.test(appointment.appointmentTime)) {
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
      logger.error('Email uniqueness check failed - validation cannot proceed', { 
        hasEmail: !!email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Email validation temporarily unavailable. Please try again later.');
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
      logger.error('Submission uniqueness check failed - validation cannot proceed', { 
        submissionId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Submission validation temporarily unavailable. Please try again later.');
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
      logger.error('Rate limit check failed - validation cannot proceed', { 
        hasEmail: !!email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Rate limit validation temporarily unavailable. Please try again later.');
    }
  }
}
