import axios, { AxiosResponse } from 'axios';
import { logger } from '../config/logger';
import { NestAuthService } from './nestAuthService';

export interface PreRegistrationClient {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  status: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  metadata: {
    referralSource: string;
    notes: string;
  };
}

export interface CreatedClient {
  clientId: string;
  email: string;
  status: string;
}

export interface AppointmentData {
  clientId: string;
  sessionType: string;
  appointmentDate: string;
  appointmentTime: string;
  organizationId: string;
  notes?: string;
}

export interface CreatedAppointment {
  appointmentId: string;
  clientId: string;
  appointmentDate: string;
  appointmentTime: string;
  sessionType: string;
  status: string;
}

export class OakletNestService {
  private baseUrl: string;
  private nestAuth: NestAuthService;

  constructor() {
    const baseUrl = process.env.OAKLET_NEST_URL;
    if (!baseUrl) {
      throw new Error('OAKLET_NEST_URL environment variable is required');
    }
    this.baseUrl = baseUrl;
    this.nestAuth = new NestAuthService();
  }

  async createPreRegistrationClient(email: string, state: string, surveySubmissionId: string): Promise<CreatedClient> {
    const preRegClientData: PreRegistrationClient = {
      firstName: process.env.DEFAULT_CLIENT_FIRST_NAME || "Survey",
      lastName: process.env.DEFAULT_CLIENT_LAST_NAME || "User",
      email,
      phone: process.env.DEFAULT_CLIENT_PHONE || "000-000-0000",
      dateOfBirth: process.env.DEFAULT_CLIENT_DOB || "1990-01-01",
      status: "Pending",
      address: {
        street: process.env.DEFAULT_CLIENT_STREET || "",
        city: process.env.DEFAULT_CLIENT_CITY || "",
        state,
        zipCode: process.env.DEFAULT_CLIENT_ZIP || ""
      },
      metadata: {
        referralSource: "survey-form",
        notes: `Pre-registration client from survey submission: ${surveySubmissionId}`
      }
    };

    const token = await this.nestAuth.getValidToken();
    
    const response: AxiosResponse<CreatedClient> = await axios.post(
      `${this.baseUrl}/api/clients`,
      preRegClientData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    logger.info('Successfully created pre-registration client', {
      clientId: response.data.clientId,
      email: response.data.email
    });

    return response.data;
  }

  async createAppointment(appointmentData: AppointmentData): Promise<CreatedAppointment> {
    const token = await this.nestAuth.getValidToken();
    
    const response: AxiosResponse<CreatedAppointment> = await axios.post(
      `${this.baseUrl}/api/appointments`,
      appointmentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    logger.info('Successfully created appointment', {
      appointmentId: response.data.appointmentId,
      clientId: response.data.clientId
    });

    return response.data;
  }

  async getAvailableSlots(date: string, organizationId: string): Promise<string[]> {
    const token = await this.nestAuth.getValidToken();
    
    const response = await axios.get(
      `${this.baseUrl}/api/survey/availability`,
      {
        params: { date, organizationId },
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 5000
      }
    );
    
    logger.info('Successfully fetched available slots', {
      date,
      organizationId,
      slotCount: response.data.availableSlots?.length || 0
    });

    return response.data.availableSlots || [];
  }

  async submitSurvey(surveyData: any): Promise<{ clientId: string; appointmentId: string; confirmationNumber: string }> {
    const token = await this.nestAuth.getValidToken();

    const response = await axios.post(
      `${this.baseUrl}/api/survey/submit`,
      surveyData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    logger.info('Successfully submitted survey to Nest', {
      clientId: response.data.clientId,
      appointmentId: response.data.appointmentId
    });

    return response.data;
  }

  async testConnection(): Promise<boolean> {
    try {
      const token = await this.nestAuth.getValidToken();
      
      const response = await axios.get(
        `${this.baseUrl}/api/survey/test`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 5000
        }
      );
      
      logger.info('Oaklet-Nest connection test successful', {
        status: response.status,
        url: this.baseUrl
      });
      
      return response.status === 200;
    } catch (error) {
      logger.error('Oaklet-Nest connection test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: this.baseUrl
      });
      return false;
    }
  }
}
