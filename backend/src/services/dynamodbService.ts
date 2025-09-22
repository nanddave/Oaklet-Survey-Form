import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../config/logger';

export interface SurveySubmission {
  submissionId: string;
  submissionDate: string;
  patientEmail: string;
  organizationId: string;
  
  // Survey responses (all in one row)
  q1: string;
  q2?: string;
  q3: string;
  q4?: string;
  q5: string;
  location: string;
  email: string;
  
  // Appointment details
  appointmentId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  sessionType?: string;
  appointmentStatus?: string;
  
  // Client info
  clientId?: string;
  clientType?: string;
  
  // Metadata
  completedAt: string;
  version: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Encrypted sensitive data
  encryptedPHI?: string;
  
  // Status
  status: string;
}

export class DynamoDBService {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
    
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.QUESTIONNAIRE_RESPONSES_TABLE || 'Question_Responses';
  }

  async saveSurveySubmission(submission: SurveySubmission): Promise<void> {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `RESPONSE#${submission.submissionId}`,       // Primary key
          sk: 'METADATA',                                 // Sort key
          submissionId: submission.submissionId,
          submissionDate: submission.submissionDate,
          patientEmail: submission.patientEmail,
          organizationId: submission.organizationId,
          
          // All survey responses in one row
          q1: submission.q1,
          q2: submission.q2 || null,
          q3: submission.q3,
          q4: submission.q4 || null,
          q5: submission.q5,
          location: submission.location,
          email: submission.email,
          
          // Appointment details
          appointmentId: submission.appointmentId || null,
          appointmentDate: submission.appointmentDate || null,
          appointmentTime: submission.appointmentTime || null,
          sessionType: submission.sessionType || null,
          appointmentStatus: submission.appointmentStatus || null,
          
          // Client info
          clientId: submission.clientId || null,
          clientType: submission.clientType || null,
          
          // Metadata
          completedAt: submission.completedAt,
          version: submission.version,
          ipAddress: submission.ipAddress || null,
          userAgent: submission.userAgent || null,
          
          // Encrypted sensitive data
          encryptedPHI: submission.encryptedPHI || null,
          
          // Status
          status: submission.status,
          
          // TTL for automatic cleanup (optional - 2 years from now)
          ttl: Math.floor(Date.now() / 1000) + (2 * 365 * 24 * 60 * 60)
        }
      });

    await this.client.send(command);
    
    logger.info('Successfully saved survey submission to DynamoDB', {
      submissionId: submission.submissionId,
      patientEmail: submission.patientEmail,
      organizationId: submission.organizationId
    });
  }

  async getSurveySubmission(submissionId: string): Promise<SurveySubmission | null> {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { 
          pk: `RESPONSE#${submissionId}`,
          sk: 'METADATA'
        }
      });

    const result = await this.client.send(command);
    
    if (!result.Item) {
      logger.warn('Survey submission not found', { submissionId });
      return null;
    }

    logger.info('Successfully retrieved survey submission', { submissionId });
    return result.Item as SurveySubmission;
  }

  async getSubmissionsByOrganization(organizationId: string, limit: number = 100): Promise<SurveySubmission[]> {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'organizationId = :orgId',
        ExpressionAttributeValues: {
          ':orgId': organizationId
        },
        Limit: limit
      });

    const result = await this.client.send(command);
    
    logger.info('Successfully retrieved submissions by organization', {
      organizationId,
      count: result.Items?.length || 0
    });

    return (result.Items || []) as SurveySubmission[];
  }

  async getSubmissionsByEmail(patientEmail: string): Promise<SurveySubmission[]> {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'patientEmail = :email',
        ExpressionAttributeValues: {
          ':email': patientEmail
        }
      });

    const result = await this.client.send(command);
    
    logger.info('Successfully retrieved submissions by email', {
      patientEmail,
      count: result.Items?.length || 0
    });

    return (result.Items || []) as SurveySubmission[];
  }
}
