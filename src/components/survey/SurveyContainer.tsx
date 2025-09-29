import { ProgressIndicator } from '../common/ProgressIndicator';
import { Button } from '../common/Button';
import { RadioQuestion } from '../questions/RadioQuestion';
import { DropdownQuestion } from '../questions/DropdownQuestion';
import { ContactQuestion } from '../questions/ContactQuestion';
import { SchedulingQuestion } from '../questions/SchedulingQuestion';
import { LikertQuestion } from '../questions/LikertQuestion';
import { YesNoQuestion } from '../questions/YesNoQuestion';
import { TextAreaQuestion } from '../questions/TextAreaQuestion';
import { useSurveyState } from '../../hooks/useSurveyState';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { apiClient } from '../../services/apiClient';
import { config } from '../../config/environment';
import { useEffect, useState, useRef } from 'react';

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
  
  const submissionRef = useRef(false);
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'completed' | 'error'>('idle');

  useEffect(() => {
    if (surveyState.isComplete && 
        surveyState.responses && 
        submissionState === 'idle' && 
        !submissionRef.current) {
      handleSurveyCompletion();
    }
  }, [surveyState.isComplete, surveyState.responses, submissionState]);

  const handleSurveyCompletion = async () => {
    if (submissionRef.current || submissionState !== 'idle') {
      return;
    }
    
    submissionRef.current = true;
    setSubmissionState('submitting');
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      let contactData = { firstName: '', lastName: '', email: '' };
      try {
        if (surveyState.responses.contactInfo) {
          contactData = JSON.parse(surveyState.responses.contactInfo);
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          // Error parsing contact data - using defaults
        }
      }

      const submissionData = {
        responses: {
          // ADHD Questionnaire Responses
          psychiatric_diagnosis: surveyState.responses.psychiatric_diagnosis || '',
          psychiatric_diagnosis_conditional: surveyState.responses.psychiatric_diagnosis_conditional,
          medical_diagnosis: surveyState.responses.medical_diagnosis || '',
          medical_diagnosis_conditional: surveyState.responses.medical_diagnosis_conditional,
          current_medications: surveyState.responses.current_medications || '',
          psychiatric_hospitalizations: surveyState.responses.psychiatric_hospitalizations || '',
          psychiatric_hospitalizations_conditional: surveyState.responses.psychiatric_hospitalizations_conditional,
          family_psychiatric_history: surveyState.responses.family_psychiatric_history || '',
          family_psychiatric_history_conditional: surveyState.responses.family_psychiatric_history_conditional,
          family_adhd_history: surveyState.responses.family_adhd_history || '',
          academic_difficulties: surveyState.responses.academic_difficulties || '',
          academic_difficulties_conditional: surveyState.responses.academic_difficulties_conditional,
          hyperactive_impulsive: surveyState.responses.hyperactive_impulsive || '',
          social_difficulties: surveyState.responses.social_difficulties || '',
          home_stress: surveyState.responses.home_stress || '',
          childhood_trauma: surveyState.responses.childhood_trauma || '',
          childhood_trauma_conditional: surveyState.responses.childhood_trauma_conditional,
          careless_mistakes: surveyState.responses.careless_mistakes || '',
          sustaining_attention: surveyState.responses.sustaining_attention || '',
          restless_fidgety: surveyState.responses.restless_fidgety || '',
          interrupt_others: surveyState.responses.interrupt_others || '',
          procrastinate: surveyState.responses.procrastinate || '',
          lose_things: surveyState.responses.lose_things || '',
          finish_details: surveyState.responses.finish_details || '',
          organize_tasks: surveyState.responses.organize_tasks || '',
          remember_appointments: surveyState.responses.remember_appointments || '',
          delay_starting: surveyState.responses.delay_starting || '',
          fidget_sitting: surveyState.responses.fidget_sitting || '',
          overly_active: surveyState.responses.overly_active || '',
          elevated_mood: surveyState.responses.elevated_mood || '',
          increased_energy: surveyState.responses.increased_energy || '',
          less_sleep: surveyState.responses.less_sleep || '',
          more_talkative: surveyState.responses.more_talkative || '',
          risky_behaviors: surveyState.responses.risky_behaviors || '',
          mood_problems: surveyState.responses.mood_problems || '',
          nervous_anxious: surveyState.responses.nervous_anxious || '',
          unable_control_worry: surveyState.responses.unable_control_worry || '',
          worrying_too_much: surveyState.responses.worrying_too_much || '',
          trouble_relaxing: surveyState.responses.trouble_relaxing || '',
          restlessness: surveyState.responses.restlessness || '',
          irritability: surveyState.responses.irritability || '',
          fear_awful: surveyState.responses.fear_awful || '',
          little_interest: surveyState.responses.little_interest || '',
          feeling_down: surveyState.responses.feeling_down || '',
          sleep_problems: surveyState.responses.sleep_problems || '',
          feeling_tired: surveyState.responses.feeling_tired || '',
          appetite_problems: surveyState.responses.appetite_problems || '',
          feeling_bad_self: surveyState.responses.feeling_bad_self || '',
          trouble_concentrating: surveyState.responses.trouble_concentrating || '',
          psychomotor_changes: surveyState.responses.psychomotor_changes || '',
          suicidal_thoughts: surveyState.responses.suicidal_thoughts || '',
          anhedonia_expanded: surveyState.responses.anhedonia_expanded || '',
          anhedonia_expanded_conditional: surveyState.responses.anhedonia_expanded_conditional,
          home_stress_trauma: surveyState.responses.home_stress_trauma || '',
          home_stress_trauma_conditional: surveyState.responses.home_stress_trauma_conditional,
          abuse_exposure: surveyState.responses.abuse_exposure || '',
          abuse_exposure_conditional: surveyState.responses.abuse_exposure_conditional,
          other_information: surveyState.responses.other_information || '',
          // Contact and scheduling
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email,
          scheduling: surveyState.responses.scheduling || ''
        },
        appointment: {
          selectedDateTime: surveyState.responses.scheduling || '',
          appointmentDate: surveyState.responses.scheduling?.split('T')[0] || '',
          appointmentTime: surveyState.responses.scheduling?.split('T')[1]?.substring(0, 5) || ''
        },
        organizationId: config.organization.defaultId
      };

      setSubmissionData(submissionData);
      const result = await apiClient.submitSurvey(submissionData);

      if (result.success) {
        setSubmissionResult(result);
        setSubmissionState('completed');
        
        // Only store non-PHI appointment metadata
        addSubmission({}, {
          appointmentId: result.appointmentId,
          appointmentDate: submissionData.appointment.appointmentDate,
          appointmentTime: submissionData.appointment.appointmentTime,
          sessionType: 'Initial Consultation'
        });

        // Clean up localStorage after successful submission
        localStorage.removeItem('survey_responses');

        // Notify parent window if in widget mode
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'survey.completed',
            result
          }, '*');
        }
      } else {
        setSubmissionError(result.error || 'Submission failed');
        setSubmissionState('error');
        
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
      setSubmissionState('error');
      
      // Still store locally as backup
      // Only store non-PHI appointment metadata in development
      if (import.meta.env.DEV) {
        addSubmission({}, {
          appointmentDate: surveyState.responses.scheduling?.split('T')[0],
          appointmentTime: surveyState.responses.scheduling?.split('T')[1]?.substring(0, 5),
          sessionType: 'Initial Consultation'
        });
      }

      // Notify parent window of error
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'survey.error',
          error: { message: errorMessage }
        }, '*');
      }
    } finally {
      setIsSubmitting(false);
      // Reset submission ref to allow retry
      submissionRef.current = false;
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
                          if (import.meta.env.DEV) {
                            // Error parsing contact data - using defaults
                          }
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
                onClick={() => {
                  submissionRef.current = false;
                  setSubmissionState('idle');
                  resetSurvey();
                }}
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
              if (value) {
                setTimeout(() => nextStep(), 500);
              }
            }}
            required={currentQuestion.required}
          />
        );
        
      case 'likert':
        return (
          <LikertQuestion
            questionId={currentQuestion.id}
            question={currentQuestion.question}
            subtitle={currentQuestion.subtitle}
            value={currentValue}
            onChange={(value) => {
              updateResponse(currentQuestion.id, value);
              if (value) {
                setTimeout(() => nextStep(), 300);
              }
            }}
            required={currentQuestion.required}
          />
        );
        
      case 'yesno':
        return (
          <YesNoQuestion
            questionId={currentQuestion.id}
            question={currentQuestion.question}
            subtitle={currentQuestion.subtitle}
            value={currentValue}
            onChange={(value) => {
              updateResponse(currentQuestion.id, value);
              // Auto-advance logic:
              // - "No" always auto-advances
              // - "Yes" only auto-advances if there's no conditional text box
              if (value === 'No') {
                setTimeout(() => nextStep(), 300);
              } else if (value === 'Yes' && !currentQuestion.conditionalFields) {
                setTimeout(() => nextStep(), 300);
              }
            }}
            required={currentQuestion.required}
            conditionalFields={currentQuestion.conditionalFields}
            conditionalValue={getResponse(`${currentQuestion.id}_conditional`)}
            onConditionalChange={(value) => updateResponse(`${currentQuestion.id}_conditional`, value)}
          />
        );
        
      case 'textarea':
        return (
          <TextAreaQuestion
            questionId={currentQuestion.id}
            question={currentQuestion.question}
            subtitle={currentQuestion.subtitle}
            value={currentValue}
            onChange={(value) => updateResponse(currentQuestion.id, value)}
            placeholder={currentQuestion.options?.[0]}
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
        return <div>Unknown question type: {currentQuestion.type}</div>;
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
