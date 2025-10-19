// Contact service types and validation helpers
// Note: Email functionality is now handled server-side via /api/contact

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

/**
 * Basic email validation
 * @param email Email string to validate
 * @returns true if email is valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate contact form data
 * @param data Contact form data to validate
 * @returns Error message if invalid, null if valid
 */
export const validateContactData = (data: ContactFormData): string | null => {
  if (!data.name?.trim()) {
    return 'Name is required';
  }
  if (!data.email?.trim()) {
    return 'Email is required';
  }
  if (!data.message?.trim()) {
    return 'Message is required';
  }
  if (!isValidEmail(data.email)) {
    return 'Please enter a valid email address';
  }
  return null;
};