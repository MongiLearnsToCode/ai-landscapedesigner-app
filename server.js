import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting for contact form submissions (max 3 per hour per IP)
const CONTACT_RATE_LIMIT = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

const contactSubmissions = new Map();

// HTML escaping helper to prevent XSS
function escapeHtml(text) {
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char]);
}

// Rate limiting check
const checkRateLimit = (identifier) => {
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
const getClientIdentifier = (req) => {
  // Try to get IP from various headers (common in serverless environments)
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip'];

  // Use the first available IP, fallback to a generic identifier
  const ip = forwarded?.split(',')[0]?.trim() ||
            realIp ||
            cfConnectingIp ||
            req.ip ||
            'unknown-ip';

  return ip;
};

// Initialize Resend with API key
const getResendInstance = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable not configured');
  }

  return new Resend(apiKey);
};

// Send contact email to support team
const sendContactEmail = async (formData) => {
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
const sendAutoReplyEmail = async (formData) => {
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

// Contact API route
app.post('/api/contact', async (req, res) => {
  try {
    // Validate Content-Type header
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    // Parse request body
    const formData = req.body;

    // Validate required fields
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.message?.trim()) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check rate limit
    const clientId = getClientIdentifier(req);
    if (!checkRateLimit(clientId)) {
      return res.status(429).json({ error: 'Too many contact form submissions. Please try again later.' });
    }

    // Send contact email (blocking)
    await sendContactEmail(formData);

    // Send auto-reply email (blocking for reliability)
    await sendAutoReplyEmail(formData);

    // Return success response
    res.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.'
    });

  } catch (error) {
    console.error('Contact form submission error:', error);

    // Return error response
    res.status(500).json({
      error: 'Failed to send message. Please try again or contact us directly.'
    });
  }
});

// Polar webhook verification
async function verifyPolarWebhook(rawBody, signature, secret) {
  const crypto = await import('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}

// Polar webhook handler
app.post('/api/webhooks/polar', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-polar-webhook-signature'];
    const secret = process.env.POLAR_WEBHOOK_SECRET;

    if (!secret) {
      console.error('POLAR_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify webhook signature
    const isValid = await verifyPolarWebhook(req.body, signature, secret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString());
    console.log('Received Polar webhook:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated':
        await handleSubscriptionEvent(event.data);
        break;
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event.data);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle subscription events
async function handleSubscriptionEvent(subscription) {
  const { db } = await import('./db/client.js');
  const { user } = await import('./db/schema.js');
  const { eq } = await import('drizzle-orm');

  try {
    // Find user by Polar customer ID
    const customerId = subscription.customer.id;
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.polarCustomerId, customerId))
      .limit(1);

    if (!existingUser) {
      console.error('User not found for customer ID:', customerId);
      return;
    }

    // Update subscription info
    await db
      .update(user)
      .set({
        subscriptionId: subscription.id,
        subscriptionPlan: mapPolarPriceToPlan(subscription.price.id),
        subscriptionStatus: subscription.status,
        subscriptionCurrentPeriodStart: new Date(subscription.currentPeriodStart),
        subscriptionCurrentPeriodEnd: new Date(subscription.currentPeriodEnd),
        subscriptionCancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        polarCustomerId: customerId,
        updatedAt: new Date()
      })
      .where(eq(user.id, existingUser.id));

    console.log('Updated subscription for user:', existingUser.id);
  } catch (error) {
    console.error('Error handling subscription event:', error);
  }
}

// Handle subscription canceled
async function handleSubscriptionCanceled(subscription) {
  const { db } = await import('./db/client.js');
  const { user } = await import('./db/schema.js');
  const { eq } = await import('drizzle-orm');

  try {
    await db
      .update(user)
      .set({
        subscriptionStatus: 'canceled',
        subscriptionCancelAtPeriodEnd: false,
        updatedAt: new Date()
      })
      .where(eq(user.subscriptionId, subscription.id));

    console.log('Marked subscription as canceled:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription canceled:', error);
  }
}

// Map Polar price ID to plan name
function mapPolarPriceToPlan(priceId) {
  const priceMap = {
    [process.env.VITE_POLAR_PRICE_PERSONAL_MONTHLY]: 'Personal',
    [process.env.VITE_POLAR_PRICE_CREATOR_MONTHLY]: 'Creator',
    [process.env.VITE_POLAR_PRICE_BUSINESS_MONTHLY]: 'Business',
    [process.env.VITE_POLAR_PRICE_PERSONAL_ANNUAL]: 'Personal',
    [process.env.VITE_POLAR_PRICE_CREATOR_ANNUAL]: 'Creator',
    [process.env.VITE_POLAR_PRICE_BUSINESS_ANNUAL]: 'Business',
  };

  return priceMap[priceId] || 'Free';
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Development API server running on http://localhost:${PORT}`);
  console.log(`📧 Contact form API available at http://localhost:${PORT}/api/contact`);
});