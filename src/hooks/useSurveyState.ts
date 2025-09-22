import { useState, useEffect } from 'react';
import { SurveyState, SurveyQuestion } from '../types/survey';
import { surveyQuestions } from '../data/questions';

const STORAGE_KEY = 'survey_responses';

export const useSurveyState = () => {
  const [surveyState, setSurveyState] = useState<SurveyState>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          currentStep: parsed.currentStep || 0,
          responses: parsed.responses || [],
          isComplete: parsed.isComplete || false,
          totalSteps: surveyQuestions.length
        };
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to parse saved survey data:', error);
        }
      }
    }
    
    return {
      currentStep: 0,
      responses: {},
      isComplete: false,
      totalSteps: surveyQuestions.length
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(surveyState));
  }, [surveyState]);

  const updateResponse = (questionId: string, answer: string) => {
    setSurveyState(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [questionId]: answer
      }
    }));
  };

  const getResponse = (questionId: string): string | undefined => {
    return surveyState.responses[questionId];
  };

  const shouldShowQuestion = (question: SurveyQuestion): boolean => {
    if (!question.conditionalLogic) return true;
    
    const { showIf } = question.conditionalLogic;
    const dependentResponse = getResponse(showIf.questionId);
    
    return dependentResponse === showIf.answer;
  };

  const getVisibleQuestions = (): SurveyQuestion[] => {
    return surveyQuestions.filter(shouldShowQuestion);
  };

  const getCurrentQuestion = (): SurveyQuestion | null => {
    const visibleQuestions = getVisibleQuestions();
    return visibleQuestions[surveyState.currentStep] || null;
  };

  // Use consistent total steps (all questions minus conditional ones that won't show)
  // Total: 8 questions, but Q2 and Q4 are mutually exclusive, so max visible is 7
  const actualTotalSteps = 7;

  const canGoNext = (): boolean => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return false;
    
    const response = getResponse(currentQuestion.id);
    if (!currentQuestion.required) return true;
    if (!response) return false;
    
    // Special validation for contact question
    if (currentQuestion.type === 'contact') {
      try {
        const contactData = JSON.parse(response);
        // Block progression if email is taken
        return contactData._emailStatus !== 'taken' && contactData._canProceed !== false;
      } catch {
        return false;
      }
    }
    
    return true;
  };

  const canGoPrevious = (): boolean => {
    return surveyState.currentStep > 0;
  };

  const nextStep = () => {
    setSurveyState(prev => {
      const visibleQuestions = getVisibleQuestions();
      const isLastStep = prev.currentStep >= visibleQuestions.length - 1;
      
      return {
        ...prev,
        currentStep: isLastStep ? prev.currentStep : prev.currentStep + 1,
        isComplete: isLastStep,
        totalSteps: visibleQuestions.length
      };
    });
  };

  const previousStep = () => {
    if (!canGoPrevious()) return;
    
    setSurveyState(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1,
      isComplete: false
    }));
  };

  const resetSurvey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSurveyState({
      currentStep: 0,
      responses: {},
      isComplete: false,
      totalSteps: actualTotalSteps
    });
    // Force page reload to ensure clean state
    window.location.reload();
  };

  const visibleQuestions = getVisibleQuestions();
  const currentQuestion = getCurrentQuestion();

  return {
    surveyState: {
      ...surveyState,
      totalSteps: actualTotalSteps
    },
    currentQuestion,
    visibleQuestions,
    updateResponse,
    getResponse,
    nextStep,
    previousStep,
    canGoNext,
    canGoPrevious,
    resetSurvey
  };
};
