const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testChatFeedbackAPI() {
  console.log('🧪 Testing Chat Feedback API...\n');

  try {
    // Test 1: Submit feedback with positive sentiment
    console.log('1. Testing feedback submission with positive sentiment...');
    const positiveFeedback = {
      student_id: 'test_student_001',
      conversation_id: 'test_conv_001',
      rating: 5,
      review_text: 'This is amazing! I love the chat agent, it\'s very helpful and friendly.',
      conversation_summary: 'User asked about programs and got helpful responses'
    };

    const response1 = await axios.post(`${BASE_URL}/api/chat-feedback`, positiveFeedback);
    console.log('✅ Positive feedback submitted:', response1.data);

    // Test 2: Submit feedback with negative sentiment
    console.log('\n2. Testing feedback submission with negative sentiment...');
    const negativeFeedback = {
      student_id: 'test_student_002',
      conversation_id: 'test_conv_002',
      rating: 2,
      review_text: 'This is terrible! I hate the chat agent, it\'s very unhelpful and frustrating.',
      conversation_summary: 'User had issues with responses'
    };

    const response2 = await axios.post(`${BASE_URL}/api/chat-feedback`, negativeFeedback);
    console.log('✅ Negative feedback submitted:', response2.data);

    // Test 3: Submit feedback with neutral sentiment
    console.log('\n3. Testing feedback submission with neutral sentiment...');
    const neutralFeedback = {
      student_id: 'test_student_003',
      conversation_id: 'test_conv_003',
      rating: 3,
      review_text: 'The chat agent is okay. It provided some information but could be better.',
      conversation_summary: 'User got basic information'
    };

    const response3 = await axios.post(`${BASE_URL}/api/chat-feedback`, neutralFeedback);
    console.log('✅ Neutral feedback submitted:', response3.data);

    // Test 4: Get analytics
    console.log('\n4. Testing analytics retrieval...');
    const analyticsResponse = await axios.get(`${BASE_URL}/api/chat-sentiment-analytics`);
    console.log('✅ Analytics retrieved:', JSON.stringify(analyticsResponse.data, null, 2));

    // Test 5: Get feedback by student ID
    console.log('\n5. Testing feedback retrieval by student ID...');
    const studentFeedbackResponse = await axios.get(`${BASE_URL}/api/chat-feedback/student/test_student_001`);
    console.log('✅ Student feedback retrieved:', studentFeedbackResponse.data);

    console.log('\n🎉 All tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testChatFeedbackAPI();
