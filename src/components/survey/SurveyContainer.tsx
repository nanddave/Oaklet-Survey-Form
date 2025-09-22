import { ProgressIndicator } from '../common/ProgressIndicator';
import { Button } from '../common/Button';
import { RadioQuestion } from '../questions/RadioQuestion';
import { DropdownQuestion } from '../questions/DropdownQuestion';
import { ContactQuestion } from '../questions/ContactQuestion';
import { SchedulingQuestion } from '../questions/SchedulingQuestion';
import { useSurveyState } from '../../hooks/useSurveyState';
import { useLocalStorage } from '../../hooks/useLocalStorage';
// import { validateEmail } from '../../utils/validation';
import { apiClient } from '../../services/apiClient';
import { config } from '../../config/environment';
import { useEffect, useState } from 'react';

export const SurveyContainer = () => {
  const {
    surveyState,
    currentQuestion,
    updateResponse,
    getResponse,
    nextStep,
    previousStep,
    canGoNext,
    canGoPrevious,
    resetSurvey
  } = useSurveyState();

  const { addSubmission, totalSubmissions } = useLocalStorage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState<any>(null);

  // Handle survey completion and submission to backend
  useEffect(() => {
    if (surveyState.isComplete && surveyState.responses && !isSubmitting && !submissionResult) {
      handleSurveyCompletion();
    }
  }, [surveyState.isComplete, surveyState.responses, isSubmitting, submissionResult]);

  const handleSurveyCompletion = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Extract contact information from contactInfo response
      let contactData = { firstName: '', lastName: '', email: '' };
      try {
        if (surveyState.responses.contactInfo) {
          contactData = JSON.parse(surveyState.responses.contactInfo);
        }
      } catch (e) {
        console.error('Error parsing contact data:', e);
      }

      // Prepare submission data
      const submissionData = {
        responses: {
          q1: surveyState.responses.q1 || '',
          q2: surveyState.responses.q2,
          q3: surveyState.responses.q3 || '',
          q4: surveyState.responses.q4,
          q5: surveyState.responses.q5 || '',
          location: surveyState.responses.location || '',
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email,
          scheduling: surveyState.responses.scheduling || ''
        },
        appointment: {
          selectedDateTime: surveyState.responses.scheduling || '',
          appointmentDate: surveyState.responses.scheduling?.split('T')[0] || '',
          appointmentTime: surveyState.responses.scheduling?.split('T')[1]?.replace(':00Z', '') || ''
        },
        organizationId: config.organization.defaultId
      };

      // Store submission data for display
      setSubmissionData(submissionData);

      // Submit to backend
      console.log('🔧 Submitting Survey Data:', submissionData);
      const result = await apiClient.submitSurvey(submissionData);
      console.log('🔧 Survey Submission Result:', result);

      if (result.success) {
        setSubmissionResult(result);
        
        // Store locally for backup
        addSubmission(surveyState.responses, {
          appointmentId: result.appointmentId,
          appointmentDate: submissionData.appointment.appointmentDate,
          appointmentTime: submissionData.appointment.appointmentTime,
          sessionType: 'Initial Consultation'
        });

        // Notify parent window if in widget mode
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'survey.completed',
            result
          }, '*');
        }
      } else {
        setSubmissionError(result.error || 'Submission failed');
        
        // Notify parent window of error
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'survey.error',
            error: result
          }, '*');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmissionError(errorMessage);
      
      // Still store locally as backup
      addSubmission(surveyState.responses, {
        appointmentDate: surveyState.responses.scheduling?.split('T')[0],
        appointmentTime: surveyState.responses.scheduling?.split('T')[1]?.replace(':00Z', ''),
        sessionType: 'Initial Consultation'
      });

      // Notify parent window of error
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'survey.error',
          error: { message: errorMessage }
        }, '*');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (surveyState.isComplete) {
    return (
      <div className="survey-container">
        <div className="survey-card">
          <div className="survey-header">
            <div className="logo">
              <h2>Oaklet.com</h2>
            </div>
          </div>
          
          <div className="survey-main">
            <div className="question-header">
              <h1 className="question-title">Thank you!</h1>
              
              {isSubmitting && (
                <div style={{ 
                  background: '#fef3c7', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginTop: '1rem',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#92400e' }}>
                    ⏳ Submitting your survey and scheduling appointment...
                  </p>
                </div>
              )}

              {submissionResult && (
                <div style={{ 
                  background: '#d1fae5', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginTop: '1rem',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#065f46' }}>
                    ✅ {submissionResult.message}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#047857' }}>
                    Confirmation: <strong>{submissionResult.confirmationNumber}</strong>
                  </p>
                  
                  {/* Patient Details */}
                  <div style={{ marginTop: '1rem', textAlign: 'left', background: '#f0fdf4', padding: '1rem', borderRadius: '6px' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#065f46' }}>Appointment Details:</p>
                    <div style={{ color: '#047857', fontSize: '0.9rem' }}>
                      {(() => {
                        let contactData = { firstName: '', lastName: '', email: '' };
                        try {
                          if (surveyState.responses.contactInfo) {
                            contactData = JSON.parse(surveyState.responses.contactInfo);
                          }
                        } catch (e) {
                          console.error('Error parsing contact data:', e);
                        }
                        return (
                          <>
                            <p style={{ margin: '0.25rem 0' }}>
                              <strong>Patient:</strong> {contactData.firstName} {contactData.lastName}
                            </p>
                            <p style={{ margin: '0.25rem 0' }}>
                              <strong>Email:</strong> {contactData.email}
                            </p>
                            <p style={{ margin: '0.25rem 0' }}>
                              <strong>Appointment Date:</strong> {submissionData?.appointment?.appointmentDate || 'N/A'}
                            </p>
                            <p style={{ margin: '0.25rem 0' }}>
                              <strong>Appointment Time:</strong> {submissionData?.appointment?.appointmentTime || 'N/A'}
                            </p>
                            <p style={{ margin: '0.25rem 0' }}>
                              <strong>Session Type:</strong> Initial Consultation
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {submissionResult.nextSteps && (
                    <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#065f46' }}>Next Steps:</p>
                      <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#047857' }}>
                        {submissionResult.nextSteps.map((step: string, index: number) => (
                          <li key={index} style={{ marginBottom: '0.25rem' }}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {submissionError && (
                <div style={{ 
                  background: '#fee2e2', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginTop: '1rem',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#dc2626' }}>
                    ❌ {submissionError}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#b91c1c' }}>
                    Your responses have been saved locally as a backup.
                  </p>
                </div>
              )}

              <div style={{ 
                background: '#f0f9ff', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginTop: '1rem',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#0369a1' }}>
                  Total Submissions Stored: {totalSubmissions}
                </p>
              </div>
            </div>
            
            
            
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button 
                variant="secondary" 
                onClick={resetSurvey}
              >
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="survey-container">
        <div className="survey-card">
          <div className="survey-header">
            <div className="logo">
              <h2>Oaklet.com</h2>
            </div>
          </div>
          
          <div className="survey-main">
            <div className="question-header">
              <h1 className="question-title">Loading...</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentValue = getResponse(currentQuestion.id);

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'radio':
        return (
          <RadioQuestion
            questionId={currentQuestion.id}
            question={currentQuestion.question}
            options={currentQuestion.options || []}
            value={currentValue}
            onChange={(value) => {
              updateResponse(currentQuestion.id, value);
              // Auto-advance immediately since we have the response value
              // Don't rely on canGoNext() since state update is async
              if (value) {
                setTimeout(() => nextStep(), 300);
              }
            }}
            required={currentQuestion.required}
          />
        );
        
      case 'dropdown':
        return (
          <DropdownQuestion
            questionId={currentQuestion.id}
            question={currentQuestion.question}
            options={currentQuestion.options || []}
            value={currentValue}
            onChange={(value) => {
              updateResponse(currentQuestion.id, value);
              // Auto-advance immediately since we have the response value
              // Don't rely on canGoNext() since state update is async
              if (value) {
                setTimeout(() => nextStep(), 500);
              }
            }}
            required={currentQuestion.required}
          />
        );
        
      case 'contact':
        return (
          <ContactQuestion
            questionId={currentQuestion.id}
            value={currentValue}
            onChange={(value) => updateResponse(currentQuestion.id, value)}
            required={currentQuestion.required}
          />
        );
        
      case 'scheduling':
        const orgId = surveyState.responses.organizationId || config.organization.defaultId;
        console.log('🔧 SurveyContainer Debug:', { 
          orgIdFromState: surveyState.responses.organizationId,
          orgIdFromConfig: config.organization.defaultId,
          finalOrgId: orgId 
        });
        return (
          <SchedulingQuestion
            questionId={currentQuestion.id}
            value={currentValue}
            onChange={(value) => updateResponse(currentQuestion.id, value)}
            required={currentQuestion.required}
            organizationId={orgId}
          />
        );
        
      default:
        return <div>Unknown question type</div>;
    }
  };

  return (
    <div className="survey-container">
      {canGoPrevious() && (
        <Button 
          variant="secondary" 
          onClick={previousStep}
          className="previous-button"
        >
          ← Previous
        </Button>
      )}
      
      <div className="survey-card">
        <div className="survey-header">
          <div className="logo">
            <h2>Oaklet.com</h2>
          </div>
          <ProgressIndicator 
            currentStep={surveyState.currentStep} 
            totalSteps={surveyState.totalSteps} 
          />
        </div>
        
        <div className="survey-main">
          <div className="question-header">
            <h1 className="question-title">{currentQuestion.question}</h1>
            {currentQuestion.subtitle && (
              <p className="question-subtitle">{currentQuestion.subtitle}</p>
            )}
          </div>
          
          <div className="survey-content">
            {renderQuestion()}
          </div>
          
          <div className="survey-navigation">
            <Button 
              variant="primary" 
              onClick={nextStep}
              disabled={!canGoNext()}
            >
              {surveyState.currentStep === surveyState.totalSteps - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
