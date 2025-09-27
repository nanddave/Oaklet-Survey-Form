import axios from 'axios';
import { logger } from '../config/logger';

export class NestAuthService {
  private baseUrl: string;
  private authEmail: string;
  private authPassword: string;
  private jwtToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    const baseUrl = process.env.OAKLET_NEST_URL;
    if (!baseUrl) {
      throw new Error('OAKLET_NEST_URL environment variable is required');
    }
    this.baseUrl = baseUrl;
    
    this.authEmail = process.env.NEST_AUTH_EMAIL || '';
    this.authPassword = process.env.NEST_AUTH_PASSWORD || '';
    
    if (!this.authEmail || !this.authPassword) {
      throw new Error('NEST_AUTH_EMAIL and NEST_AUTH_PASSWORD are required');
    }
  }

  async getValidToken(): Promise<string> {
    if (this.jwtToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.jwtToken;
    }
    return await this.authenticate();
  }

  private async authenticate(): Promise<string> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
        email: this.authEmail,
        password: this.authPassword
      });

      this.jwtToken = response.data.token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expiresIn * 1000));
      
      logger.info('Successfully authenticated with Nest', {
        expiresAt: this.tokenExpiry
      });

      return this.jwtToken!;
    } catch (error) {
      logger.error('Failed to authenticate with Nest', error);
      throw new Error('Authentication with Nest failed');
    }
  }
}
