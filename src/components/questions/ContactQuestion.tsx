import { useState } from 'react';
import { ValidationResult } from '../../types/survey';
import { validateEmail } from '../../utils/validation';
import { config } from '../../config/environment';

interface ContactQuestionProps {
  questionId: string;
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  validation?: ValidationResult;
  surveyResponses?: Record<string, string>;
}

interface ContactData {
  firstName: string;
  lastName: string;
  email: string;
}

export const ContactQuestion = ({ 
  questionId,
  value, 
  onChange, 
  required = false
}: ContactQuestionProps) => {
  const [contactData, setContactData] = useState<ContactData>(() => {
    try {
      return value ? JSON.parse(value) : { firstName: '', lastName: '', email: '' };
    } catch {
      return { firstName: '', lastName: '', email: '' };
    }
  });
  
  const [emailCheckStatus, setEmailCheckStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  const [emailCheckMessage, setEmailCheckMessage] = useState<string>('');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleInputChange = (field: keyof ContactData, inputValue: string) => {
    const updatedData = { ...contactData, [field]: inputValue };
    setContactData(updatedData);
    
    const canProceed = updatedData.firstName.trim() && 
                      updatedData.lastName.trim() && 
                      updatedData.email.trim() && 
                      validateEmail(updatedData.email)?.isValid && 
                      emailCheckStatus !== 'taken';
    
    const dataWithStatus = {
      ...updatedData,
      _emailStatus: emailCheckStatus,
      _canProceed: canProceed
    };
    onChange(JSON.stringify(dataWithStatus));
    
    if (field === 'email' && inputValue.trim()) {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      const newTimeout = setTimeout(() => {
        checkEmailAvailability(inputValue.trim());
      }, 500);
      
      setDebounceTimeout(newTimeout);
    }
  };

  const checkEmailAvailability = async (email: string) => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailCheckStatus(null);
      setEmailCheckMessage('');
      return;
    }

    setEmailCheckStatus('checking');
    setEmailCheckMessage('Checking email availability...');

    try {
      const response = await fetch(`${config.api.baseUrl}/api/survey/check-email?email=${encodeURIComponent(email)}`);
      const result = await response.json();

      if (result.success) {
        if (result.available) {
          setEmailCheckStatus('available');
          setEmailCheckMessage('✓ Email available');
        } else {
          setEmailCheckStatus('taken');
          setEmailCheckMessage('✗ This email already has an appointment. Please use a different email.');
        }
      } else {
        setEmailCheckStatus(null);
        setEmailCheckMessage('Unable to verify email availability');
      }
    } catch (error) {
      setEmailCheckStatus(null);
      setEmailCheckMessage('Unable to verify email availability');
    }
  };

  const emailValidation = contactData.email ? validateEmail(contactData.email) : undefined;
  const hasError = (emailValidation && !emailValidation.isValid) || emailCheckStatus === 'taken';
  
  

  return (
    <div className="form-group">
      <div className="testimonial" style={{ marginBottom: '1.5rem' }}>
        <div className="testimonial-content" style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderLeft: '4px solid #22c55e',
          borderRadius: '8px',
          padding: '1rem',
          fontStyle: 'italic',
          fontSize: '0.95rem',
          color: '#374151',
          marginBottom: '0.75rem'
        }}>
          "I was nervous to start, but the care and understanding from my clinician made 
          all the difference - I finally felt seen and supported."
        </div>
        <div className="testimonial-author" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.875rem'
        }}>
          <div className="author-avatar" style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.875rem'
          }}>
            MC
          </div>
          <div className="author-info">
            <div className="author-name" style={{ fontWeight: '600', color: '#374151' }}>
              Mariel Cortes
            </div>
            <div className="author-location" style={{ color: '#6b7280' }}>
              Miami, Florida
            </div>
          </div>
          <div className="rating" style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div className="stars" style={{ color: '#22c55e', fontWeight: '600' }}>
              ★ 4.9
            </div>
            <div className="date" style={{ color: '#6b7280', fontSize: '0.75rem' }}>
              June 2025
            </div>
          </div>
        </div>
      </div>
      
      <div className="contact-inputs">
        <div className="name-inputs">
          <div className="input-group">
            <input
              type="text"
              id={`${questionId}-firstName`}
              name={`${questionId}-firstName`}
              value={contactData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="First name*"
              required={required}
              className={hasError && !contactData.firstName ? 'error' : ''}
            />
          </div>
          
          <div className="input-group">
            <input
              type="text"
              id={`${questionId}-lastName`}
              name={`${questionId}-lastName`}
              value={contactData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Last name*"
              required={required}
              className={hasError && !contactData.lastName ? 'error' : ''}
            />
          </div>
        </div>
        
        <div className="input-group">
          <input
            type="email"
            id={`${questionId}-email`}
            name={`${questionId}-email`}
            value={contactData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Email address*"
            required={required}
            className={hasError && !contactData.email ? 'error' : ''}
          />
        </div>
        
        <div className="privacy-indicators">
          <div className="indicator">
            <span>🔒</span>
            <span>PRIVACY SECURED</span>
          </div>
          <div className="indicator">
            <span>🏥</span>
            <span>HIPAA-COMPLIANT</span>
          </div>
        </div>
        
        {hasError && emailValidation?.error && (
          <div className="error-message">
            {emailValidation.error}
          </div>
        )}
        
        {emailCheckMessage && (
          <div className={`email-status-message ${emailCheckStatus === 'taken' ? 'error' : emailCheckStatus === 'available' ? 'success' : 'info'}`} style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: emailCheckStatus === 'taken' ? '#dc2626' : emailCheckStatus === 'available' ? '#059669' : '#6b7280'
          }}>
            {emailCheckMessage}
          </div>
        )}
      </div>
    </div>
  );
};
