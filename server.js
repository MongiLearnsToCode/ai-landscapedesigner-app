import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Modality } from "@google/genai";
import { db } from './db/index.js';
import { user, landscapeRedesigns } from './db/schema.js';
import { eq, desc } from 'drizzle-orm';

// Load environment variables
dotenv.config();

// Load backend env for DATABASE_URL and GEMINI_API_KEY
dotenv.config({ path: './server/.env' });

// Initialize Gemini AI client
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error('GEMINI_API_KEY environment variable not configured');
}
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// Landscaping styles constant (copied from constants.ts)
const LANDSCAPING_STYLES = [
  { id: 'modern', name: 'Modern', description: 'Clean lines, minimalist features, and a focus on natural materials.' },
  { id: 'minimalist', name: 'Minimalist', description: 'Extreme simplicity, open spaces, and a monochromatic color palette.' },
  { id: 'rustic', name: 'Rustic', description: 'Natural, rough-hewn materials like wood and stone for a cozy, country feel.' },
  { id: 'japanese', name: 'Japanese Garden', description: 'A serene design with rocks, water features, moss, and carefully pruned trees.' },
  { id: 'urban-modern', name: 'Urban Modern', description: 'Sleek design for small spaces, using planters, vertical gardens, and hardscapes.' },
  { id: 'english-cottage', name: 'English Cottage', description: 'A charmingly dense style packed with roses, climbing vines, and informal pathways.' },
  { id: 'mediterranean', name: 'Mediterranean', description: 'Gravel paths, terracotta pots, and plants like olive trees and lavender.' },
  { id: 'tropical', name: 'Tropical', description: 'Lush, dense foliage with vibrant flowers, large leaves, and exotic plants.' },
  { id: 'farmhouse', name: 'Farmhouse', description: 'A practical style with vegetable patches, picket fences, and informal flower beds.' },
  { id: 'coastal', name: 'Coastal', description: 'Beach-inspired elements like ornamental grasses, weathered wood, and hardy plants.' },
  { id: 'desert', name: 'Desert', description: 'Drought-tolerant plants like cacti and succulents, with gravel and rock features.' },
  { id: 'bohemian', name: 'Bohemian', description: 'A relaxed, eclectic mix of patterns, textures, and colorful, free-flowing plants.' },
];

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Parse CLIENT_ORIGIN as comma-separated allowlist
const clientOrigin = process.env.CLIENT_ORIGIN;
const allowedOrigins = clientOrigin ? clientOrigin.split(',').map(origin => origin.trim()) : null;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin header (e.g., same-origin or mobile apps)
    if (!origin) {
      return callback(null, true);
    }
    // Allow all origins if CLIENT_ORIGIN is not set (e.g., local development)
    if (!allowedOrigins || allowedOrigins.length === 0) {
      return callback(null, true);
    }
    // Check if origin is in the allowlist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Reject otherwise
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Enable credentials for Clerk auth cookies
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(clerkMiddleware());

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

// Helper to sanitize prompt inputs to prevent injection
const sanitizePromptInput = (input) => {
  if (typeof input !== 'string') return '';
  // Remove quotes and newlines that could break prompt structure
  return input.replace(/['"\n\r]/g, '').trim();
};

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



// ============================================
// SECURE API ROUTES WITH AUTHENTICATION
// ============================================

// GET /api/history - Fetch user's redesign history
app.get('/api/history', requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;

    console.log('📋 Fetching history for authenticated user:', userId);

    const redesigns = await db
      .select()
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.userId, userId))
      .orderBy(desc(landscapeRedesigns.createdAt));

    console.log('✅ Found', redesigns.length, 'redesigns');

    res.json({ redesigns });
  } catch (error) {
    console.error('❌ Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/history - Save new redesign
app.post('/api/history', requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const {
      originalImageUrl,
      redesignedImageUrl,
      catalog,
      styles,
      climateZone
    } = req.body;

    if (!originalImageUrl || !redesignedImageUrl) {
      return res.status(400).json({ error: 'Image URLs required' });
    }

    // Validate catalog and styles
    if (!Array.isArray(catalog)) {
      return res.status(400).json({ error: 'Invalid catalog format: must be an array' });
    }
    // Optional: validate each item in catalog, e.g., has name, etc.
    // For now, basic check

    if (typeof styles !== 'object' || styles === null) {
      return res.status(400).json({ error: 'Invalid styles format: must be an object' });
    }
    // Optional: validate styles keys and types

    console.log('💾 Saving redesign for authenticated user:', userId);

    const newRedesign = await db
      .insert(landscapeRedesigns)
      .values({
        id: uuidv4(),
        userId,
        originalImageUrl,
        redesignedImageUrl,
        designCatalog: catalog,
        styles: styles, // Pass object directly for JSON column
        climateZone,
        isPinned: false,
      })
      .returning();

    console.log('✅ Redesign saved:', newRedesign[0].id);

    res.json({ redesign: newRedesign[0] });
  } catch (error) {
    console.error('❌ Error saving redesign:', error);
    res.status(500).json({ error: 'Failed to save redesign' });
  }
});

// DELETE /api/history/:id - Delete a redesign
app.delete('/api/history/:id', requireAuth(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    console.log('🗑️ Deleting redesign:', id, 'for user:', userId);

    // Verify ownership before deleting
    const existing = await db
      .select()
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.id, id))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Redesign not found' });
    }

    if (existing[0].userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db
      .delete(landscapeRedesigns)
      .where(eq(landscapeRedesigns.id, id));

    console.log('✅ Redesign deleted');

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting redesign:', error);
    res.status(500).json({ error: 'Failed to delete redesign' });
  }
});

// PATCH /api/history/:id/pin - Toggle pin status
app.patch('/api/history/:id/pin', requireAuth(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    console.log('📌 Toggling pin for redesign:', id, 'user:', userId);

    // Get current state
    const existing = await db
      .select()
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.id, id))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Redesign not found' });
    }

    if (existing[0].userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Toggle pin status
    const updated = await db
      .update(landscapeRedesigns)
      .set({
        isPinned: !existing[0].isPinned,
        updatedAt: new Date(),
      })
      .where(eq(landscapeRedesigns.id, id))
      .returning();

    console.log('✅ Pin status updated');

    res.json({ redesign: updated[0] });
  } catch (error) {
    console.error('❌ Error toggling pin:', error);
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
});

// ============================================
// USER API ROUTES
// ============================================

// POST /api/users/ensure - Create or update user
app.post('/api/users/ensure', requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { email, name } = req.body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required and must be a string' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('👤 Ensuring user exists:', userId);

    const existing = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(user).values({
        id: userId,
        email: normalizedEmail,
        name: name || 'User',
        emailVerified: true,
      });
      console.log('✅ New user created');
    } else {
      await db
        .update(user)
        .set({ name, email: normalizedEmail, updatedAt: new Date() })
        .where(eq(user.id, userId));
      console.log('✅ User updated');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error ensuring user:', error);
    res.status(500).json({ error: 'Failed to ensure user' });
  }
});

// GET /api/users/redesign-limit - Check redesign usage limit
app.get('/api/users/redesign-limit', requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;

    console.log('🔍 Checking redesign limit for user:', userId);

    // Count redesigns for this user
    const redesigns = await db
      .select()
      .from(landscapeRedesigns)
      .where(eq(landscapeRedesigns.userId, userId));

    const used = redesigns.length;
    const limit = 3; // Free tier limit
    const remaining = Math.max(0, limit - used);

    console.log('✅ Limit check:', { used, remaining });

    res.json({
      canRedesign: remaining > 0,
      remaining,
      used,
      limit,
    });
  } catch (error) {
    console.error('❌ Error checking limit:', error);
    res.status(500).json({ error: 'Failed to check limit' });
  }
});

// ============================================
// GEMINI API PROXY ROUTES
// ============================================

// POST /api/gemini/redesign - Proxy for landscape redesign
app.post('/api/gemini/redesign', requireAuth(), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const {
      base64Image,
      mimeType,
      styles,
      allowStructuralChanges,
      climateZone,
      lockAspectRatio,
      redesignDensity
    } = req.body;

    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: 'Image data and MIME type required' });
    }

    // Validate styles
    if (!Array.isArray(styles)) {
      return res.status(400).json({ error: 'Styles must be an array' });
    }

    // Validate MIME type
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(mimeType)) {
      return res.status(400).json({ error: 'Unsupported image MIME type' });
    }

    // Validate base64 and size
    try {
      const buffer = Buffer.from(base64Image, 'base64');
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (buffer.length > maxSize) {
        return res.status(400).json({ error: 'Image too large' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    console.log('🤖 Processing Gemini redesign for user:', userId);

    // Build the prompt (copied from geminiService.ts)
    const prompt = buildRedesignPrompt(styles, allowStructuralChanges, climateZone, lockAspectRatio, redesignDensity);
    const imagePart = { inlineData: { data: base64Image, mimeType } };
    const parts = [imagePart, { text: prompt }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Check for safety blocks
    if (response.promptFeedback?.blockReason) {
      const reason = response.promptFeedback.blockReason;
      const message = response.promptFeedback.blockReasonMessage || 'No additional details provided.';
      console.error(`Gemini API request blocked. Reason: ${reason}. Message: ${message}`);
      return res.status(400).json({ error: `Request blocked by AI safety filters: ${reason}. Please modify the image or request.` });
    }

    if (!response.candidates || response.candidates.length === 0) {
      console.error("Full API Response (No Candidates):", JSON.stringify(response, null, 2));
      return res.status(500).json({ error: 'The model returned no content. This could be due to a safety policy or an unknown model error.' });
    }

    let redesignedImage = null;
    let accumulatedText = '';

    const responseParts = response.candidates[0].content.parts;
    for (const part of responseParts) {
      if (part.inlineData && !redesignedImage) {
        redesignedImage = {
          base64ImageBytes: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        };
      } else if (part.text) {
        accumulatedText += part.text;
      }
    }

    const designCatalog = parseDesignCatalog(accumulatedText);

    if (!redesignedImage) {
      console.error("Full API Response (No Image Part):", JSON.stringify(response, null, 2));
      return res.status(500).json({ error: 'The model did not return a redesigned image.' });
    }

    console.log('✅ Gemini redesign completed');

    res.json({
      base64ImageBytes: redesignedImage.base64ImageBytes,
      mimeType: redesignedImage.mimeType,
      catalog: designCatalog || { plants: [], features: [] },
    });

  } catch (error) {
    console.error('❌ Gemini redesign error:', error);
    res.status(500).json({ error: 'Failed to process redesign request' });
  }
});

// POST /api/gemini/element-info - Get element info
app.post('/api/gemini/element-info', requireAuth(), async (req, res) => {
  try {
    const { elementName } = req.body;

    if (!elementName) {
      return res.status(400).json({ error: 'Element name required' });
    }

    const sanitizedElementName = sanitizePromptInput(elementName);
    if (!sanitizedElementName) {
      return res.status(400).json({ error: 'Invalid element name' });
    }

    const prompt = `Provide a brief, user-friendly description for a "${sanitizedElementName}" for a homeowner's landscape design catalog. Include its typical size, ideal conditions (sun, water), and one interesting fact or design tip. Format the response as a single, concise paragraph.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ info: response.text });
  } catch (error) {
    console.error('❌ Element info error:', error);
    res.status(500).json({ error: 'Failed to get element info' });
  }
});

// POST /api/gemini/validate - Validate redesign
app.post('/api/gemini/validate', requireAuth(), async (req, res) => {
  res.status(501).json({ error: 'Validation not implemented yet. Please check manually.' });
});

// POST /api/gemini/replacements - Get replacement suggestions
app.post('/api/gemini/replacements', requireAuth(), async (req, res) => {
  try {
    const { elementName, styles, climateZone } = req.body;

    if (!Array.isArray(styles)) {
      return res.status(400).json({ error: 'Styles must be an array' });
    }

    const sanitizedElementName = sanitizePromptInput(elementName);
    const sanitizedClimateZone = sanitizePromptInput(climateZone);
    const styleNames = styles.map(styleId => sanitizePromptInput(LANDSCAPING_STYLES.find(s => s.id === styleId)?.name || styleId)).join(' and ');
    const climateInstruction = sanitizedClimateZone ? ` The suggestions must be suitable for the '${sanitizedClimateZone}' climate.` : '';

    const prompt = `I am redesigning a garden and want to replace a "${sanitizedElementName}".
    Please provide 4 alternative suggestions that fit a '${styleNames}' style.
    ${climateInstruction}
    The suggestions should be similar in function or scale to the original item.
    The response must be a JSON array of strings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    });

    const suggestions = JSON.parse(response.text);
    res.json({ suggestions });
  } catch (error) {
    console.error('❌ Replacements error:', error);
    res.status(500).json({ error: 'Failed to get replacement suggestions' });
  }
});

// POST /api/gemini/element-image - Get element image
app.post('/api/gemini/element-image', requireAuth(), async (req, res) => {
  try {
    const { elementName, description } = req.body;

    const sanitizedElementName = sanitizePromptInput(elementName);
    const sanitizedDescription = sanitizePromptInput(description);

    const prompt = sanitizedDescription
      ? `Photorealistic image of a single "${sanitizedElementName}" (${sanitizedDescription}), isolated on a clean, plain white background. The subject should be centered and clear, like a product photo for a catalog. No text, watermarks, or other objects.`
      : `Photorealistic image of a single "${sanitizedElementName}" isolated on a clean, plain white background. The subject should be centered and clear, like a product photo for a catalog. No text, watermarks, or other objects.`;

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image.imageBytes) {
      throw new Error('Image generation failed to return an image.');
    }

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    res.json({ image: `data:image/png;base64,${base64ImageBytes}` });
  } catch (error) {
    console.error('❌ Element image error:', error);
    res.status(500).json({ error: 'Failed to generate element image' });
  }
});

// Helper function to build redesign prompt (copied from geminiService.ts)
const buildRedesignPrompt = (styles, allowStructuralChanges, climateZone, lockAspectRatio, redesignDensity) => {
  const sanitizedClimateZone = sanitizePromptInput(climateZone);
  const structuralChangeInstruction = allowStructuralChanges
    ? `You are allowed to make structural changes to the LANDSCAPE. This includes adding or altering hardscapes like pergolas, decks, stone patios, retaining walls, and pathways. This permission **DOES NOT** apply to the house. You are **STRICTLY FORBIDDEN** from altering the main building's architecture, windows, doors, or roof.`
    : '**ABSOLUTELY NO** structural changes. You are forbidden from adding, removing, or altering buildings, walls, gates, fences, driveways, or other permanent structures. Your redesign must focus exclusively on softscapes (plants, flowers, grass, mulch) and easily movable elements (outdoor furniture, pots, decorative items).';

  const objectRemovalInstruction = allowStructuralChanges
    ? 'A critical rule is to handle objects like people, animals, or vehicles. You MUST completely remove any such objects from the property and seamlessly redesign the landscape area they were occupying. The ground underneath (grass, pavement, garden beds, etc.) must be filled in as part of the new design.'
    : 'You are **STRICTLY FORBIDDEN** from removing or altering any people, animals, or vehicles (cars, trucks, etc.). Treat all of these as permanent objects in the scene that must not be changed. Your design must work around them.';

  let climateInstruction = sanitizedClimateZone
    ? `All plants, trees, and materials MUST be suitable for the '${sanitizedClimateZone}' climate/region.`
    : 'Select plants and materials that are generally appropriate for the visual context of the image.';

  if (sanitizedClimateZone && /arid|desert/i.test(sanitizedClimateZone)) {
    climateInstruction += " For this arid climate, prioritize drought-tolerant plants. Excellent choices include succulents (like Agave, Aloe), cacti (like Prickly Pear), ornamental grasses (like Blue Grama), and hardy shrubs (like Sagebrush).";
  }

  const aspectRatioInstruction = lockAspectRatio
    ? `You MUST maintain the exact aspect ratio of the original input image. The output image dimensions must correspond to the input image dimensions.`
    : `Preserve the original aspect ratio if possible.`;

  const densityInstruction = (() => {
    switch (redesignDensity) {
      case 'minimal':
        return 'CRITICAL DENSITY INSTRUCTION: The user has selected a MINIMAL design. You MUST prioritize open space and simplicity above all else. Use a very limited number of high-impact plants and features. The final design must be clean, uncluttered, and feel spacious.';
      case 'lush':
        return 'CRITICAL DENSITY INSTRUCTION: The user has selected a LUSH design. This is a primary command. You MUST maximize planting to create a dense, layered, and abundant garden. Fill nearly all available softscape areas with a rich variety of plants, textures, and foliage. The goal is an immersive, vibrant landscape with minimal empty or open space.';
      case 'default':
      default:
        return 'CRITICAL DENSITY INSTRUCTION: The user has selected a BALANCED design. You MUST create a harmonious mix of planted areas and functional open space (like lawn or patio). Avoid extremes: the design should not feel empty or overly crowded. The composition should be thoughtful and well-proportioned.';
    }
  })();

  const jsonSchemaString = JSON.stringify({
    plants: [{ name: "string", species: "string" }],
    features: [{ name: "string", description: "string" }],
  }, null, 2);

  const styleNames = styles.map(styleId => sanitizePromptInput(LANDSCAPING_STYLES.find(s => s.id === styleId)?.name || styleId));
  const styleInstruction = styleNames.length > 1
    ? `Redesign the landscape in a blended style that combines '${styleNames.join("' and '")}'. Prioritize a harmonious fusion of these aesthetics.`
    : `Redesign the landscape in a '${styleNames[0]}' style.`;

  const layoutInstruction = `**CRITICAL RULE: Functional Access (No Exceptions):**
  - **Garages & Driveways:** You MUST consistently identify all garage doors. A functional driveway MUST lead directly to each garage door. This driveway must be kept completely clear of any new plants, trees, hardscaping, or other obstructions. The driveway's width MUST be maintained to be at least as wide as the full width of the garage door it serves. Do not place any design elements on the driveway surface. This is a non-negotiable rule.
  - **All Other Doors:** EVERY door (front doors, side doors, patio doors, etc.) MUST be accessible. This means each door must have a clear, direct, and unobstructed pathway leading to it. This pathway must be at least as wide as the door itself and must connect logically to a larger circulation route like the main driveway or a walkway. Do not isolate any doors.`;

  return `
You are an expert AI landscape designer. Your task is to perform an in-place edit of the user's provided image.

**CORE DIRECTIVE: MODIFY THE LANDSCAPE, PRESERVE THE PROPERTY**
This is the most important rule. You MUST use the user's uploaded image as the base for your work. Your sole purpose is to modify the *landscape* within that photo. You are **STRICTLY FORBIDDEN** from generating a completely new image, replacing the property, or altering the main house/building. The output image must clearly be the same property as the input, but with a new landscape design.

**CRITICAL RULE: THE HOUSE IS IMMUTABLE**
This is a non-negotiable, absolute command. The main building in the photo MUST NOT be changed in any way.
- **DO NOT** alter its architecture, color, materials, windows, doors, roof, or any part of its structure.
- **DO NOT** add new doors or windows where there were none.
- **DO NOT** remove existing doors or windows.
- **DO NOT** change the color of the house paint, trim, or roof.
All design work must be done *around* the existing house as if it were a permanent, uneditable backdrop. This rule takes precedence over all other instructions, including style requests.

${layoutInstruction}

**PRIMARY GOAL: IMAGE GENERATION**
Your response MUST begin with the image part. This is a non-negotiable instruction. The first part of your multipart response must be the redesigned image.

**SECONDARY GOAL: JSON DATA**
After the image, you MUST provide a valid JSON object describing the new plants and features. Do not add any introductory text like "Here is the JSON" or conversational filler. The text part should contain ONLY the JSON object, optionally wrapped in a markdown code block.

**INPUT:**
You will receive one image (and potentially a second layout image) and this set of instructions.

**IMAGE REDESIGN INSTRUCTIONS:**
- **Style:** ${styleInstruction}
- **CRITICAL STYLE APPLICATION RULE:** Applying a style means modifying ONLY the landscape elements (plants, paths, furniture, etc.) within the user's photo to match the requested style. It does NOT mean creating a new property or scene. The house and its surroundings must remain identical to the original image, with only the landscape design changing. This rule is absolute.
- **Image Quality:** This is a CRITICAL instruction. The output image MUST be of the absolute highest professional quality. It must be ultra-photorealistic, extremely detailed, with sharp focus and lighting that matches the original image. The resolution should be as high as possible. Avoid any blurry, pixelated, distorted, or digitally artifacted results. The final image must look like it was taken with a high-end DSLR camera.
- **CRITICAL AESTHETIC RULE: NO TEXTUAL LABELS.** You are absolutely forbidden from adding any text, words, signs, or labels that name the style (e.g., do not write the word 'Modern' or 'Farmhouse' anywhere in the image). The style must be conveyed purely through visual design elements, not through text.
- **Object Removal:** ${objectRemovalInstruction}
- **Structural Landscape Changes:** ${structuralChangeInstruction}
- **Climate:** ${climateInstruction}
- **Aspect Ratio:** ${aspectRatioInstruction}
- **Design Density:** ${densityInstruction}

**JSON SCHEMA (for the text part):**
The JSON object must follow this exact schema.
${jsonSchemaString}
- Ensure every single plant in the JSON catalog is suitable for the specified climate zone. This is a non-negotiable rule.
- If a category is empty, provide an empty list [].
`;
};

// Helper function to parse design catalog
const parseDesignCatalog = (text) => {
  try {
    let jsonStringToParse = text;
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      jsonStringToParse = markdownMatch[1];
    } else {
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        jsonStringToParse = text.substring(jsonStartIndex, jsonEndIndex + 1);
      } else {
        return null;
      }
    }
    return JSON.parse(jsonStringToParse);
  } catch (e) {
    console.error("Failed to parse JSON from model response:", e);
    return null;
  }
};



// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Development API server running on http://localhost:${PORT}`);
  console.log(`📧 Contact form API available at http://localhost:${PORT}/api/contact`);
});