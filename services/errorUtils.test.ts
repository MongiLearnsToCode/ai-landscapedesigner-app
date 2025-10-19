// Basic test for error sanitization functionality
// This can be run with: pnpm run test (or tsx services/errorUtils.test.ts)

// Import the real sanitizeError function using ES modules
import { sanitizeError } from './errorUtils';

console.log('🧪 Testing error sanitization...\n');

// Test cases
const testCases = [
  // API key errors should be sanitized (case-insensitive)
  { input: new Error('API key invalid'), expected: 'Service temporarily unavailable' },
  { input: new Error('Gemini API key not found'), expected: 'Service temporarily unavailable' },
  { input: new Error('GEMINI_API_KEY is not configured'), expected: 'Service temporarily unavailable' },
  { input: new Error('API KEY INVALID'), expected: 'Service temporarily unavailable' },

  // Network errors (case-insensitive)
  { input: new Error('fetch failed'), expected: 'Network error occurred' },
  { input: new Error('FETCH FAILED'), expected: 'Network error occurred' },
  { input: new Error('Network request failed'), expected: 'Network error occurred' },

  // Timeout errors
  { input: new Error('Request timeout'), expected: 'Request timed out' },
  { input: new Error('TIMEOUT occurred'), expected: 'Request timed out' },

  // Other errors should get generic message
  { input: new Error('Some other error'), expected: 'An unexpected error occurred' },
  { input: new Error('Database connection failed'), expected: 'An unexpected error occurred' },

  // String inputs (case-insensitive)
  { input: 'API key error', expected: 'Service temporarily unavailable' },
  { input: 'API KEY ERROR', expected: 'Service temporarily unavailable' },
  { input: 'network issue', expected: 'Network error occurred' },
  { input: 'NETWORK ISSUE', expected: 'Network error occurred' },

  // Non-Error objects (case-insensitive)
  { input: { message: 'API key problem' }, expected: 'Service temporarily unavailable' },
  { input: { message: 'API KEY PROBLEM' }, expected: 'Service temporarily unavailable' },
  { input: { message: 'network request failed' }, expected: 'Network error occurred' },
  { input: { message: 'NETWORK REQUEST FAILED' }, expected: 'Network error occurred' },
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
    console.log(`   Input type: ${typeof testCase.input}`);
    console.log(`   Input: ${testCase.input instanceof Error ? testCase.input.message : JSON.stringify(testCase.input)}`);
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