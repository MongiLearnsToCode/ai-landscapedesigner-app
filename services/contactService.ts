// Contact service for handling contact form submissions via Resend
import { sanitizeError } from './errorUtils';

// Type definitions for Resend (to avoid importing the actual package)
interface ResendEmailParams {
  from: string;
  to: string[] | string;
  subject: string;
  html: string;
  reply_to?: string;
}

interface ResendResponse {
  data: { id: string } | null;
  error: any;
}

interface ResendInstance {
  emails: {
    send: (params: ResendEmailParams) => Promise<ResendResponse>;
  };
}

// Mock implementation for when Resend is not available
const mockResend: ResendInstance = {
  emails: {
    send: async (params: ResendEmailParams) => {
      console.log('📧 Mock email sent (Resend not configured):', params.subject);
      return { data: { id: 'mock-id' }, error: null };
    }
  }
};

// Dynamic import for Resend to handle cases where it's not installed
let resend: ResendInstance | null = null;

const getResendInstance = async (): Promise<ResendInstance> => {
  if (!resend) {
    try {
      // Try to dynamically import Resend
      // This will work at runtime if the package is installed
      const resendModule = await import('resend');
      const Resend = resendModule.Resend;

      // @ts-ignore - Vite env types
      const apiKey = import.meta.env?.VITE_RESEND_API_KEY || '';
      if (!apiKey) {
        console.warn('VITE_RESEND_API_KEY not configured, using mock implementation');
        resend = mockResend;
      } else {
        resend = new Resend(apiKey);
      }
    } catch (error) {
      console.warn('Resend package not available, using mock implementation:', error);
      resend = mockResend;
    }
  }
  return resend;
};

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
  if (!name || !email || !message) {
    throw new Error('All fields are required');
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address');
  }

  // Check if Resend API key is configured
  // @ts-ignore - Vite env types
  if (!import.meta.env.VITE_RESEND_API_KEY) {
    throw new Error('Email service is not configured. Please try again later.');
  }

  try {
    // Get Resend instance (real or mock)
    const resendInstance = await getResendInstance();

    // Send email using Resend
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
      reply_to: email, // Allow replies to go back to the sender
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error('Failed to send email. Please try again later.');
    }

    console.log('Contact email sent successfully:', data);
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
    // Get Resend instance (real or mock)
    const resendInstance = await getResendInstance();

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
      console.error('Auto-reply email error:', error);
      // Don't throw error for auto-reply failures - the main contact email was sent successfully
    } else {
      console.log('Auto-reply email sent successfully:', data);
    }
  } catch (error) {
    console.error('Error sending auto-reply email:', error);
    // Don't throw error for auto-reply failures
  }
};