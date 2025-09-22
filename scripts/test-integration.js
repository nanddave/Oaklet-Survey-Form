/**
 * Test script to verify Survey Form integration with Oaklet-Nest
 * Run with: node scripts/test-integration.js
 */

import axios from 'axios';

const SURVEY_FORM_URL = 'http://localhost:3002';
const OAKLET_NEST_URL = 'http://localhost:3001';

async function testSurveyFormEndpoints() {
  console.log('🧪 Testing Survey Form Integration...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${SURVEY_FORM_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test 2: Availability endpoint
    console.log('\n2. Testing availability endpoint...');
    const availabilityResponse = await axios.get(`${SURVEY_FORM_URL}/api/survey/availability`, {
      params: {
        date: '2025-09-25',
        organizationId: 'default-org'
      }
    });
    console.log('✅ Availability:', availabilityResponse.data);

    // Test 3: Survey submission (mock data)
    console.log('\n3. Testing survey submission...');
    const submissionData = {
      responses: {
        q1: 'Me',
        q2: 'Somewhat difficult',
        q3: 'Several days',
        q5: 'No',
        location: 'California',
        email: 'test@example.com',
        scheduling: '2025-09-25T14:00:00Z'
      },
      appointment: {
        selectedDateTime: '2025-09-25T14:00:00Z',
        appointmentDate: '2025-09-25',
        appointmentTime: '14:00'
      },
      organizationId: 'default-org'
    };

    const submissionResponse = await axios.post(`${SURVEY_FORM_URL}/api/survey/submit`, submissionData);
    console.log('✅ Submission:', submissionResponse.data);

    console.log('\n🎉 All tests passed! Survey Form integration is working.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Make sure both Survey Form backend and Oaklet-Nest are running:');
    console.log('   Survey Form: npm run backend:dev');
    console.log('   Oaklet-Nest: npm run dev (in Nest directory)');
  }
}

// Run the tests
testSurveyFormEndpoints();
