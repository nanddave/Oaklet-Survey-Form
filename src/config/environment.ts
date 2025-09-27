/**
 * Survey Form Environment Configuration
 * @copyright (c) 2025 Oaklet
 * 
 * Centralized environment configuration for the Survey Form.
 * Removes hardcoded values and provides proper environment management.
 */

export interface SurveyConfig {
  api: {
    baseUrl: string;
    serviceToken: string;
    timeout: number;
  };
  organization: {
    defaultId: string;
  };
  client: {
    landingPageMode: boolean;
    embedMode: boolean;
  };
  cors: {
    allowedOrigins: string[];
  };
}

// Load environment variables with proper defaults
const config: SurveyConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    serviceToken: import.meta.env.VITE_SERVICE_TOKEN || '',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10)
  },
  organization: {
    defaultId: import.meta.env.VITE_DEFAULT_ORG_ID
  },
  client: {
    landingPageMode: import.meta.env.VITE_LANDING_PAGE_MODE === 'true',
    embedMode: import.meta.env.VITE_EMBED_MODE === 'true'
  },
  cors: {
    allowedOrigins: import.meta.env.VITE_ALLOWED_ORIGINS?.split(',') || []
  }
};

// Validation
const validateConfig = (): void => {
  const requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_DEFAULT_ORG_ID'
  ];
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  if (!config.api.serviceToken && import.meta.env.PROD) {
    throw new Error('VITE_SERVICE_TOKEN is required in production');
  }
  
};

validateConfig();

export { config };
export const isDevelopment = () => import.meta.env.DEV;
export const isProduction = () => import.meta.env.PROD;
