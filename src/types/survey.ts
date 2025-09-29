export interface SurveyQuestion {
  id: string;
  type: 'radio' | 'dropdown' | 'email' | 'contact' | 'scheduling' | 'likert' | 'textarea' | 'yesno';
  question: string;
  subtitle?: string;
  options?: string[];
  placeholder?: string;
  required: boolean;
  conditionalLogic?: {
    showIf: { questionId: string; answer: string };
  };
  conditionalFields?: {
    showIf: { questionId: string; answer: string };
    fieldType: 'textarea' | 'text';
    placeholder?: string;
  };
}

export interface SurveyResponse {
  questionId: string;
  answer: string;
}

export interface SurveyState {
  currentStep: number;
  responses: Record<string, string>; // Changed from SurveyResponse[] to object
  isComplete: boolean;
  totalSteps: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}
