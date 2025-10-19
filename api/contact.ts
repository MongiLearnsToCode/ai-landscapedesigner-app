// Force Node.js runtime for Vercel (required for Resend SDK)
export const runtime = 'nodejs';

import { Resend } from 'resend';

// Type definitions
interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

// Rate limiting configuration (following Resend best practices)
const RATE_LIMIT_CONFIG = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// In-memory rate limiting store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * HTML escaping helper to prevent XSS attacks
 * Following security best practices from Resend documentation
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char]);
}

/**
 * Rate limiting check - prevents abuse as recommended in Resend docs
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize limit
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_CONFIG.maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Get client identifier for rate limiting
 * Uses IP address following serverless best practices
 */
function getClientIdentifier(request: Request): string {
  // Try multiple headers for IP detection (common in serverless environments)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  // Use the first available IP, fallback to generic identifier
  const ip = forwarded?.split(',')[0]?.trim() ||
            realIp ||
            cfConnectingIp ||
            'unknown-ip';

  return ip;
}

/**
 * Initialize Resend instance with proper API key validation
 * Following Resend API key best practices from documentation
 */
function getResendInstance(): Resend {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable not configured. Please set up your API key following the Resend documentation.');
  }

  // Validate API key format (should start with 're_' as per Resend docs)
  if (!apiKey.startsWith('re_')) {
    throw new Error('Invalid RESEND_API_KEY format. API keys should start with "re_" as specified in Resend documentation.');
  }

  return new Resend(apiKey);
}

/**
 * Send contact email to support team
 * Professional email template with proper HTML escaping
 */
async function sendContactEmail(formData: ContactFormData): Promise<void> {
  const { name, email, message } = formData;
  const resend = getResendInstance();

  console.log('📧 Sending contact email to support team...');

  const { data, error } = await resend.emails.send({
    from: 'AI Landscape Designer <noreply@ai-landscapedesigner.com>',
    to: ['support@ai-landscapedesigner.com'],
    subject: `New Contact Form Submission from ${escapeHtml(name)}`,
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
                <div class="value">${escapeHtml(name)}</div>
              </div>

              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
              </div>

              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
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
    throw new Error(`Failed to send contact email: ${error.message}`);
  }

  console.log('✅ Contact email sent successfully:', data?.id);
}

/**
 * Send auto-reply email to user
 * Professional thank-you email with branding
 */
async function sendAutoReplyEmail(formData: ContactFormData): Promise<void> {
  const { name, email } = formData;
  const resend = getResendInstance();

  console.log('📧 Sending auto-reply email to user...');

  const { data, error } = await resend.emails.send({
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
              <p>Dear ${escapeHtml(name)},</p>

              <p>Thank you for reaching out to AI Landscape Designer! We've received your message and appreciate you taking the time to contact us.</p>

              <p>Our team will review your inquiry and get back to you within 24-48 hours. In the meantime, feel free to explore our platform and create beautiful landscape designs.</p>

              <p>If you have any urgent questions, you can also reach us directly at <a href="mailto:support@ai-landscapedesigner.com">support@ai-landscapedesigner.com</a>.</p>

              <p>Best regards,<br>The AI Landscape Designer Team</p>

              <a href="https://ai-landscapedesigner.com" class="button">Visit Our Platform</a>
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
}

/**
 * Main Vercel serverless function handler
 * Following Resend API best practices and security guidelines
 */
export default async function handler(request: Request): Promise<Response> {
  // Only allow POST requests for security
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed. Only POST requests are accepted.'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Validate Content-Type header for security
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(JSON.stringify({
        error: 'Content-Type must be application/json'
      }), {
        status: 415, // Unsupported Media Type
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request body
    const formData: ContactFormData = await request.json();

    // Validate required fields
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.message?.trim()) {
      return new Response(JSON.stringify({
        error: 'All fields are required: name, email, and message'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return new Response(JSON.stringify({
        error: 'Please enter a valid email address'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Apply rate limiting to prevent abuse (following Resend best practices)
    const clientId = getClientIdentifier(request);
    if (!checkRateLimit(clientId)) {
      return new Response(JSON.stringify({
        error: 'Too many contact form submissions. Please try again later.'
      }), {
        status: 429, // Too Many Requests
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send emails (both contact and auto-reply)
    await sendContactEmail(formData);
    await sendAutoReplyEmail(formData);

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contact form submission error:', error);

    // Return generic error response (don't expose internal details)
    return new Response(JSON.stringify({
      error: 'Failed to send message. Please try again or contact us directly.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

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

// Get client identifier (IP-based for server-side rate limiting)
const getClientIdentifier = (request: Request): string => {
  // Try to get IP from various headers (common in serverless environments)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  // Use the first available IP, fallback to a generic identifier
  const ip = forwarded?.split(',')[0]?.trim() ||
             realIp ||
             cfConnectingIp ||
             'unknown-ip';

  return ip;
};

// Initialize Resend with API key
const getResendInstance = (): Resend => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable not configured');
  }

  // Basic validation that API key follows Resend format (starts with 're_')
  if (!apiKey.startsWith('re_')) {
    throw new Error('Invalid RESEND_API_KEY format. API keys should start with "re_"');
  }

  return new Resend(apiKey);
};

// Send contact email to support team
const sendContactEmail = async (formData: ContactFormData): Promise<void> => {
  const { name, email, message } = formData;

  const resendInstance = getResendInstance();

  console.log('📧 Sending contact email to support team...');

  const { data, error } = await resendInstance.emails.send({
    from: 'AI Landscape Designer <noreply@ai-landscapedesigner.com>',
    to: ['support@ai-landscapedesigner.com'],
    subject: `New Contact Form Submission from ${escapeHtml(name)}`,
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
                <div class="value">${escapeHtml(name)}</div>
              </div>

              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
              </div>

              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
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
    replyTo: email,
  });

  if (error) {
    console.error('❌ Resend contact email error:', error);
    throw new Error('Failed to send email. Please try again later.');
  }

  console.log('✅ Contact email sent successfully:', data?.id);
};

// Send auto-reply email to user
const sendAutoReplyEmail = async (formData: ContactFormData): Promise<void> => {
  const { name, email } = formData;

  try {
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
                <p>Dear ${escapeHtml(name)},</p>

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
    } else {
      console.log('✅ Auto-reply email sent successfully:', data?.id);
    }
  } catch (error) {
    console.error('❌ Error sending auto-reply email:', error);
  }
};

// Vercel serverless function handler
export default async function handler(request: Request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Validate Content-Type header
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be application/json' }), {
        status: 415, // Unsupported Media Type
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const formData: ContactFormData = await request.json();

    // Validate required fields
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.message?.trim()) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return new Response(JSON.stringify({ error: 'Please enter a valid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check rate limit
    const clientId = getClientIdentifier(request);
    if (!checkRateLimit(clientId)) {
      return new Response(JSON.stringify({ error: 'Too many contact form submissions. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send contact email (blocking)
    await sendContactEmail(formData);

    // Send auto-reply email (also blocking for reliability)
    await sendAutoReplyEmail(formData);

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contact form submission error:', error);

    // Return error response
    return new Response(JSON.stringify({
      error: 'Failed to send message. Please try again or contact us directly.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}