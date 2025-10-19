export const sanitizeError = (error: any): string => {
  // Return generic messages, never internal details
  if (error.message?.includes('API key')) return 'Service temporarily unavailable';
  if (error.message?.includes('network') || error.message?.includes('fetch')) return 'Network error occurred';
  if (error.message?.includes('timeout')) return 'Request timed out';
  return 'An unexpected error occurred';
};