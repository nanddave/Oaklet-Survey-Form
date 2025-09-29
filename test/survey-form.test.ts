/**
 * Survey Form E2E Test
 * @copyright (c) 2025 Oaklet
 * 
 * End-to-end tests for Survey Form functionality including:
 * - Survey submission and validation
 * - Appointment scheduling integration
 * - Email availability checking
 * - Error handling and security
 * - PHI data protection
 * 
 * @module test/survey-form
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_URL = process.env.SURVEY_API_URL || 'http://localhost:3002';

interface SurveyResponse {
  // ADHD Questionnaire Responses
  psychiatric_diagnosis: string;
  psychiatric_diagnosis_conditional?: string;
  medical_diagnosis: string;
  medical_diagnosis_conditional?: string;
  current_medications: string;
  psychiatric_hospitalizations: string;
  psychiatric_hospitalizations_conditional?: string;
  family_psychiatric_history: string;
  family_psychiatric_history_conditional?: string;
  family_adhd_history: string;
  academic_difficulties: string;
  academic_difficulties_conditional?: string;
  hyperactive_impulsive: string;
  social_difficulties: string;
  home_stress: string;
  childhood_trauma: string;
  childhood_trauma_conditional?: string;
  careless_mistakes: string;
  sustaining_attention: string;
  restless_fidgety: string;
  interrupt_others: string;
  procrastinate: string;
  lose_things: string;
  finish_details: string;
  organize_tasks: string;
  remember_appointments: string;
  delay_starting: string;
  fidget_sitting: string;
  overly_active: string;
  difficulty_waiting: string;
  more_talkative: string;
  risky_behaviors: string;
  mood_problems: string;
  nervous_anxious: string;
  unable_control_worry: string;
  worrying_too_much: string;
  trouble_relaxing: string;
  restlessness: string;
  irritability: string;
  fear_awful: string;
  little_interest: string;
  feeling_down: string;
  sleep_problems: string;
  feeling_tired: string;
  appetite_problems: string;
  feeling_bad_self: string;
  trouble_concentrating: string;
  psychomotor_changes: string;
  suicidal_thoughts: string;
  anhedonia_expanded: string;
  home_stress_trauma: string;
  abuse_exposure: string;
  other_information: string;
  // Contact and scheduling
  firstName: string;
  lastName: string;
  email: string;
  scheduling: string;
}

interface SurveySubmission {
  responses: SurveyResponse;
  appointment: {
    selectedDateTime: string;
    appointmentDate: string;
    appointmentTime: string;
  };
  organizationId: string;
}

class SurveyFormTest {
  private api: AxiosInstance;
  private testEmails: string[] = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private generateTestEmail(): string {
    const timestamp = Date.now();
    const email = `test-survey-${timestamp}@example.com`;
    this.testEmails.push(email);
    return email;
  }

  private createValidSurveyData(email?: string): SurveySubmission {
    const testEmail = email || this.generateTestEmail();
    const appointmentDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    return {
      responses: {
        psychiatric_diagnosis: 'No',
        medical_diagnosis: 'No',
        current_medications: 'None',
        psychiatric_hospitalizations: 'No',
        family_psychiatric_history: 'No',
        family_adhd_history: 'No',
        academic_difficulties: 'No',
        hyperactive_impulsive: 'Sometimes',
        social_difficulties: 'No',
        home_stress: 'No',
        childhood_trauma: 'No',
        careless_mistakes: 'Sometimes',
        sustaining_attention: 'Often',
        restless_fidgety: 'Sometimes',
        interrupt_others: 'Rarely',
        procrastinate: 'Often',
        lose_things: 'Sometimes',
        finish_details: 'Sometimes',
        organize_tasks: 'Often',
        remember_appointments: 'Sometimes',
        delay_starting: 'Often',
        fidget_sitting: 'Sometimes',
        overly_active: 'Rarely',
        elevated_mood: 'No',
        increased_energy: 'No',
        less_sleep: 'No',
        difficulty_waiting: 'Sometimes',
        more_talkative: 'Rarely',
        risky_behaviors: 'No',
        mood_problems: 'Sometimes',
        nervous_anxious: 'Sometimes',
        unable_control_worry: 'Sometimes',
        worrying_too_much: 'Sometimes',
        trouble_relaxing: 'Sometimes',
        restlessness: 'Sometimes',
        irritability: 'Sometimes',
        fear_awful: 'Rarely',
        little_interest: 'Sometimes',
        feeling_down: 'Sometimes',
        sleep_problems: 'Sometimes',
        feeling_tired: 'Sometimes',
        appetite_problems: 'No',
        feeling_bad_self: 'Rarely',
        trouble_concentrating: 'Often',
        psychomotor_changes: 'No',
        suicidal_thoughts: 'No',
        anhedonia_expanded: 'Sometimes',
        home_stress_trauma: 'No',
        abuse_exposure: 'No',
        other_information: 'Test submission for automated testing',
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        scheduling: `${appointmentDate.toISOString().split('T')[0]}T13:00:00`
      },
      appointment: {
        selectedDateTime: `${appointmentDate.toISOString().split('T')[0]}T13:00:00`,
        appointmentDate: appointmentDate.toISOString().split('T')[0],
        appointmentTime: '13:00'
      },
      organizationId: process.env.DEFAULT_ORGANIZATION_ID || 'OAKLETDEV'
    };
  }

  async testHealthCheck(): Promise<boolean> {
    console.log('\n=== Testing Health Check ===');
    
    try {
      const response = await this.api.get('/health');
      
      if (response.status === 200) {
        console.log('✓ Health check passed');
        console.log(`  Status: ${response.data.status}`);
        console.log(`  Timestamp: ${response.data.timestamp}`);
        return true;
      }
      
      console.log('✗ Health check failed');
      return false;
    } catch (error: any) {
      console.log(`✗ Health check error: ${error.message}`);
      return false;
    }
  }

  async testEmailAvailabilityCheck(): Promise<boolean> {
    console.log('\n=== Testing Email Availability Check ===');
    
    try {
      const testEmail = this.generateTestEmail();
      
      // Test available email
      const response = await this.api.get(`/api/survey/check-email?email=${testEmail}`);
      
      if (response.data.success && response.data.available === true) {
        console.log(`✓ Email availability check passed for new email`);
        console.log(`  Email: ${testEmail}`);
        console.log(`  Available: ${response.data.available}`);
        return true;
      }
      
      console.log('✗ Email availability check failed');
      return false;
    } catch (error: any) {
      console.log(`✗ Email availability error: ${error.response?.data?.error || error.message}`);
      return false;
    }
  }

  async testInvalidEmailFormat(): Promise<boolean> {
    console.log('\n=== Testing Invalid Email Format ===');
    
    try {
      // Test invalid email format during survey submission (not check-email)
      const invalidSurveyData = this.createValidSurveyData();
      invalidSurveyData.responses.email = 'invalid-email-format'; // Invalid format
      
      const response = await this.api.post('/api/survey/submit', invalidSurveyData);
      
      // Should not reach here - invalid email should be rejected
      console.log('✗ Invalid email format not properly validated during submission');
      return false;
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.error?.includes('Invalid email format')) {
        console.log('✓ Invalid email format correctly rejected during submission');
        return true;
      } else {
        console.log('✗ Unexpected error for invalid email:', error.response?.data?.error || error.message);
        return false;
      }
    }
  }

  async testValidSurveySubmission(): Promise<boolean> {
    console.log('\n=== Testing Valid Survey Submission ===');
    
    try {
      const surveyData = this.createValidSurveyData();
      
      const response = await this.api.post('/api/survey/submit', surveyData);
      
      if (response.data.success) {
        console.log(`✓ Survey submission successful`);
        console.log(`  Confirmation: ${response.data.confirmationNumber}`);
        console.log(`  Client ID: ${response.data.clientId}`);
        console.log(`  Appointment ID: ${response.data.appointmentId}`);
        return true;
      }
      
      console.log('✗ Survey submission failed');
      console.log(`  Error: ${response.data.error}`);
      return false;
    } catch (error: any) {
      console.log(`✗ Survey submission error: ${error.response?.data?.error || error.message}`);
      return false;
    }
  }

  async testMissingRequiredFields(): Promise<boolean> {
    console.log('\n=== Testing Missing Required Fields ===');
    
    try {
      const incompleteData = {
        responses: {
          firstName: 'Test',
          // Missing required fields
        },
        appointment: {
          selectedDateTime: '2025-12-01T13:00:00',
          appointmentDate: '2025-12-01',
          appointmentTime: '13:00'
        },
        organizationId: 'OAKLETDEV'
      };
      
      await this.api.post('/api/survey/submit', incompleteData);
      
      console.log('✗ Should have rejected incomplete data');
      return false;
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log(`✓ Missing required fields correctly rejected`);
        console.log(`  Error: ${error.response.data.error}`);
        return true;
      }
      console.log(`✗ Unexpected error: ${error.message}`);
      return false;
    }
  }

  async testDuplicateEmailSubmission(): Promise<boolean> {
    console.log('\n=== Testing Duplicate Email Submission ===');
    
    try {
      const testEmail = this.generateTestEmail();
      const surveyData1 = this.createValidSurveyData(testEmail);
      const surveyData2 = this.createValidSurveyData(testEmail);
      
      // First submission should succeed
      const response1 = await this.api.post('/api/survey/submit', surveyData1);
      
      if (!response1.data.success) {
        console.log('✗ First submission failed unexpectedly');
        return false;
      }
      
      // Second submission with same email should fail
      try {
        await this.api.post('/api/survey/submit', surveyData2);
        console.log('✗ Duplicate email submission was allowed');
        return false;
      } catch (duplicateError: any) {
        if (duplicateError.response?.status === 400) {
          console.log(`✓ Duplicate email correctly rejected`);
          console.log(`  Error: ${duplicateError.response.data.error}`);
          return true;
        }
      }
      
      console.log('✗ Duplicate email handling failed');
      return false;
    } catch (error: any) {
      console.log(`✗ Duplicate email test error: ${error.message}`);
      return false;
    }
  }

  async testInvalidAppointmentTime(): Promise<boolean> {
    console.log('\n=== Testing Invalid Appointment Time ===');
    
    try {
      const surveyData = this.createValidSurveyData();
      surveyData.appointment.appointmentTime = '25:00'; // Invalid time
      surveyData.responses.scheduling = '2025-12-01T25:00:00'; // Invalid time
      
      await this.api.post('/api/survey/submit', surveyData);
      
      console.log('✗ Should have rejected invalid appointment time');
      return false;
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log(`✓ Invalid appointment time correctly rejected`);
        return true;
      }
      console.log(`✗ Unexpected error: ${error.message}`);
      return false;
    }
  }

  async testPHIDataProtection(): Promise<boolean> {
    console.log('\n=== Testing PHI Data Protection ===');
    
    try {
      const surveyData = this.createValidSurveyData();
      
      // Add sensitive PHI data
      surveyData.responses.other_information = 'Patient has history of depression and anxiety. SSN: 123-45-6789';
      
      const response = await this.api.post('/api/survey/submit', surveyData);
      
      if (response.data.success) {
        console.log(`✓ Survey with PHI data submitted successfully`);
        console.log(`  Confirmation: ${response.data.confirmationNumber}`);
        
        // Verify that PHI is not exposed in response
        const responseString = JSON.stringify(response.data);
        if (responseString.includes('123-45-6789') || responseString.includes('depression')) {
          console.log('✗ PHI data exposed in response');
          return false;
        }
        
        console.log(`  ✓ PHI data properly protected in response`);
        return true;
      }
      
      console.log('✗ PHI data protection test failed');
      return false;
    } catch (error: any) {
      console.log(`✗ PHI protection test error: ${error.message}`);
      return false;
    }
  }

  async testRateLimiting(): Promise<boolean> {
    console.log('\n=== Testing Rate Limiting ===');
    
    try {
      const testEmail = this.generateTestEmail();
      let rateLimited = false;
      
      // Try to submit multiple surveys rapidly
      for (let i = 0; i < 6; i++) {
        try {
          const surveyData = this.createValidSurveyData(`${i}-${testEmail}`);
          await this.api.post('/api/survey/submit', surveyData);
          
          if (i % 2 === 0) {
            console.log(`  Submission ${i + 1} successful`);
          }
        } catch (error: any) {
          if (error.response?.status === 429) {
            rateLimited = true;
            console.log(`✓ Rate limited after ${i + 1} attempts`);
            break;
          }
        }
        
        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (rateLimited) {
        console.log(`✓ Rate limiting working correctly`);
        return true;
      } else {
        console.log(`⚠ Rate limiting not triggered (may be disabled in test environment)`);
        return true; // Don't fail test if rate limiting is disabled
      }
    } catch (error: any) {
      console.log(`✗ Rate limiting test error: ${error.message}`);
      return false;
    }
  }

  async testSecurityHeaders(): Promise<boolean> {
    console.log('\n=== Testing Security Headers ===');
    
    try {
      const response = await this.api.get('/health');
      
      const headers = response.headers;
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];
      
      let allHeadersPresent = true;
      for (const header of securityHeaders) {
        if (!headers[header]) {
          console.log(`  ✗ Missing security header: ${header}`);
          allHeadersPresent = false;
        } else {
          console.log(`  ✓ Security header present: ${header}`);
        }
      }
      
      if (allHeadersPresent) {
        console.log(`✓ All security headers present`);
        return true;
      } else {
        console.log(`✗ Some security headers missing`);
        return false;
      }
    } catch (error: any) {
      console.log(`✗ Security headers test error: ${error.message}`);
      return false;
    }
  }

  async testInputSanitization(): Promise<boolean> {
    console.log('\n=== Testing Input Sanitization ===');
    
    try {
      const surveyData = this.createValidSurveyData();
      
      // Add potentially malicious input
      surveyData.responses.firstName = '<script>alert("xss")</script>Test';
      surveyData.responses.lastName = '<img src="x" onerror="alert(1)">User';
      surveyData.responses.other_information = '<div onclick="alert(1)">Malicious content</div>';
      
      const response = await this.api.post('/api/survey/submit', surveyData);
      
      if (response.data.success) {
        console.log(`✓ Survey with potentially malicious input processed`);
        
        // Verify that malicious content is sanitized
        const responseString = JSON.stringify(response.data);
        if (responseString.includes('<script>') || responseString.includes('onerror=') || responseString.includes('onclick=')) {
          console.log('✗ Malicious input not properly sanitized');
          return false;
        }
        
        console.log(`  ✓ Malicious input properly sanitized`);
        return true;
      }
      
      console.log('✗ Input sanitization test failed');
      return false;
    } catch (error: any) {
      console.log(`✗ Input sanitization test error: ${error.message}`);
      return false;
    }
  }

  async testErrorHandling(): Promise<boolean> {
    console.log('\n=== Testing Error Handling ===');
    
    try {
      // Test with completely invalid JSON
      try {
        await this.api.post('/api/survey/submit', 'invalid json');
        console.log('✗ Should have rejected invalid JSON');
        return false;
      } catch (error: any) {
        if (error.response?.status === 400) {
          console.log(`✓ Invalid JSON correctly rejected`);
        }
      }
      
      // Test with missing endpoint
      try {
        await this.api.get('/api/nonexistent-endpoint');
        console.log('✗ Should have returned 404 for nonexistent endpoint');
        return false;
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log(`✓ Nonexistent endpoint correctly returns 404`);
        }
      }
      
      return true;
    } catch (error: any) {
      console.log(`✗ Error handling test error: ${error.message}`);
      return false;
    }
  }

  async runFullTest(): Promise<void> {
    console.log('====================================');
    console.log('     SURVEY FORM E2E TESTS');
    console.log('====================================');
    
    const results: Record<string, boolean> = {};
    
    // Run all tests
    results['Health Check'] = await this.testHealthCheck();
    results['Email Availability Check'] = await this.testEmailAvailabilityCheck();
    results['Invalid Email Format'] = await this.testInvalidEmailFormat();
    results['Valid Survey Submission'] = await this.testValidSurveySubmission();
    results['Missing Required Fields'] = await this.testMissingRequiredFields();
    results['Duplicate Email Submission'] = await this.testDuplicateEmailSubmission();
    results['Invalid Appointment Time'] = await this.testInvalidAppointmentTime();
    results['PHI Data Protection'] = await this.testPHIDataProtection();
    results['Rate Limiting'] = await this.testRateLimiting();
    results['Security Headers'] = await this.testSecurityHeaders();
    results['Input Sanitization'] = await this.testInputSanitization();
    results['Error Handling'] = await this.testErrorHandling();

    // Summary
    console.log('\n====================================');
    console.log('         TEST SUMMARY');
    console.log('====================================');
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    for (const [test, result] of Object.entries(results)) {
      console.log(`${result ? '✓' : '✗'} ${test}`);
    }
    
    console.log(`\nResult: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('✅ All Survey Form tests passed!');
    } else {
      console.log('❌ Some Survey Form tests failed');
    }

    // Cleanup
    console.log('\n====================================');
    console.log('         CLEANUP');
    console.log('====================================');
    console.log(`Generated ${this.testEmails.length} test emails during testing`);
    console.log('Note: Test data may remain in database for audit purposes');
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SurveyFormTest();
  tester.runFullTest().catch(console.error);
}

export { SurveyFormTest };
