export const sanitizeError = (error: any): string => {
  // Handle both Error objects and strings, normalize to lowercase for case-insensitive matching
  const message = (typeof error === 'string' ? error : error?.message || '').toLowerCase();

  // Return generic messages, never internal details
  if (message.includes('api') && message.includes('key')) return 'Service temporarily unavailable';
  if (message.includes('network') || message.includes('fetch')) return 'Network error occurred';
  if (message.includes('timeout')) return 'Request timed out';
  return 'An unexpected error occurred';
};