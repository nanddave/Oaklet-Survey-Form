/**
 * Survey Form Integration Tests
 * @copyright (c) 2025 Oaklet
 * 
 * Integration tests for Survey Form with Oaklet-Nest including:
 * - End-to-end survey submission flow
 * - Appointment creation in Oaklet-Nest
 * - Data consistency between systems
 * - Error handling across services
 * - Authentication flow
 * 
 * @module test/survey-integration
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';

const SURVEY_API_URL = process.env.SURVEY_API_URL || 'http://localhost:3002';
const NEST_API_URL = process.env.NEST_API_URL || 'http://localhost:3001';

interface TestData {
  surveyEmails: string[];
  nestAppointments: string[];
  nestClients: string[];
  authToken: string | null;
}

class SurveyIntegrationTest {
  private surveyApi: AxiosInstance;
  private nestApi: AxiosInstance;
  private testData: TestData;

  // Test credentials for Oaklet-Nest
  private readonly TEST_USER = {
    email: 'nolan@oakletsuite.com',
    password: 'Test123!'
  };

  constructor() {
    this.surveyApi = axios.create({
      baseURL: SURVEY_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.nestApi = axios.create({
      baseURL: NEST_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.testData = {
      surveyEmails: [],
      nestAppointments: [],
      nestClients: [],
      authToken: null
    };
  }

  private generateTestEmail(): string {
    const timestamp = Date.now();
    const email = `integration-test-${timestamp}@example.com`;
    this.testData.surveyEmails.push(email);
    return email;
  }

  private async loginToNest(): Promise<boolean> {
    try {
      const response = await this.nestApi.post('/api/auth/login', {
        email: this.TEST_USER.email,
        password: this.TEST_USER.password,
        deviceId: `integration-test-${Date.now()}`
      });

      if (response.data.success && response.data.token) {
        this.testData.authToken = response.data.token;
        this.nestApi.defaults.headers.Authorization = `Bearer ${this.testData.authToken}`;
        console.log(`✓ Logged into Oaklet-Nest as ${this.TEST_USER.email}`);
        return true;
      }
      
      console.log('✗ Failed to login to Oaklet-Nest');
      return false;
    } catch (error: any) {
      console.log(`✗ Nest login error: ${error.response?.data?.error || error.message}`);
      return false;
    }
  }

  async testSurveyToNestFlow(): Promise<boolean> {
    console.log('\n=== Testing Survey to Nest Integration Flow ===');
    
    try {
      const testEmail = this.generateTestEmail();
      const appointmentDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      // Step 1: Submit survey through Survey Form
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
          other_information: 'Integration test submission',
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
      
      const surveyResponse = await this.surveyApi.post('/api/survey/submit', surveyData);
      
      if (!surveyResponse.data.success) {
        console.log('✗ Survey submission failed');
        console.log(`  Error: ${surveyResponse.data.error}`);
        return false;
      }
      
      console.log('✓ Survey submitted successfully');
      console.log(`  Confirmation: ${surveyResponse.data.confirmationNumber}`);
      console.log(`  Client ID: ${surveyResponse.data.clientId}`);
      console.log(`  Appointment ID: ${surveyResponse.data.appointmentId}`);
      
      const clientId = surveyResponse.data.clientId;
      const appointmentId = surveyResponse.data.appointmentId;
      
      this.testData.nestClients.push(clientId);
      this.testData.nestAppointments.push(appointmentId);
      
      // Step 2: Verify client was created in Oaklet-Nest
      try {
        const clientResponse = await this.nestApi.get(`/api/v1/clients/${clientId}`);
        
        if (clientResponse.data.success) {
          console.log('✓ Client created in Oaklet-Nest');
          console.log(`  Client Name: ${clientResponse.data.data.firstName} ${clientResponse.data.data.lastName}`);
          console.log(`  Client Email: ${clientResponse.data.data.email}`);
          
          // Verify client data matches survey data
          if (clientResponse.data.data.email === testEmail &&
              clientResponse.data.data.firstName === 'Integration' &&
              clientResponse.data.data.lastName === 'Test') {
            console.log('  ✓ Client data matches survey submission');
          } else {
            console.log('  ✗ Client data mismatch');
            return false;
          }
        } else {
          console.log('✗ Client not found in Oaklet-Nest');
          return false;
        }
      } catch (error: any) {
        console.log(`✗ Error verifying client in Nest: ${error.response?.data?.error || error.message}`);
        return false;
      }
      
      // Step 3: Verify appointment was created in Oaklet-Nest
      try {
        const appointmentResponse = await this.nestApi.get(`/api/v1/appointments/${appointmentId}`);
        
        if (appointmentResponse.data.success) {
          console.log('✓ Appointment created in Oaklet-Nest');
          console.log(`  Appointment Date: ${appointmentResponse.data.data.appointmentDate}`);
          console.log(`  Appointment Time: ${appointmentResponse.data.data.appointmentTime}`);
          console.log(`  Status: ${appointmentResponse.data.data.status}`);
          
          // Verify appointment data matches survey data
          const expectedDate = appointmentDate.toISOString().split('T')[0];
          if (appointmentResponse.data.data.appointmentDate === expectedDate &&
              appointmentResponse.data.data.appointmentTime === '13:00') {
            console.log('  ✓ Appointment data matches survey submission');
          } else {
            console.log('  ✗ Appointment data mismatch');
            console.log(`    Expected: ${expectedDate} at 13:00`);
            console.log(`    Actual: ${appointmentResponse.data.data.appointmentDate} at ${appointmentResponse.data.data.appointmentTime}`);
            return false;
          }
        } else {
          console.log('✗ Appointment not found in Oaklet-Nest');
          return false;
        }
      } catch (error: any) {
        console.log(`✗ Error verifying appointment in Nest: ${error.response?.data?.error || error.message}`);
        return false;
      }
      
      console.log('✓ Complete integration flow successful');
      return true;
    } catch (error: any) {
      console.log(`✗ Integration flow error: ${error.response?.data?.error || error.message}`);
      return false;
    }
  }

  async testDataConsistency(): Promise<boolean> {
    console.log('\n=== Testing Data Consistency ===');
    
    try {
      const testEmail = this.generateTestEmail();
      
      // Submit survey with specific data
      const surveyData = {
        responses: {
          psychiatric_diagnosis: 'Yes',
          psychiatric_diagnosis_conditional: 'ADHD diagnosed in childhood',
          medical_diagnosis: 'Yes',
          medical_diagnosis_conditional: 'Hypertension, managed with medication',
          current_medications: 'Lisinopril 10mg daily, Adderall XR 20mg daily',
          psychiatric_hospitalizations: 'No',
          family_psychiatric_history: 'Yes',
          family_psychiatric_history_conditional: 'Father has ADHD',
          family_adhd_history: 'Yes',
          academic_difficulties: 'Yes',
          academic_difficulties_conditional: 'Struggled with focus and organization in school',
          hyperactive_impulsive: 'Often',
          social_difficulties: 'Sometimes',
          home_stress: 'No',
          childhood_trauma: 'No',
          careless_mistakes: 'Often',
          sustaining_attention: 'Very Often',
          restless_fidgety: 'Often',
          interrupt_others: 'Sometimes',
          procrastinate: 'Very Often',
          lose_things: 'Often',
          finish_details: 'Very Often',
          organize_tasks: 'Very Often',
          remember_appointments: 'Often',
          delay_starting: 'Very Often',
          fidget_sitting: 'Often',
          overly_active: 'Sometimes',
          difficulty_waiting: 'Often',
          more_talkative: 'Sometimes',
          risky_behaviors: 'Rarely',
          mood_problems: 'Sometimes',
          nervous_anxious: 'Sometimes',
          unable_control_worry: 'Sometimes',
          worrying_too_much: 'Sometimes',
          trouble_relaxing: 'Sometimes',
          restlessness: 'Often',
          irritability: 'Sometimes',
          fear_awful: 'Rarely',
          little_interest: 'Rarely',
          feeling_down: 'Rarely',
          sleep_problems: 'Sometimes',
          feeling_tired: 'Sometimes',
          appetite_problems: 'No',
          feeling_bad_self: 'Rarely',
          trouble_concentrating: 'Very Often',
          psychomotor_changes: 'No',
          suicidal_thoughts: 'No',
          anhedonia_expanded: 'Rarely',
          home_stress_trauma: 'No',
          abuse_exposure: 'No',
          other_information: 'Patient reports significant improvement with current medication regimen. Seeking evaluation for dosage adjustment.',
          firstName: 'Consistency',
          lastName: 'Test',
          email: testEmail,
          scheduling: '2025-12-15T14:30:00'
        },
        appointment: {
          selectedDateTime: '2025-12-15T14:30:00',
          appointmentDate: '2025-12-15',
          appointmentTime: '14:30'
        },
        organizationId: 'OAKLETDEV'
      };
      
      const surveyResponse = await this.surveyApi.post('/api/survey/submit', surveyData);
      
      if (!surveyResponse.data.success) {
        console.log('✗ Survey submission failed');
        return false;
      }
      
      const clientId = surveyResponse.data.clientId;
      const appointmentId = surveyResponse.data.appointmentId;
      
      this.testData.nestClients.push(clientId);
      this.testData.nestAppointments.push(appointmentId);
      
      // Wait a moment for data to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify data consistency in Nest
      const clientResponse = await this.nestApi.get(`/api/v1/clients/${clientId}`);
      const appointmentResponse = await this.nestApi.get(`/api/v1/appointments/${appointmentId}`);
      
      if (!clientResponse.data.success || !appointmentResponse.data.success) {
        console.log('✗ Failed to retrieve data from Nest');
        return false;
      }
      
      const client = clientResponse.data.data;
      const appointment = appointmentResponse.data.data;
      
      // Check data consistency
      const consistencyChecks = [
        {
          name: 'Client Email',
          expected: testEmail,
          actual: client.email
        },
        {
          name: 'Client First Name',
          expected: 'Consistency',
          actual: client.firstName
        },
        {
          name: 'Client Last Name',
          expected: 'Test',
          actual: client.lastName
        },
        {
          name: 'Appointment Date',
          expected: '2025-12-15',
          actual: appointment.appointmentDate
        },
        {
          name: 'Appointment Time',
          expected: '14:30',
          actual: appointment.appointmentTime
        }
      ];
      
      let allConsistent = true;
      for (const check of consistencyChecks) {
        if (check.expected === check.actual) {
          console.log(`  ✓ ${check.name}: ${check.actual}`);
        } else {
          console.log(`  ✗ ${check.name}: Expected ${check.expected}, got ${check.actual}`);
          allConsistent = false;
        }
      }
      
      if (allConsistent) {
        console.log('✓ Data consistency verified');
        return true;
      } else {
        console.log('✗ Data consistency issues found');
        return false;
      }
    } catch (error: any) {
      console.log(`✗ Data consistency test error: ${error.response?.data?.error || error.message}`);
      return false;
    }
  }

  async testErrorHandlingIntegration(): Promise<boolean> {
    console.log('\n=== Testing Error Handling Integration ===');
    
    try {
      // Test 1: Survey submission with invalid Nest data
      const invalidSurveyData = {
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
          other_information: 'Error handling test',
          firstName: 'Error',
          lastName: 'Test',
          email: this.generateTestEmail(),
          scheduling: '2025-01-01T00:00:00' // Invalid date/time
        },
        appointment: {
          selectedDateTime: '2025-01-01T00:00:00',
          appointmentDate: '2025-01-01',
          appointmentTime: '00:00'
        },
        organizationId: 'INVALID_ORG_ID' // Invalid organization
      };
      
      try {
        const response = await this.surveyApi.post('/api/survey/submit', invalidSurveyData);
        
        if (!response.data.success) {
          console.log('✓ Invalid data correctly rejected');
          console.log(`  Error: ${response.data.error}`);
        } else {
          console.log('✗ Invalid data was accepted (should have been rejected)');
          return false;
        }
      } catch (error: any) {
        if (error.response?.status >= 400 && error.response?.status < 500) {
          console.log('✓ Invalid data correctly rejected with client error');
        } else {
          console.log(`✗ Unexpected error status: ${error.response?.status}`);
          return false;
        }
      }
      
      // Test 2: Network error simulation (if possible)
      console.log('✓ Error handling integration working correctly');
      return true;
    } catch (error: any) {
      console.log(`✗ Error handling integration test error: ${error.message}`);
      return false;
    }
  }

  async testAuthenticationFlow(): Promise<boolean> {
    console.log('\n=== Testing Authentication Flow ===');
    
    try {
      // The Survey Form should authenticate with Nest automatically
      // We can test this by submitting a survey and verifying it works
      const testEmail = this.generateTestEmail();
      
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
          other_information: 'Authentication flow test',
          firstName: 'Auth',
          lastName: 'Test',
          email: testEmail,
          scheduling: '2025-12-01T15:00:00'
        },
        appointment: {
          selectedDateTime: '2025-12-01T15:00:00',
          appointmentDate: '2025-12-01',
          appointmentTime: '15:00'
        },
        organizationId: 'OAKLETDEV'
      };
      
      const response = await this.surveyApi.post('/api/survey/submit', surveyData);
      
      if (response.data.success) {
        console.log('✓ Survey Form successfully authenticated with Oaklet-Nest');
        console.log(`  Client ID: ${response.data.clientId}`);
        console.log(`  Appointment ID: ${response.data.appointmentId}`);
        
        this.testData.nestClients.push(response.data.clientId);
        this.testData.nestAppointments.push(response.data.appointmentId);
        
        return true;
      } else {
        console.log('✗ Authentication flow failed');
        console.log(`  Error: ${response.data.error}`);
        return false;
      }
    } catch (error: any) {
      console.log(`✗ Authentication flow test error: ${error.response?.data?.error || error.message}`);
      return false;
    }
  }

  async cleanupTestData(): Promise<void> {
    console.log('\n=== Cleaning Up Test Data ===');
    
    // Clean up appointments
    for (const appointmentId of this.testData.nestAppointments) {
      try {
        await this.nestApi.delete(`/api/v1/appointments/${appointmentId}`);
        console.log(`  ✓ Deleted appointment: ${appointmentId}`);
      } catch (error) {
        console.log(`  ⚠ Could not delete appointment: ${appointmentId}`);
      }
    }
    
    // Clean up clients
    for (const clientId of this.testData.nestClients) {
      try {
        await this.nestApi.delete(`/api/v1/clients/${clientId}`);
        console.log(`  ✓ Deleted client: ${clientId}`);
      } catch (error) {
        console.log(`  ⚠ Could not delete client: ${clientId}`);
      }
    }
    
    console.log(`Cleaned up ${this.testData.nestAppointments.length} appointments and ${this.testData.nestClients.length} clients`);
  }

  async runFullTest(): Promise<void> {
    console.log('====================================');
    console.log('   SURVEY INTEGRATION TESTS');
    console.log('====================================');
    
    const results: Record<string, boolean> = {};
    
    // Login to Nest first
    if (!await this.loginToNest()) {
      console.log('\n✗ Cannot proceed without Nest authentication');
      return;
    }

    // Run all tests
    results['Survey to Nest Flow'] = await this.testSurveyToNestFlow();
    results['Data Consistency'] = await this.testDataConsistency();
    results['Error Handling Integration'] = await this.testErrorHandlingIntegration();
    results['Authentication Flow'] = await this.testAuthenticationFlow();

    // Cleanup
    await this.cleanupTestData();

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
      console.log('✅ All Survey Integration tests passed!');
    } else {
      console.log('❌ Some Survey Integration tests failed');
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SurveyIntegrationTest();
  tester.runFullTest().catch(console.error);
}

export { SurveyIntegrationTest };
