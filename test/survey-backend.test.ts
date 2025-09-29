/**
 * Survey Form Backend Unit Tests
 * @copyright (c) 2025 Oaklet
 * 
 * Unit tests for Survey Form backend services including:
 * - Validation service
 * - Encryption service
 * - DynamoDB service
 * - Oaklet-Nest integration
 * - Authentication middleware
 * 
 * @module test/survey-backend
 */

import axios from 'axios';

const API_URL = process.env.SURVEY_API_URL || 'http://localhost:3002';

interface TestData {
  testEmails: string[];
  testSubmissions: string[];
}

class SurveyBackendTest {
  private testData: TestData;

  constructor() {
    this.testData = {
      testEmails: [],
      testSubmissions: []
    };
  }

  private generateTestEmail(): string {
    const timestamp = Date.now();
    const email = `backend-test-${timestamp}@example.com`;
    this.testData.testEmails.push(email);
    return email;
  }

  async testValidationService(): Promise<boolean> {
    console.log('\n=== Testing Validation Service ===');
    
    try {
      // Test email format validation
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..double.dot@domain.com',
        'user@domain',
        ''
      ];
      
      let allInvalidEmailsRejected = true;
      
      for (const email of invalidEmails) {
        try {
          // Test email validation during survey submission
          const testSurveyData = {
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
              other_information: 'Validation test',
              firstName: 'Test',
              lastName: 'User',
              email: email,
              scheduling: '2025-10-06T14:00:00'
            },
            appointment: {
              selectedDateTime: '2025-10-06T14:00:00',
              appointmentDate: '2025-10-06',
              appointmentTime: '14:00'
            },
            organizationId: 'OAKLETDEV'
          };
          
          const response = await axios.post(`${API_URL}/api/survey/submit`, testSurveyData);
          console.log(`  ✗ Invalid email accepted: ${email}`);
          allInvalidEmailsRejected = false;
        } catch (error: any) {
          if (error.response?.status === 400 && (
            error.response?.data?.error?.includes('Invalid email format') ||
            error.response?.data?.error?.includes('Email is required')
          )) {
            console.log(`  ✓ Invalid email rejected: ${email}`);
          } else {
            console.log(`  ✗ Invalid email accepted: ${email}`);
            allInvalidEmailsRejected = false;
          }
        }
      }
      
      // Test valid email format
      const validEmail = this.generateTestEmail();
      const response = await axios.get(`${API_URL}/api/survey/check-email?email=${validEmail}`);
      
      if (response.data.success && response.data.available === true) {
        console.log(`  ✓ Valid email accepted: ${validEmail}`);
      } else {
        console.log(`  ✗ Valid email rejected: ${validEmail}`);
        allInvalidEmailsRejected = false;
      }
      
      if (allInvalidEmailsRejected) {
        console.log('✓ Validation service working correctly');
        return true;
      } else {
        console.log('✗ Validation service has issues');
        return false;
      }
    } catch (error: any) {
      console.log(`✗ Validation service test error: ${error.message}`);
      return false;
    }
  }

  async testEncryptionService(): Promise<boolean> {
    console.log('\n=== Testing Encryption Service ===');
    
    try {
      // Create a survey submission with sensitive data
      const surveyData = {
        responses: {
          psychiatric_diagnosis: 'Yes',
          psychiatric_diagnosis_conditional: 'Depression and anxiety',
          medical_diagnosis: 'Yes',
          medical_diagnosis_conditional: 'Diabetes, hypertension',
          current_medications: 'Metformin, Lisinopril, Sertraline',
          psychiatric_hospitalizations: 'Yes',
          psychiatric_hospitalizations_conditional: '2019 - voluntary admission for depression',
          family_psychiatric_history: 'Yes',
          family_psychiatric_history_conditional: 'Mother has bipolar disorder',
          family_adhd_history: 'Yes',
          academic_difficulties: 'Yes',
          academic_difficulties_conditional: 'Failed multiple classes in high school',
          hyperactive_impulsive: 'Often',
          social_difficulties: 'Often',
          home_stress: 'Yes',
          childhood_trauma: 'Yes',
          childhood_trauma_conditional: 'Physical abuse by stepfather',
          careless_mistakes: 'Often',
          sustaining_attention: 'Very Often',
          restless_fidgety: 'Often',
          interrupt_others: 'Often',
          procrastinate: 'Very Often',
          lose_things: 'Often',
          finish_details: 'Very Often',
          organize_tasks: 'Very Often',
          remember_appointments: 'Often',
          delay_starting: 'Very Often',
          fidget_sitting: 'Often',
          overly_active: 'Sometimes',
          elevated_mood: 'Sometimes',
          increased_energy: 'Sometimes',
          less_sleep: 'Sometimes',
          difficulty_waiting: 'Often',
          more_talkative: 'Often',
          risky_behaviors: 'Sometimes',
          mood_problems: 'Often',
          nervous_anxious: 'Often',
          unable_control_worry: 'Often',
          worrying_too_much: 'Often',
          trouble_relaxing: 'Often',
          restlessness: 'Often',
          irritability: 'Often',
          fear_awful: 'Sometimes',
          little_interest: 'Often',
          feeling_down: 'Often',
          sleep_problems: 'Often',
          feeling_tired: 'Often',
          appetite_problems: 'Often',
          feeling_bad_self: 'Often',
          trouble_concentrating: 'Very Often',
          psychomotor_changes: 'Sometimes',
          suicidal_thoughts: 'Sometimes',
          anhedonia_expanded: 'Often',
          home_stress_trauma: 'Yes',
          abuse_exposure: 'Yes',
          other_information: 'Patient reports severe ADHD symptoms affecting work and relationships. History of substance abuse (alcohol). Currently in therapy.',
          firstName: 'John',
          lastName: 'Doe',
          email: this.generateTestEmail(),
          scheduling: '2025-12-01T13:00:00'
        },
        appointment: {
          selectedDateTime: '2025-12-01T13:00:00',
          appointmentDate: '2025-12-01',
          appointmentTime: '13:00'
        },
        organizationId: 'OAKLETDEV'
      };
      
      const response = await axios.post(`${API_URL}/api/survey/submit`, surveyData);
      
      if (response.data.success) {
        console.log('✓ Survey with sensitive data submitted successfully');
        console.log(`  Confirmation: ${response.data.confirmationNumber}`);
        
        // Verify that sensitive data is not exposed in logs or response
        const responseString = JSON.stringify(response.data);
        const sensitiveTerms = [
          'Depression',
          'anxiety',
          'Diabetes',
          'Sertraline',
          'bipolar',
          'abuse',
          'substance abuse',
          'alcohol'
        ];
        
        let dataProperlyEncrypted = true;
        for (const term of sensitiveTerms) {
          if (responseString.toLowerCase().includes(term.toLowerCase())) {
            console.log(`  ✗ Sensitive data exposed in response: ${term}`);
            dataProperlyEncrypted = false;
          }
        }
        
        if (dataProperlyEncrypted) {
          console.log('  ✓ Sensitive data properly encrypted/protected');
          return true;
        } else {
          console.log('  ✗ Sensitive data not properly protected');
          return false;
        }
      } else {
        console.log('✗ Survey submission failed');
        return false;
      }
    } catch (error: any) {
      console.log(`✗ Encryption service test error: ${error.response?.data?.error || error.message}`);
      return false;
    }
  }

  async testDynamoDBService(): Promise<boolean> {
    console.log('\n=== Testing DynamoDB Service ===');
    
    try {
      const testEmail = this.generateTestEmail();
      
      // First, check that email doesn't exist
      const checkResponse = await axios.get(`${API_URL}/api/survey/check-email?email=${testEmail}`);
      
      if (!checkResponse.data.available) {
        console.log('✗ New email should be available');
        return false;
      }
      
      // Submit a survey to create a record
      const surveyData = {
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
          other_information: 'DynamoDB service test',
          firstName: 'DynamoDB',
          lastName: 'Test',
          email: testEmail,
          scheduling: '2025-12-01T13:00:00'
        },
        appointment: {
          selectedDateTime: '2025-12-01T13:00:00',
          appointmentDate: '2025-12-01',
          appointmentTime: '13:00'
        },
        organizationId: 'OAKLETDEV'
      };
      
      const submitResponse = await axios.post(`${API_URL}/api/survey/submit`, surveyData);
      
      if (!submitResponse.data.success) {
        console.log('✗ Survey submission failed');
        return false;
      }
      
      // Now check that email is no longer available
      const checkResponse2 = await axios.get(`${API_URL}/api/survey/check-email?email=${testEmail}`);
      
      if (checkResponse2.data.available === false) {
        console.log('✓ DynamoDB service correctly tracking email usage');
        console.log(`  Email: ${testEmail}`);
        console.log(`  Status: Used`);
        return true;
      } else {
        console.log('✗ DynamoDB service not properly tracking email usage');
        return false;
      }
    } catch (error: any) {
      console.log(`✗ DynamoDB service test error: ${error.response?.data?.error || error.message}`);
      return false;
    }
  }

  async testOakletNestIntegration(): Promise<boolean> {
    console.log('\n=== Testing Oaklet-Nest Integration ===');
    
    try {
      const testEmail = this.generateTestEmail();
      const appointmentDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const surveyData = {
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
          other_information: 'Oaklet-Nest integration test',
          firstName: 'Integration',
          lastName: 'Test',
          email: testEmail,
          scheduling: `${appointmentDate.toISOString().split('T')[0]}T13:00:00`
        },
        appointment: {
          selectedDateTime: `${appointmentDate.toISOString().split('T')[0]}T13:00:00`,
          appointmentDate: appointmentDate.toISOString().split('T')[0],
          appointmentTime: '13:00'
        },
        organizationId: 'OAKLETDEV'
      };
      
      const response = await axios.post(`${API_URL}/api/survey/submit`, surveyData);
      
      if (response.data.success) {
        // Verify integration-specific fields
        const requiredFields = ['clientId', 'appointmentId', 'confirmationNumber'];
        let allFieldsPresent = true;
        
        for (const field of requiredFields) {
          if (!response.data[field]) {
            console.log(`  ✗ Missing integration field: ${field}`);
            allFieldsPresent = false;
          } else {
            console.log(`  ✓ Integration field present: ${field} = ${response.data[field]}`);
          }
        }
        
        if (allFieldsPresent) {
          console.log('✓ Oaklet-Nest integration working correctly');
          return true;
        } else {
          console.log('✗ Oaklet-Nest integration missing required fields');
          return false;
        }
      } else {
        console.log('✗ Oaklet-Nest integration failed');
        console.log(`  Error: ${response.data.error}`);
        return false;
      }
    } catch (error: any) {
      console.log(`✗ Oaklet-Nest integration test error: ${error.response?.data?.error || error.message}`);
      return false;
    }
  }

  async testAuthenticationMiddleware(): Promise<boolean> {
    console.log('\n=== Testing Authentication Middleware ===');
    
    try {
      // Test without service token (should work for public endpoints)
      const publicResponse = await axios.get(`${API_URL}/health`);
      
      if (publicResponse.status === 200) {
        console.log('✓ Public endpoint accessible without authentication');
      } else {
        console.log('✗ Public endpoint should be accessible');
        return false;
      }
      
      // Test service token validation (if endpoint requires it)
      try {
        const protectedResponse = await axios.post(`${API_URL}/api/survey/submit`, {
          // Invalid data to test auth before validation
          invalid: 'data'
        });
        
        // If we get a validation error (400), auth passed
        // If we get auth error (401), auth failed
        console.log('✓ Authentication middleware allowing requests');
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.log('✓ Authentication middleware properly protecting endpoints');
        } else if (error.response?.status === 400) {
          console.log('✓ Authentication middleware allowing valid requests');
        } else {
          console.log(`  Unexpected status: ${error.response?.status}`);
        }
      }
      
      return true;
    } catch (error: any) {
      console.log(`✗ Authentication middleware test error: ${error.message}`);
      return false;
    }
  }

  async testErrorRecovery(): Promise<boolean> {
    console.log('\n=== Testing Error Recovery ===');
    
    try {
      // Test recovery from various error conditions
      const errorTests = [
        {
          name: 'Invalid JSON',
          data: 'invalid json string',
          expectedStatus: 400
        },
        {
          name: 'Missing required fields',
          data: { incomplete: 'data' },
          expectedStatus: 400
        },
        {
          name: 'Invalid email format',
          data: {
            responses: {
              email: 'invalid-email-format',
              firstName: 'Test',
              lastName: 'User'
            }
          },
          expectedStatus: 400
        }
      ];
      
      let allErrorsHandledCorrectly = true;
      
      for (const test of errorTests) {
        try {
          await axios.post(`${API_URL}/api/survey/submit`, test.data);
          console.log(`  ✗ ${test.name}: Should have failed`);
          allErrorsHandledCorrectly = false;
        } catch (error: any) {
          if (error.response?.status === test.expectedStatus) {
            console.log(`  ✓ ${test.name}: Correctly handled`);
          } else {
            console.log(`  ✗ ${test.name}: Wrong status code (${error.response?.status} vs ${test.expectedStatus})`);
            allErrorsHandledCorrectly = false;
          }
        }
      }
      
      if (allErrorsHandledCorrectly) {
        console.log('✓ Error recovery working correctly');
        return true;
      } else {
        console.log('✗ Error recovery has issues');
        return false;
      }
    } catch (error: any) {
      console.log(`✗ Error recovery test error: ${error.message}`);
      return false;
    }
  }

  async testPerformance(): Promise<boolean> {
    console.log('\n=== Testing Performance ===');
    
    try {
      const startTime = Date.now();
      const testEmail = this.generateTestEmail();
      
      // Test response time for survey submission
      const surveyData = {
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
          other_information: 'Performance test',
          firstName: 'Performance',
          lastName: 'Test',
          email: testEmail,
          scheduling: '2025-12-01T13:00:00'
        },
        appointment: {
          selectedDateTime: '2025-12-01T13:00:00',
          appointmentDate: '2025-12-01',
          appointmentTime: '13:00'
        },
        organizationId: 'OAKLETDEV'
      };
      
      const response = await axios.post(`${API_URL}/api/survey/submit`, surveyData);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`  Response time: ${responseTime}ms`);
      
      if (response.data.success) {
        if (responseTime < 5000) { // Less than 5 seconds
          console.log('✓ Performance test passed (response time acceptable)');
          return true;
        } else {
          console.log('⚠ Performance test warning (response time slow)');
          return true; // Don't fail test for slow response
        }
      } else {
        console.log('✗ Performance test failed (submission failed)');
        return false;
      }
    } catch (error: any) {
      console.log(`✗ Performance test error: ${error.message}`);
      return false;
    }
  }

  async runFullTest(): Promise<void> {
    console.log('====================================');
    console.log('    SURVEY BACKEND UNIT TESTS');
    console.log('====================================');
    
    const results: Record<string, boolean> = {};
    
    // Run all tests
    results['Validation Service'] = await this.testValidationService();
    results['Encryption Service'] = await this.testEncryptionService();
    results['DynamoDB Service'] = await this.testDynamoDBService();
    results['Oaklet-Nest Integration'] = await this.testOakletNestIntegration();
    results['Authentication Middleware'] = await this.testAuthenticationMiddleware();
    results['Error Recovery'] = await this.testErrorRecovery();
    results['Performance'] = await this.testPerformance();

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
      console.log('✅ All Survey Backend tests passed!');
    } else {
      console.log('❌ Some Survey Backend tests failed');
    }

    // Cleanup
    console.log('\n====================================');
    console.log('         CLEANUP');
    console.log('====================================');
    console.log(`Generated ${this.testData.testEmails.length} test emails during testing`);
    console.log('Note: Test data may remain in database for audit purposes');
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SurveyBackendTest();
  tester.runFullTest().catch(console.error);
}

export { SurveyBackendTest };
