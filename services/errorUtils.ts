export const sanitizeError = (error: any): string => {
  // Handle both Error objects and strings
  const message = typeof error === 'string' ? error : error?.message || '';

  // Return generic messages, never internal details
  if (message.includes('API key')) return 'Service temporarily unavailable';
  if (message.includes('network') || message.includes('fetch')) return 'Network error occurred';
  if (message.includes('timeout')) return 'Request timed out';
  return 'An unexpected error occurred';
};