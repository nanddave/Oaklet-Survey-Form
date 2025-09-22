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
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002',
    serviceToken: import.meta.env.VITE_SERVICE_TOKEN || '',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10)
  },
  organization: {
    defaultId: import.meta.env.VITE_DEFAULT_ORG_ID || 'be750795-0b43-43e4-8b7a-cfa9a71b23ef'
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
  console.log('🔧 Frontend Config Debug:', {
    baseUrl: config.api.baseUrl,
    orgId: config.organization.defaultId,
    envOrgId: import.meta.env.VITE_DEFAULT_ORG_ID,
    isDev: import.meta.env.DEV
  });
  
  if (!config.api.baseUrl) {
    console.error('VITE_API_BASE_URL is required');
  }
  
  if (!config.organization.defaultId) {
    console.error('VITE_DEFAULT_ORG_ID is required');
  }
  
  if (!config.api.serviceToken && import.meta.env.PROD) {
    console.error('VITE_SERVICE_TOKEN is required in production');
  }
};

validateConfig();

export { config };
export const isDevelopment = () => import.meta.env.DEV;
export const isProduction = () => import.meta.env.PROD;
