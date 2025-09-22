import { ValidationResult } from '../types/survey';

export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

export const validateRequired = (value: string): ValidationResult => {
  if (!value || !value.trim()) {
    return { isValid: false, error: 'This field is required' };
  }
  
  return { isValid: true };
};
