/**
 * Audit Service
 * Handles audit logging for survey submissions and compliance
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../config/logger';

export interface AuditEvent {
  eventId: string;
  eventType: string;
  userId?: string;
  organizationId: string;
  practiceId?: string;
  resource: string;
  action: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  ttl: number;
}

export class AuditService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const config: any = {
      region: process.env.AWS_REGION || 'us-east-1'
    };
    
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      };
    }
    
    const dynamoClient = new DynamoDBClient(config);
    this.docClient = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.AUDIT_TABLE || 'Oaklet_Nest_AuditTrail';
  }

  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'eventId' | 'timestamp' | 'ttl'>): Promise<void> {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timestamp = now.toISOString();
      
      const auditEvent: AuditEvent = {
        ...event,
        eventId: `survey-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
      };

      const item = {
        pk: `AUDIT#${dateStr}`,
        sk: `TIME#${timestamp}#EVENT#${auditEvent.eventId}`,
        GSI1PK: `USER#${event.userId || 'anonymous'}`,
        GSI1SK: timestamp,
        GSI2PK: `EVENT#${event.eventType}`,
        GSI2SK: timestamp,
        ...auditEvent
      };

      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: item
      }));

      logger.info('Audit event logged', {
        eventId: auditEvent.eventId,
        eventType: event.eventType,
        resource: event.resource,
        action: event.action
      });

    } catch (error) {
      logger.error('Failed to log audit event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventType: event.eventType
      });
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Log survey submission attempt
   */
  async logSurveySubmission(
    submissionId: string,
    email: string,
    organizationId: string,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true
  ): Promise<void> {
    await this.logEvent({
      eventType: success ? 'SURVEY_SUBMISSION_SUCCESS' : 'SURVEY_SUBMISSION_FAILED',
      organizationId,
      resource: 'survey',
      action: 'submit',
      metadata: {
        submissionId,
        email,
        success,
        application: 'Survey-Form'
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log email check attempt
   */
  async logEmailCheck(
    email: string,
    organizationId: string,
    available: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'EMAIL_CHECK',
      organizationId,
      resource: 'email',
      action: 'check_availability',
      metadata: {
        email,
        available,
        application: 'Survey-Form'
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(
    identifier: string,
    organizationId: string,
    limit: number,
    period: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'RATE_LIMIT_EXCEEDED',
      organizationId,
      resource: 'rate_limit',
      action: 'exceeded',
      metadata: {
        identifier,
        limit,
        period,
        application: 'Survey-Form'
      },
      ipAddress,
      userAgent
    });
  }

  /**
   * Log validation failure
   */
  async logValidationFailure(
    submissionId: string,
    email: string,
    organizationId: string,
    errors: string[],
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'SURVEY_VALIDATION_FAILED',
      organizationId,
      resource: 'survey',
      action: 'validate',
      metadata: {
        submissionId,
        email,
        errors,
        application: 'Survey-Form'
      },
      ipAddress,
      userAgent
    });
  }
}
