import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OakletNestService } from '../services/oakletNestService';
import { SurveyEncryptionService } from '../services/encryptionService';
import { DynamoDBService } from '../services/dynamodbService';
import { SurveyValidationService } from '../services/SurveyValidationService';
import { AuditService } from '../services/AuditService';
import { RetryService } from '../services/RetryService';
import { ErrorMappingService } from '../services/ErrorMappingService';
import { SurveyConfig } from '../config/survey.config';
import { logger } from '../config/logger';

// Basic input sanitization utility
const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, ''); // Remove basic HTML tags
};

export interface SurveySubmissionRequest {
  responses: {
    // ADHD Questionnaire Responses
    psychiatric_diagnosis: string;
    psychiatric_diagnosis_conditional?: string;
    medical_diagnosis: string;
    medical_diagnosis_conditional?: string;
    current_medications: string;
    psychiatric_hospitalizations: string;
    psychiatric_hospitalizations_conditional?: string;
    family_psychiatric_history: string;
    family_psychiatric_history_conditional?: string;
    family_adhd_history: string;
    academic_difficulties: string;
    academic_difficulties_conditional?: string;
    hyperactive_impulsive: string;
    social_difficulties: string;
    home_stress: string;
    childhood_trauma: string;
    childhood_trauma_conditional?: string;
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
    anhedonia_expanded_conditional?: string;
    home_stress_trauma: string;
    home_stress_trauma_conditional?: string;
    abuse_exposure: string;
    abuse_exposure_conditional?: string;
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
  organizationId?: string;
}

export interface SurveySubmissionResponse {
  success: boolean;
  submissionId?: string;
  appointmentId?: string;
  confirmationNumber?: string;
  message?: string;
  nextSteps?: string[];
  error?: string;
  retryAction?: string;
  supportMessage?: string;
}

export class SurveyController {
  private oakletNest: OakletNestService;
  private encryption: SurveyEncryptionService;
  private dynamodb: DynamoDBService;
  private validation: SurveyValidationService;
  private audit: AuditService;
  private retry: RetryService;
  private errorMapping: ErrorMappingService;

  constructor() {
    this.oakletNest = new OakletNestService();
    this.encryption = new SurveyEncryptionService();
    this.dynamodb = new DynamoDBService();
    this.validation = new SurveyValidationService();
    this.audit = new AuditService();
    this.retry = new RetryService();
    this.errorMapping = new ErrorMappingService();
  }

  async checkEmail(req: Request, res: Response): Promise<void> {
    const { email } = req.query;
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    
    logger.info('Email availability check requested', { 
      requestId, 
      email: email ? 'provided' : 'missing' 
    });

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
      return;
    }

    try {
      const existingSubmissions = await this.dynamodb.getSubmissionsByEmail(email);
      const isAvailable = existingSubmissions.length === 0;

      logger.info('Email availability check completed', {
        requestId,
        hasEmail: !!email,
        isAvailable,
        existingCount: existingSubmissions.length
      });

      try {
        await this.audit.logEmailCheck(
          email,
          process.env.DEFAULT_ORGANIZATION_ID || '',
          isAvailable,
          req.ip,
          req.get('User-Agent')
        );
      } catch (auditError) {
        logger.error('audit.logEmailCheck failed', {
          hasEmail: !!email,
          organizationId: process.env.DEFAULT_ORGANIZATION_ID || '',
          error: auditError instanceof Error ? auditError.message : 'Unknown error'
        });
      }

      res.json({
        success: true,
        email,
        available: isAvailable
      });
    } catch (error) {
      logger.error('Email availability check failed', {
        requestId,
        hasEmail: !!email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        success: false,
        email,
        available: false,
        error: 'Failed to check email availability'
      });
    }
  }

  async submitAndSchedule(req: Request, res: Response): Promise<void> {
    const submissionId = uuidv4();
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    
    logger.info('Survey submission started', {
      submissionId,
      requestId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    try {
      const { responses, appointment, organizationId = process.env.DEFAULT_ORGANIZATION_ID || '' }: SurveySubmissionRequest = req.body;

      const submissionData = {
        responses: {
          // ADHD Questionnaire Responses - sanitized
          psychiatric_diagnosis: sanitizeString(responses.psychiatric_diagnosis),
          psychiatric_diagnosis_conditional: responses.psychiatric_diagnosis_conditional ? sanitizeString(responses.psychiatric_diagnosis_conditional) : undefined,
          medical_diagnosis: sanitizeString(responses.medical_diagnosis),
          medical_diagnosis_conditional: responses.medical_diagnosis_conditional ? sanitizeString(responses.medical_diagnosis_conditional) : undefined,
          current_medications: sanitizeString(responses.current_medications),
          psychiatric_hospitalizations: responses.psychiatric_hospitalizations,
          psychiatric_hospitalizations_conditional: responses.psychiatric_hospitalizations_conditional,
          family_psychiatric_history: responses.family_psychiatric_history,
          family_psychiatric_history_conditional: responses.family_psychiatric_history_conditional,
          family_adhd_history: responses.family_adhd_history,
          academic_difficulties: responses.academic_difficulties,
          academic_difficulties_conditional: responses.academic_difficulties_conditional,
          hyperactive_impulsive: responses.hyperactive_impulsive,
          social_difficulties: responses.social_difficulties,
          home_stress: responses.home_stress,
          childhood_trauma: responses.childhood_trauma,
          childhood_trauma_conditional: responses.childhood_trauma_conditional,
          careless_mistakes: responses.careless_mistakes,
          sustaining_attention: responses.sustaining_attention,
          restless_fidgety: responses.restless_fidgety,
          interrupt_others: responses.interrupt_others,
          procrastinate: responses.procrastinate,
          lose_things: responses.lose_things,
          finish_details: responses.finish_details,
          organize_tasks: responses.organize_tasks,
          remember_appointments: responses.remember_appointments,
          delay_starting: responses.delay_starting,
          fidget_sitting: responses.fidget_sitting,
          overly_active: responses.overly_active,
          elevated_mood: responses.elevated_mood,
          increased_energy: responses.increased_energy,
          less_sleep: responses.less_sleep,
          more_talkative: responses.more_talkative,
          risky_behaviors: responses.risky_behaviors,
          mood_problems: responses.mood_problems,
          nervous_anxious: responses.nervous_anxious,
          unable_control_worry: responses.unable_control_worry,
          worrying_too_much: responses.worrying_too_much,
          trouble_relaxing: responses.trouble_relaxing,
          restlessness: responses.restlessness,
          irritability: responses.irritability,
          fear_awful: responses.fear_awful,
          little_interest: responses.little_interest,
          feeling_down: responses.feeling_down,
          sleep_problems: responses.sleep_problems,
          feeling_tired: responses.feeling_tired,
          appetite_problems: responses.appetite_problems,
          feeling_bad_self: responses.feeling_bad_self,
          trouble_concentrating: responses.trouble_concentrating,
          psychomotor_changes: responses.psychomotor_changes,
          suicidal_thoughts: responses.suicidal_thoughts,
          anhedonia_expanded: responses.anhedonia_expanded,
          anhedonia_expanded_conditional: responses.anhedonia_expanded_conditional,
          home_stress_trauma: responses.home_stress_trauma,
          home_stress_trauma_conditional: responses.home_stress_trauma_conditional,
          abuse_exposure: responses.abuse_exposure,
          abuse_exposure_conditional: responses.abuse_exposure_conditional,
          other_information: responses.other_information,
          // Contact and scheduling - sanitized
          firstName: sanitizeString(responses.firstName),
          lastName: sanitizeString(responses.lastName),
          email: sanitizeString(responses.email),
          scheduling: sanitizeString(responses.scheduling)
        },
        appointment: {
          selectedDateTime: appointment.selectedDateTime,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime
        },
        organizationId,
        submissionId
      };

      const validationResult = await this.validation.validateSubmission(submissionData);
      
      if (!validationResult.isValid) {
        logger.warn('Survey validation failed', {
          submissionId,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        });

        await this.audit.logValidationFailure(
          submissionId,
          responses.email,
          organizationId,
          validationResult.errors,
          req.ip,
          req.get('User-Agent')
        );

        res.status(400).json({
          success: false,
          error: validationResult.errors.join('; '),
          retryAction: 'start_over',
          supportMessage: 'Please check your information and try again'
        } as SurveySubmissionResponse);
        return;
      }

      if (validationResult.warnings.length > 0) {
        logger.info('Survey validation warnings', {
          submissionId,
          warnings: validationResult.warnings
        });
      }

      const nestResult = await this.retry.executeWithConditionalRetry(
        () => this.oakletNest.submitSurvey({
          responses: {
            // ADHD Questionnaire Responses
            psychiatric_diagnosis: responses.psychiatric_diagnosis,
            psychiatric_diagnosis_conditional: responses.psychiatric_diagnosis_conditional,
            medical_diagnosis: responses.medical_diagnosis,
            medical_diagnosis_conditional: responses.medical_diagnosis_conditional,
            current_medications: responses.current_medications,
            psychiatric_hospitalizations: responses.psychiatric_hospitalizations,
            psychiatric_hospitalizations_conditional: responses.psychiatric_hospitalizations_conditional,
            family_psychiatric_history: responses.family_psychiatric_history,
            family_psychiatric_history_conditional: responses.family_psychiatric_history_conditional,
            family_adhd_history: responses.family_adhd_history,
            academic_difficulties: responses.academic_difficulties,
            academic_difficulties_conditional: responses.academic_difficulties_conditional,
            hyperactive_impulsive: responses.hyperactive_impulsive,
            social_difficulties: responses.social_difficulties,
            home_stress: responses.home_stress,
            childhood_trauma: responses.childhood_trauma,
            childhood_trauma_conditional: responses.childhood_trauma_conditional,
            careless_mistakes: responses.careless_mistakes,
            sustaining_attention: responses.sustaining_attention,
            restless_fidgety: responses.restless_fidgety,
            interrupt_others: responses.interrupt_others,
            procrastinate: responses.procrastinate,
            lose_things: responses.lose_things,
            finish_details: responses.finish_details,
            organize_tasks: responses.organize_tasks,
            remember_appointments: responses.remember_appointments,
            delay_starting: responses.delay_starting,
            fidget_sitting: responses.fidget_sitting,
            overly_active: responses.overly_active,
            elevated_mood: responses.elevated_mood,
            increased_energy: responses.increased_energy,
            less_sleep: responses.less_sleep,
            more_talkative: responses.more_talkative,
            risky_behaviors: responses.risky_behaviors,
            mood_problems: responses.mood_problems,
            nervous_anxious: responses.nervous_anxious,
            unable_control_worry: responses.unable_control_worry,
            worrying_too_much: responses.worrying_too_much,
            trouble_relaxing: responses.trouble_relaxing,
            restlessness: responses.restlessness,
            irritability: responses.irritability,
            fear_awful: responses.fear_awful,
            little_interest: responses.little_interest,
            feeling_down: responses.feeling_down,
            sleep_problems: responses.sleep_problems,
            feeling_tired: responses.feeling_tired,
            appetite_problems: responses.appetite_problems,
            feeling_bad_self: responses.feeling_bad_self,
            trouble_concentrating: responses.trouble_concentrating,
            psychomotor_changes: responses.psychomotor_changes,
            suicidal_thoughts: responses.suicidal_thoughts,
            anhedonia_expanded: responses.anhedonia_expanded,
            anhedonia_expanded_conditional: responses.anhedonia_expanded_conditional,
            home_stress_trauma: responses.home_stress_trauma,
            home_stress_trauma_conditional: responses.home_stress_trauma_conditional,
            abuse_exposure: responses.abuse_exposure,
            abuse_exposure_conditional: responses.abuse_exposure_conditional,
            other_information: responses.other_information,
            // Contact and scheduling
            firstName: responses.firstName,
            lastName: responses.lastName,
            email: responses.email,
            scheduling: responses.scheduling
          },
          appointment: {
            selectedDateTime: appointment.selectedDateTime,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime
          },
          organizationId,
          submissionId
        }),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000
        },
        'Oaklet Nest survey submission'
      );

      if (!nestResult.success) {
        throw nestResult.error || new Error('Failed to submit survey to Oaklet Nest');
      }

      const encryptedPHI = await this.encryption.encryptPHI({
        email: responses.email,
        healthResponses: {
          psychiatric_diagnosis_conditional: responses.psychiatric_diagnosis_conditional,
          medical_diagnosis_conditional: responses.medical_diagnosis_conditional,
          psychiatric_hospitalizations_conditional: responses.psychiatric_hospitalizations_conditional,
          family_psychiatric_history_conditional: responses.family_psychiatric_history_conditional,
          academic_difficulties_conditional: responses.academic_difficulties_conditional,
          childhood_trauma_conditional: responses.childhood_trauma_conditional,
          anhedonia_expanded_conditional: responses.anhedonia_expanded_conditional,
          home_stress_trauma_conditional: responses.home_stress_trauma_conditional,
          abuse_exposure_conditional: responses.abuse_exposure_conditional,
          other_information: responses.other_information
        }
      });

      const submission = {
        submissionId,
        submissionDate: new Date().toISOString(),
        patientEmail: responses.email,
        organizationId,
        // ADHD Questionnaire Responses
        psychiatric_diagnosis: responses.psychiatric_diagnosis,
        psychiatric_diagnosis_conditional: responses.psychiatric_diagnosis_conditional,
        medical_diagnosis: responses.medical_diagnosis,
        medical_diagnosis_conditional: responses.medical_diagnosis_conditional,
        current_medications: responses.current_medications,
        psychiatric_hospitalizations: responses.psychiatric_hospitalizations,
        psychiatric_hospitalizations_conditional: responses.psychiatric_hospitalizations_conditional,
        family_psychiatric_history: responses.family_psychiatric_history,
        family_psychiatric_history_conditional: responses.family_psychiatric_history_conditional,
        family_adhd_history: responses.family_adhd_history,
        academic_difficulties: responses.academic_difficulties,
        academic_difficulties_conditional: responses.academic_difficulties_conditional,
        hyperactive_impulsive: responses.hyperactive_impulsive,
        social_difficulties: responses.social_difficulties,
        home_stress: responses.home_stress,
        childhood_trauma: responses.childhood_trauma,
        childhood_trauma_conditional: responses.childhood_trauma_conditional,
        careless_mistakes: responses.careless_mistakes,
        sustaining_attention: responses.sustaining_attention,
        restless_fidgety: responses.restless_fidgety,
        interrupt_others: responses.interrupt_others,
        procrastinate: responses.procrastinate,
        lose_things: responses.lose_things,
        finish_details: responses.finish_details,
        organize_tasks: responses.organize_tasks,
        remember_appointments: responses.remember_appointments,
        delay_starting: responses.delay_starting,
        fidget_sitting: responses.fidget_sitting,
        overly_active: responses.overly_active,
        elevated_mood: responses.elevated_mood,
        increased_energy: responses.increased_energy,
        less_sleep: responses.less_sleep,
        more_talkative: responses.more_talkative,
        risky_behaviors: responses.risky_behaviors,
        mood_problems: responses.mood_problems,
        nervous_anxious: responses.nervous_anxious,
        unable_control_worry: responses.unable_control_worry,
        worrying_too_much: responses.worrying_too_much,
        trouble_relaxing: responses.trouble_relaxing,
        restlessness: responses.restlessness,
        irritability: responses.irritability,
        fear_awful: responses.fear_awful,
        little_interest: responses.little_interest,
        feeling_down: responses.feeling_down,
        sleep_problems: responses.sleep_problems,
        feeling_tired: responses.feeling_tired,
        appetite_problems: responses.appetite_problems,
        feeling_bad_self: responses.feeling_bad_self,
        trouble_concentrating: responses.trouble_concentrating,
        psychomotor_changes: responses.psychomotor_changes,
        suicidal_thoughts: responses.suicidal_thoughts,
        anhedonia_expanded: responses.anhedonia_expanded,
        anhedonia_expanded_conditional: responses.anhedonia_expanded_conditional,
        home_stress_trauma: responses.home_stress_trauma,
        home_stress_trauma_conditional: responses.home_stress_trauma_conditional,
        abuse_exposure: responses.abuse_exposure,
        abuse_exposure_conditional: responses.abuse_exposure_conditional,
        other_information: responses.other_information,
        // Contact info
        firstName: responses.firstName,
        lastName: responses.lastName,
        email: responses.email,
        appointmentId: nestResult.result!.appointmentId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: this.convertToLocalAppointmentTime(appointment.selectedDateTime),
        sessionType: process.env.DEFAULT_SESSION_TYPE,
        appointmentStatus: "scheduled",
        clientId: nestResult.result!.clientId,
        clientType: "pre-registration",
        completedAt: new Date().toISOString(),
        version: "1.0",
        ipAddress: req.ip,
        encryptedPHI,
        status: "completed"
      };

      await this.dynamodb.saveSurveySubmission(submission);

      const confirmationNumber = nestResult.result!.confirmationNumber;
      
      logger.info('Survey submission completed successfully', {
        submissionId,
        appointmentId: nestResult.result!.appointmentId,
        clientId: nestResult.result!.clientId,
        confirmationNumber
      });

      try {
        await this.audit.logSurveySubmission(
          submissionId,
          responses.email,
          organizationId,
          req.ip,
          req.get('User-Agent'),
          true
        );
      } catch (auditError) {
        logger.error('audit.logSurveySubmission failed', {
          submissionId,
          email: responses.email,
          organizationId,
          error: auditError instanceof Error ? auditError.message : 'Unknown error'
        });
      }

      const nextSteps = process.env.SURVEY_NEXT_STEPS 
        ? process.env.SURVEY_NEXT_STEPS.split(',')
        : [
            "Check your email for appointment confirmation",
            "Complete your profile information before the appointment",
            "An invoice will be sent within 24 hours"
          ];

      res.json({
        success: true,
        submissionId,
        appointmentId: nestResult.result!.appointmentId,
        confirmationNumber,
        message: process.env.SURVEY_SUCCESS_MESSAGE || "Survey completed and appointment scheduled successfully!",
        nextSteps
      } as SurveySubmissionResponse);

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      const errorMapping = this.errorMapping.mapError(errorObj);
      
      logger.error('Survey submission failed', {
        submissionId,
        requestId,
        error: errorObj.message,
        stack: errorObj.stack,
        logLevel: errorMapping.logLevel
      });

      try {
        await this.audit.logSurveySubmission(
          submissionId,
          req.body?.responses?.email || 'unknown',
          req.body?.organizationId || process.env.DEFAULT_ORGANIZATION_ID || '',
          req.ip,
          req.get('User-Agent'),
          false
        );
      } catch (auditError) {
        logger.error('Failed to log audit event for failed submission', {
          submissionId,
          auditError: auditError instanceof Error ? auditError.message : 'Unknown error'
        });
      }
      
      res.status(errorMapping.statusCode).json({
        success: false,
        error: errorMapping.userMessage,
        retryAction: errorMapping.retryAction,
        supportMessage: errorMapping.supportMessage,
        submissionId // For support tracking
      } as SurveySubmissionResponse);
    }
  }

  async getSubmission(req: Request, res: Response): Promise<void> {
    const { submissionId } = req.params;

    try {
      const submission = await this.dynamodb.getSurveySubmission(submissionId);
      
      if (!submission) {
        res.status(404).json({
          success: false,
          error: 'Submission not found'
        });
        return;
      }

      const { encryptedPHI, ...safeSubmission } = submission;

      res.json({
        success: true,
        submission: safeSubmission
      });

    } catch (error) {
      logger.error('Failed to retrieve submission', {
        submissionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve submission'
      });
    }
  }

  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    const { date, organizationId = process.env.DEFAULT_ORGANIZATION_ID || '' } = req.query;

    if (!date || typeof date !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      });
      return;
    }

    try {
      const orgId = typeof organizationId === 'string' ? organizationId : process.env.DEFAULT_ORGANIZATION_ID || '';
      const availableSlots = await this.oakletNest.getAvailableSlots(date, orgId);

      res.json({
        success: true,
        date,
        organizationId,
        availableSlots
      });

    } catch (error) {
      logger.error('Failed to get available slots', {
        date,
        organizationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get available slots'
      });
    }
  }

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const [kmsTest, nestTest] = await Promise.allSettled([
        this.encryption.testEncryption(),
        this.oakletNest.testConnection()
      ]);

      const kmsHealthy = kmsTest.status === 'fulfilled' && kmsTest.value;
      const nestHealthy = nestTest.status === 'fulfilled' && nestTest.value;

      const overallHealth = kmsHealthy && nestHealthy;

      res.status(overallHealth ? 200 : 503).json({
        success: overallHealth,
        status: overallHealth ? 'healthy' : 'unhealthy',
        services: {
          kms: kmsHealthy ? 'healthy' : 'unhealthy',
          oakletNest: nestHealthy ? 'healthy' : 'unhealthy'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: 'Health check failed'
      });
    }
  }

  /**
   * Convert local appointment time to UTC and return local time format for storage
   * @param selectedDateTime - The local datetime string from frontend (e.g., "2025-10-02T13:00:00")
   * @returns Local time in HH:MM format (e.g., "13:00" for 1:00 PM local time)
   */
  private convertToLocalAppointmentTime(selectedDateTime: string): string {
    try {
      // Parse as local time (no Z suffix means local timezone)
      const localDate = new Date(selectedDateTime);
      const localHour = localDate.getHours();
      const localMinute = localDate.getMinutes();
      
      return `${localHour.toString().padStart(2, '0')}:${localMinute.toString().padStart(2, '0')}`;
    } catch (error) {
      logger.error('Failed to convert appointment time to local format', {
        selectedDateTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback to original time if conversion fails
      return selectedDateTime.split('T')[1]?.split(':').slice(0, 2).join(':') || '09:00';
    }
  }
}
