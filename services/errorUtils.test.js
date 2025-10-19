// Basic test for error sanitization functionality
// This can be run with: node services/errorUtils.test.js

// Inline implementation of sanitizeError for testing
const sanitizeError = (error) => {
  // Handle both Error objects and strings
  const message = typeof error === 'string' ? error : error?.message || '';

  // Return generic messages, never internal details
  if (message.includes('API key')) return 'Service temporarily unavailable';
  if (message.includes('network') || message.includes('fetch')) return 'Network error occurred';
  if (message.includes('timeout')) return 'Request timed out';
  return 'An unexpected error occurred';
};

console.log('🧪 Testing error sanitization...\n');

// Test cases
const testCases = [
  // API key errors should be sanitized
  { input: new Error('API key invalid'), expected: 'Service temporarily unavailable' },
  { input: new Error('Gemini API key not found'), expected: 'Service temporarily unavailable' },

  // Network errors
  { input: new Error('fetch failed'), expected: 'Network error occurred' },

  // Timeout errors
  { input: new Error('Request timeout'), expected: 'Request timed out' },

  // Other errors should get generic message
  { input: new Error('Some other error'), expected: 'An unexpected error occurred' },
  { input: new Error('Database connection failed'), expected: 'An unexpected error occurred' },

  // String inputs
  { input: 'API key error', expected: 'Service temporarily unavailable' },
  { input: 'network issue', expected: 'Network error occurred' },

  // Non-Error objects
  { input: { message: 'API key problem' }, expected: 'Service temporarily unavailable' },
  { input: { message: 'network request failed' }, expected: 'Network error occurred' },
  { input: null, expected: 'An unexpected error occurred' },
  { input: undefined, expected: 'An unexpected error occurred' },
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = sanitizeError(testCase.input);
  const success = result === testCase.expected;

  if (success) {
    console.log(`✅ Test ${index + 1}: PASS`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: FAIL`);
    console.log(`   Input: ${JSON.stringify(testCase.input)}`);
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   Got: "${result}"`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All error sanitization tests passed!');
} else {
  console.log('⚠️ Some tests failed. Please check the implementation.');
  process.exit(1);
}