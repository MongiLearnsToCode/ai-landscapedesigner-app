// Simple test script for the contact API
// Run with: node test-contact-api.js

const testData = {
  name: "Test User",
  email: "test@example.com",
  message: "This is a test message from the API test script."
};

async function testContactAPI() {
  try {
    console.log('🧪 Testing contact API...');
    console.log('📤 Sending test data:', testData);

    const response = await fetch('https://ai-landscapedesigner.com/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', result);

    if (response.ok) {
      console.log('✅ Contact API test PASSED');
    } else {
      console.log('❌ Contact API test FAILED');
    }
  } catch (error) {
    console.error('❌ Contact API test ERROR:', error.message);
  }
}

testContactAPI();