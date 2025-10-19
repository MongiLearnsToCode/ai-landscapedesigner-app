// Contact service for handling contact form submissions via Resend
import { Resend } from 'resend';
import { sanitizeError } from './errorUtils';

// Rate limiting for contact form submissions (max 3 per hour per session)
const CONTACT_RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

const contactSubmissions = new Map<string, { count: number; resetTime: number }>();

// Initialize Resend with API key
let resendInstance: Resend | null = null;

const getResendInstance = (): Resend => {
  if (!resendInstance) {
    // @ts-ignore - Vite env types
    const apiKey = import.meta.env?.VITE_RESEND_API_KEY || '';

    if (!apiKey) {
      throw new Error('Resend API key not configured. Please set VITE_RESEND_API_KEY environment variable.');
    }

    resendInstance = new Resend(apiKey);
  }

  return resendInstance;
};

// Rate limiting check
const checkRateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const userLimit = contactSubmissions.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize limit
    contactSubmissions.set(identifier, {
      count: 1,
      resetTime: now + CONTACT_RATE_LIMIT.windowMs
    });
    return true;
  }

  if (userLimit.count >= CONTACT_RATE_LIMIT.maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
};

// Get client identifier (session-based for client-side rate limiting)
const getClientIdentifier = (): string => {
  // Use session-based identifier for client-side rate limiting
  let identifier = sessionStorage.getItem('contact_session_id');
  if (!identifier) {
    identifier = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('contact_session_id', identifier);
  }
  return identifier;
};

// Validate environment configuration
const validateEnvironment = (): void => {
  // @ts-ignore - Vite env types
  const apiKey = import.meta.env?.VITE_RESEND_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  VITE_RESEND_API_KEY not configured. Contact form will not send emails.');
  } else if (apiKey === 'your-resend-api-key-here') {
    console.warn('⚠️  VITE_RESEND_API_KEY is set to placeholder value. Please configure with real API key.');
  } else {
    console.log('✅ Resend API key configured successfully');
  }
};

// Initialize validation on module load
if (typeof window !== 'undefined') {
  validateEnvironment();
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

/**
 * Sends a contact form email using Resend
 * @param formData The contact form data
 * @returns Promise that resolves when email is sent
 */
export const sendContactEmail = async (formData: ContactFormData): Promise<void> => {
  const { name, email, message } = formData;

  // Validate required fields
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    throw new Error('All fields are required');
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address');
  }

  // Check rate limit
  const clientId = getClientIdentifier();
  if (!checkRateLimit(clientId)) {
    throw new Error('Too many contact form submissions. Please try again later.');
  }

  try {
    // Get Resend instance
    const resendInstance = getResendInstance();

    // Send email using Resend
    console.log('📧 Sending contact email to support team...');

    const { data, error } = await resendInstance.emails.send({
      from: 'AI Landscape Designer <noreply@ai-landscapedesigner.com>',
      to: ['support@ai-landscapedesigner.com'], // Replace with your support email
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>New Contact Form Submission</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #495057; }
              .value { color: #6c757d; }
              .footer { margin-top: 20px; font-size: 12px; color: #6c757d; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>New Contact Form Submission</h2>
                <p>You have received a new message from the AI Landscape Designer contact form.</p>
              </div>

              <div class="content">
                <div class="field">
                  <div class="label">Name:</div>
                  <div class="value">${name}</div>
                </div>

                <div class="field">
                  <div class="label">Email:</div>
                  <div class="value"><a href="mailto:${email}">${email}</a></div>
                </div>

                <div class="field">
                  <div class="label">Message:</div>
                  <div class="value">${message.replace(/\n/g, '<br>')}</div>
                </div>

                <div class="field">
                  <div class="label">Submitted:</div>
                  <div class="value">${new Date().toLocaleString()}</div>
                </div>
              </div>

              <div class="footer">
                <p>This email was sent from the AI Landscape Designer contact form.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      replyTo: email, // Allow replies to go back to the sender
    });

    if (error) {
      console.error('❌ Resend contact email error:', error);
      throw new Error('Failed to send email. Please try again later.');
    }

    console.log('✅ Contact email sent successfully:', data?.id);
  } catch (error) {
    console.error('Error sending contact email:', error);
    throw new Error(sanitizeError(error));
  }
};

/**
 * Sends an auto-reply email to the contact form submitter
 * @param formData The contact form data
 * @returns Promise that resolves when auto-reply is sent
 */
export const sendAutoReplyEmail = async (formData: ContactFormData): Promise<void> => {
  const { name, email } = formData;

  try {
    // Get Resend instance
    const resendInstance = getResendInstance();

    console.log('📧 Sending auto-reply email to user...');

    const { data, error } = await resendInstance.emails.send({
      from: 'AI Landscape Designer <noreply@ai-landscapedesigner.com>',
      to: [email],
      subject: 'Thank you for contacting AI Landscape Designer',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Thank you for your message</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
              .content { background-color: #ffffff; padding: 30px; border: 1px solid #e9ecef; border-radius: 8px; margin-top: -10px; }
              .footer { margin-top: 20px; font-size: 12px; color: #6c757d; text-align: center; }
              .button { display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thank You!</h1>
                <p>Your message has been received</p>
              </div>

              <div class="content">
                <p>Dear ${name},</p>

                <p>Thank you for reaching out to AI Landscape Designer! We've received your message and appreciate you taking the time to contact us.</p>

                <p>Our team will review your inquiry and get back to you within 24-48 hours. In the meantime, feel free to explore our platform and create beautiful landscape designs.</p>

                <p>If you have any urgent questions, you can also reach us directly at <a href="mailto:support@ai-landscapedesigner.com">support@ai-landscapedesigner.com</a>.</p>

                <p>Best regards,<br>The AI Landscape Designer Team</p>

                <a href="/" class="button">Visit Our Platform</a>
              </div>

              <div class="footer">
                <p>This is an automated response. Please do not reply to this email.</p>
                <p>© 2024 AI Landscape Designer. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Auto-reply email error:', error);
      // Don't throw error for auto-reply failures - the main contact email was sent successfully
    } else {
      console.log('✅ Auto-reply email sent successfully:', data?.id);
    }
  } catch (error) {
    console.error('Error sending auto-reply email:', error);
    // Don't throw error for auto-reply failures
  }
};