import axios, { AxiosResponse } from 'axios';
import { config } from '../config/environment';

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
  organizationId: string;
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

class ApiClient {
  private api = axios.create({
    baseURL: config.api.baseUrl,
    timeout: config.api.timeout,
    headers: {
      'Content-Type': 'application/json',
      ...(config.api.serviceToken && { 'X-Service-Token': config.api.serviceToken })
    }
  });

  async submitSurvey(data: SurveySubmissionRequest): Promise<SurveySubmissionResponse> {
    try {
      const response: AxiosResponse<SurveySubmissionResponse> = await this.api.post('/api/survey/submit', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Network error'
      };
    }
  }
}

export const apiClient = new ApiClient();
