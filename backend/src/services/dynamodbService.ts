import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../config/logger';

export interface SurveySubmission {
  submissionId: string;
  submissionDate: string;
  patientEmail: string;
  organizationId: string;
  
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
  
  // Contact info
  firstName: string;
  lastName: string;
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
          
          // ADHD Questionnaire Responses
          psychiatric_diagnosis: submission.psychiatric_diagnosis,
          psychiatric_diagnosis_conditional: submission.psychiatric_diagnosis_conditional || null,
          medical_diagnosis: submission.medical_diagnosis,
          medical_diagnosis_conditional: submission.medical_diagnosis_conditional || null,
          current_medications: submission.current_medications,
          psychiatric_hospitalizations: submission.psychiatric_hospitalizations,
          psychiatric_hospitalizations_conditional: submission.psychiatric_hospitalizations_conditional || null,
          family_psychiatric_history: submission.family_psychiatric_history,
          family_psychiatric_history_conditional: submission.family_psychiatric_history_conditional || null,
          family_adhd_history: submission.family_adhd_history,
          academic_difficulties: submission.academic_difficulties,
          academic_difficulties_conditional: submission.academic_difficulties_conditional || null,
          hyperactive_impulsive: submission.hyperactive_impulsive,
          social_difficulties: submission.social_difficulties,
          home_stress: submission.home_stress,
          childhood_trauma: submission.childhood_trauma,
          childhood_trauma_conditional: submission.childhood_trauma_conditional || null,
          careless_mistakes: submission.careless_mistakes,
          sustaining_attention: submission.sustaining_attention,
          restless_fidgety: submission.restless_fidgety,
          interrupt_others: submission.interrupt_others,
          procrastinate: submission.procrastinate,
          lose_things: submission.lose_things,
          finish_details: submission.finish_details,
          organize_tasks: submission.organize_tasks,
          remember_appointments: submission.remember_appointments,
          delay_starting: submission.delay_starting,
          fidget_sitting: submission.fidget_sitting,
          overly_active: submission.overly_active,
          elevated_mood: submission.elevated_mood,
          increased_energy: submission.increased_energy,
          less_sleep: submission.less_sleep,
          more_talkative: submission.more_talkative,
          risky_behaviors: submission.risky_behaviors,
          mood_problems: submission.mood_problems,
          nervous_anxious: submission.nervous_anxious,
          unable_control_worry: submission.unable_control_worry,
          worrying_too_much: submission.worrying_too_much,
          trouble_relaxing: submission.trouble_relaxing,
          restlessness: submission.restlessness,
          irritability: submission.irritability,
          fear_awful: submission.fear_awful,
          little_interest: submission.little_interest,
          feeling_down: submission.feeling_down,
          sleep_problems: submission.sleep_problems,
          feeling_tired: submission.feeling_tired,
          appetite_problems: submission.appetite_problems,
          feeling_bad_self: submission.feeling_bad_self,
          trouble_concentrating: submission.trouble_concentrating,
          psychomotor_changes: submission.psychomotor_changes,
          suicidal_thoughts: submission.suicidal_thoughts,
          anhedonia_expanded: submission.anhedonia_expanded,
          anhedonia_expanded_conditional: submission.anhedonia_expanded_conditional || null,
          home_stress_trauma: submission.home_stress_trauma,
          home_stress_trauma_conditional: submission.home_stress_trauma_conditional || null,
          abuse_exposure: submission.abuse_exposure,
          abuse_exposure_conditional: submission.abuse_exposure_conditional || null,
          other_information: submission.other_information,
          // Contact info
          firstName: submission.firstName,
          lastName: submission.lastName,
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
      hasEmail: !!patientEmail,
      count: result.Items?.length || 0
    });

    return (result.Items || []) as SurveySubmission[];
  }
}
