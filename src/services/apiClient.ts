import axios, { AxiosResponse } from 'axios';
import { config } from '../config/environment';

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
      console.log('🔧 API Client - Submitting to:', `${config.api.baseUrl}/api/survey/submit`);
      console.log('🔧 API Client - Data:', data);
      const response: AxiosResponse<SurveySubmissionResponse> = await this.api.post('/api/survey/submit', data);
      console.log('🔧 API Client - Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('🔧 API Client - Error submitting survey:', error);
      console.error('🔧 API Client - Error details:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Network error'
      };
    }
  }
}

export const apiClient = new ApiClient();
