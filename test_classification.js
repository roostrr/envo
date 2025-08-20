const fetch = require('node-fetch');

async function testClassification() {
  try {
    console.log('Testing video classification for "Data Science"...');
    
    const response = await fetch('http://localhost:5001/api/test-classification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'Data Science',
        maxVideos: 10
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Classification test results:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`\nSuccessfully classified ${data.totalVideos} videos:`);
      data.videos.forEach((video, index) => {
        console.log(`${index + 1}. [${video.difficulty.toUpperCase()}] ${video.title} (${video.channel})`);
      });
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Test the enhanced search endpoint
async function testSearchEndpoint() {
  try {
    console.log('\n\nTesting enhanced search endpoint...');
    
    const response = await fetch('http://localhost:5001/api/youtube-search?topic=Data%20Science&sessionId=test_session');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Search endpoint results:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Search test failed:', error.message);
  }
}

// Run tests
testClassification().then(() => {
  setTimeout(testSearchEndpoint, 2000); // Wait 2 seconds between tests
});
