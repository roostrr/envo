const axios = require('axios');

async function testAdminEndpoints() {
  console.log('Testing Admin Endpoints...');
  
  try {
    // Test 1: Test endpoint
    console.log('\n1. Testing /api/admin/test...');
    const testResponse = await axios.get('http://localhost:5001/api/admin/test');
    console.log('✅ Test endpoint working:', testResponse.data);
    
    // Test 2: Students endpoint
    console.log('\n2. Testing /api/admin/students...');
    const studentsResponse = await axios.get('http://localhost:5001/api/admin/students');
    console.log('✅ Students endpoint working:', studentsResponse.data.data.total_students, 'students found');
    
    // Test 3: ML Analytics endpoint
    console.log('\n3. Testing /api/admin/ml-analytics...');
    const mlResponse = await axios.get('http://localhost:5001/api/admin/ml-analytics');
    console.log('✅ ML Analytics endpoint working:', mlResponse.data.data.admission_statistics);
    
    // Test 4: Conversation Analytics endpoint
    console.log('\n4. Testing /api/admin/conversations/analytics...');
    const convResponse = await axios.get('http://localhost:5001/api/admin/conversations/analytics');
    console.log('✅ Conversation Analytics endpoint working:', convResponse.data.data.total_conversations, 'conversations');
    
    console.log('\n🎉 All admin endpoints are working!');
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAdminEndpoints(); 