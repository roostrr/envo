const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function simpleTest() {
  console.log('🧪 Simple API Test...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);

    // Test 2: Try to get analytics (should work even with no data)
    console.log('\n2. Testing analytics endpoint...');
    const analyticsResponse = await axios.get(`${BASE_URL}/api/chat-sentiment-analytics`);
    console.log('✅ Analytics endpoint works:', analyticsResponse.data.success);

    // Test 3: Try to submit feedback
    console.log('\n3. Testing feedback submission...');
    const feedbackData = {
      student_id: 'test_student_001',
      conversation_id: 'test_conv_001',
      rating: 5,
      review_text: 'This is amazing! I love the chat agent.',
      conversation_summary: 'Test conversation'
    };

    const feedbackResponse = await axios.post(`${BASE_URL}/api/chat-feedback`, feedbackData);
    console.log('✅ Feedback submission works:', feedbackResponse.data.success);

    console.log('\n🎉 All basic tests passed!');

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request was made but no response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
  }
}

simpleTest();
