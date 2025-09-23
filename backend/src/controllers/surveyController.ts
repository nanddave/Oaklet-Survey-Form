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

export interface SurveySubmissionRequest {
  responses: {
    q1: string;
    q2?: string;
    q3: string;
    q4?: string;
    q5: string;
    location: string;
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
      // Check Question_Responses table for existing email
      const existingSubmissions = await this.dynamodb.getSubmissionsByEmail(email);
      const isAvailable = existingSubmissions.length === 0;

      logger.info('Email availability check completed', {
        requestId,
        email,
        isAvailable,
        existingCount: existingSubmissions.length
      });

      // Log audit event
      await this.audit.logEmailCheck(
        email,
        process.env.DEFAULT_ORGANIZATION_ID || '',
        isAvailable,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        email,
        available: isAvailable
      });
    } catch (error) {
      logger.error('Email availability check failed', {
        requestId,
        email,
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

      // Prepare submission data for validation
      const submissionData = {
        responses: {
          firstName: responses.firstName,
          lastName: responses.lastName,
          email: responses.email,
          q1: responses.q1,
          q2: responses.q2,
          q3: responses.q3,
          q4: responses.q4,
          q5: responses.q5,
          location: responses.location,
          scheduling: responses.scheduling
        },
        appointment: {
          selectedDateTime: appointment.selectedDateTime,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime
        },
        organizationId,
        submissionId
      };

      // Validate submission using validation service
      const validationResult = await this.validation.validateSubmission(submissionData);
      
      if (!validationResult.isValid) {
        logger.warn('Survey validation failed', {
          submissionId,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        });

        // Log validation failure
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

      // Log warnings if any
      if (validationResult.warnings.length > 0) {
        logger.info('Survey validation warnings', {
          submissionId,
          warnings: validationResult.warnings
        });
      }

      // 1. Submit survey to Nest with retry logic
      const nestResult = await this.retry.executeWithConditionalRetry(
        () => this.oakletNest.submitSurvey({
          responses: {
            q1: responses.q1,
            q2: responses.q2,
            q3: responses.q3,
            q4: responses.q4,
            q5: responses.q5,
            location: responses.location,
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

      // 3. Encrypt sensitive health data
      const encryptedPHI = await this.encryption.encryptPHI({
        email: responses.email,
        healthResponses: {
          q2: responses.q2,
          q3: responses.q3,
          q4: responses.q4,
          q5: responses.q5
        }
      });

      // 4. Save survey submission to DynamoDB (flat structure for DynamoDB)
      const submission = {
        submissionId,
        submissionDate: new Date().toISOString(),
        patientEmail: responses.email,
        organizationId,
        // Survey responses (flat fields)
        q1: responses.q1,
        q2: responses.q2,
        q3: responses.q3,
        q4: responses.q4,
        q5: responses.q5,
        location: responses.location,
        firstName: responses.firstName,
        lastName: responses.lastName,
        email: responses.email,
        // Appointment details (flat fields)
        appointmentId: nestResult.result!.appointmentId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        sessionType: process.env.DEFAULT_SESSION_TYPE || "Initial Consultation",
        appointmentStatus: "scheduled",
        // Client info (flat fields)
        clientId: nestResult.result!.clientId,
        clientType: "pre-registration",
        // Metadata (flat fields)
        completedAt: new Date().toISOString(),
        version: "1.0",
        ipAddress: req.ip,
        encryptedPHI,
        status: "completed"
      };

      await this.dynamodb.saveSurveySubmission(submission);

      // 5. Return success response
      const confirmationNumber = nestResult.result!.confirmationNumber;
      
      logger.info('Survey submission completed successfully', {
        submissionId,
        appointmentId: nestResult.result!.appointmentId,
        clientId: nestResult.result!.clientId,
        confirmationNumber
      });

      // Log successful submission
      await this.audit.logSurveySubmission(
        submissionId,
        responses.email,
        organizationId,
        req.ip,
        req.get('User-Agent'),
        true
      );

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
      
      // Map error to user-friendly response
      const errorMapping = this.errorMapping.mapError(errorObj);
      
      logger.error('Survey submission failed', {
        submissionId,
        requestId,
        error: errorObj.message,
        stack: errorObj.stack,
        logLevel: errorMapping.logLevel
      });

      // Log failed submission
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

      // Don't return encrypted PHI in GET requests for security
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
      // Test all services
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
}
