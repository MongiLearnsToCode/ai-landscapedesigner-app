# AI Landscape Designer - Project Context

## Project Overview

The **AI Landscape Designer** is a full-stack React web application that leverages Google's Gemini AI to transform outdoor spaces. Users upload photos of their gardens or landscapes and receive AI-redesigned versions based on selected landscaping styles, climate considerations, and design preferences.

### Core Technologies

| Category | Technology |
|----------|------------|
| **Frontend Framework** | React 19.2.0 with TypeScript 5.8.2 |
| **Build Tool** | Vite 6.2.0 |
| **Backend Runtime** | Node.js with Express 5.1.0 |
| **Backend** | Convex (real-time backend with Convex Auth) |
| **AI Integration** | Google GenAI SDK (`gemini-2.5-flash-image` model) |
| **Image Generation** | Imagen 4.0 for element images |
| **Authentication** | Convex Auth (Password provider) |
| **Styling** | Tailwind CSS 3.4.1 |
| **State Management** | Zustand 5.0.8 |
| **Routing** | React Router DOM 7.9.4 |
| **Payments** | Polar (subscriptions) |
| **Email Service** | Resend |
| **Image Storage** | Cloudinary |

### Key Features

- **AI-Powered Redesign**: Upload outdoor space images and get AI-redesigned versions
- **12 Landscaping Styles**: Modern, Minimalist, Rustic, Japanese Garden, Urban Modern, English Cottage, Mediterranean, Tropical, Farmhouse, Coastal, Desert, Bohemian
- **Climate-Aware Design**: Plant selection based on climate zones
- **Density Control**: Minimal, balanced, or lush redesign options
- **Structural Change Toggle**: Option to allow/disallow hardscape modifications
- **Design Catalog**: JSON catalog of plants and features used in redesign
- **History Management**: Save and view past redesigns with pin/delete functionality
- **User Authentication**: Full auth flow via Convex Auth (sign in, sign up, password reset)
- **Subscription System**: Free, Personal, Creator, and Business tiers via Polar
- **Contact Form**: Email support with auto-reply via Resend

## Project Structure

```
ai-landscapedesigner-app/
├── src/                      # Source code root
├── components/               # React UI components
│   ├── Account/              # Account-related components
│   ├── icons/                # Custom icon components
│   ├── ClimateSelector.tsx   # Climate zone selection
│   ├── DesignCatalog.tsx     # Plant/feature catalog display
│   ├── Header.tsx            # Navigation header
│   ├── Footer.tsx            # Page footer
│   ├── ImageUploader.tsx     # Image upload component
│   ├── StyleSelector.tsx     # Landscaping style selection
│   ├── DensitySelector.tsx   # Redesign density control
│   ├── ResultDisplay.tsx     # Original vs redesigned display
│   ├── Modal.tsx             # Image modal
│   ├── ToastContainer.tsx    # Notification system
│   └── ...
├── pages/                    # Page components
│   ├── DesignerPage.tsx      # Main redesign functionality
│   ├── HistoryPage.tsx       # User's redesign history
│   ├── PricingPage.tsx       # Subscription plans
│   ├── SettingsPage.tsx      # User settings
│   ├── SignInPage.tsx        # Authentication
│   ├── SignUpPage.tsx        # Registration
│   ├── ContactPage.tsx       # Contact form
│   └── ...
├── services/                 # Backend service integrations
│   ├── geminiService.ts      # Google GenAI integration (core)
│   ├── cloudinaryService.ts  # Image upload/storage
│   ├── contactService.ts     # Contact form handling
│   ├── rateLimit.ts          # API rate limiting
│   └── errorUtils.ts         # Error sanitization
├── stores/                   # Zustand state stores
│   ├── appStore.ts           # Global app state
│   └── toastStore.ts         # Toast notifications
├── convex/                   # Convex backend functions
│   ├── schema.ts             # Database schema
│   ├── redesigns.ts          # Redesign CRUD operations
│   ├── users.ts              # User management
│   ├── webhooks.ts           # Webhook handlers
│   ├── polar.ts              # Polar checkout and webhook integration
│   ├── http.ts               # HTTP router for webhooks
│   ├── auth.ts               # Convex Auth configuration
│   └── auth.config.ts        # Auth providers config
├── hooks/                    # Custom React hooks
├── constants.ts              # Landscaping style definitions
├── types.ts                  # TypeScript type definitions
├── App.tsx                   # Main app component with routing
├── index.tsx                 # React DOM entry point
├── index.html                # HTML entry point
├── server.js                 # Express API server (contact form, etc.)
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
├── vercel.json               # Vercel deployment config
└── package.json              # Dependencies and scripts
```

## Building and Running

### Prerequisites

- Node.js (v18+)
- npm or pnpm
- API keys for external services (see Environment Variables)

### Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Convex Configuration
VITE_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_SITE_URL=https://your-deployment.convex.site

# Gemini on Vertex AI (Application Default Credentials)
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
GOOGLE_CLOUD_LOCATION=us-central1
# Local development only, if not using `gcloud auth application-default login`:
# GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json

# Resend API Key (server-side only)
RESEND_API_KEY=re_your_actual_api_key_here

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-cloudinary-upload-preset

# Polar Configuration (server-side, set in Convex)
POLAR_ACCESS_TOKEN=polar_oat_your_access_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
POLAR_SANDBOX=true
POLAR_PRODUCT_PERSONAL_MONTHLY=your_personal_monthly_product_id
POLAR_PRODUCT_PERSONAL_ANNUAL=your_personal_annual_product_id
POLAR_PRODUCT_CREATOR_MONTHLY=your_creator_monthly_product_id
POLAR_PRODUCT_CREATOR_ANNUAL=your_creator_annual_product_id
POLAR_PRODUCT_BUSINESS_MONTHLY=your_business_monthly_product_id
POLAR_PRODUCT_BUSINESS_ANNUAL=your_business_annual_product_id
```

### Available Scripts

```bash
# Development
npm run dev              # Start both client (port 3000) and API server (port 3001)
npm run dev:client       # Start Vite development server only
npm run dev:api          # Start Express API server only

# Production
npm run build            # Build for production (includes sitemap generation)
npm run preview          # Preview production build locally

# Testing
npm run test             # Run test suite
```

### Development Mode

The application runs two concurrent servers:

1. **Client** (Vite): `http://localhost:3000` - React frontend
2. **API** (Express): `http://localhost:3001` - Backend services (contact form, health checks)

## Architecture Patterns

### Frontend Architecture

- **Component-Based**: Functional components with TypeScript
- **State Management**: Zustand for global state (`stores/appStore.ts`)
- **Routing**: React Router with custom page navigation via store
- **Styling**: Tailwind CSS with mobile-first responsive design

### Backend Architecture

The project uses a hybrid backend approach:

1. **Express Server** (`server.js`):
   - Contact form endpoint (`POST /api/contact`)
   - Auto-reply emails via Resend
   - Rate limiting (3 submissions per hour per IP)
   - Health check endpoint

2. **Convex Backend** (`convex/`):
   - Real-time database operations
   - User management and authentication (Convex Auth)
   - Redesign history CRUD
   - Polar checkout and webhook handlers
   - Subscription management

### Data Flow

1. User uploads image via `ImageUploader` component
2. User configures preferences (style, climate, density, structural changes)
3. `geminiService.redesignOutdoorSpace()` calls Google GenAI API
4. AI returns redesigned image + JSON catalog of plants/features
5. Results displayed via `ResultDisplay` component
6. User can save to history (stored in Convex/PostgreSQL)
7. History accessible via `HistoryPage` with pin/delete functionality

### AI Integration

**Model**: `gemini-2.5-flash-image` for image editing tasks

**Prompt Engineering** (`services/geminiService.ts`):
- Preserves house structure (forbidden to alter architecture)
- Maintains functional access to garage doors and entrances
- Climate-appropriate plant selection
- Style-specific design guidance
- Aspect ratio preservation
- Density control (minimal/balanced/lush)
- Object handling (remove people/vehicles if structural changes allowed)

**Validation**: Post-generation validation checks:
- Property consistency
- Style accuracy
- Aspect ratio compliance
- Structural change rules
- Climate respect
- Density match
- Authenticity guard

### Authentication Flow

- **Provider**: Convex Auth (Password provider)
- **Integration**: `@convex-dev/auth/react` for React hooks
- **User Management**: Users stored directly in Convex `users` table
- **Session Management**: Convex Auth handles sessions and JWT tokens
- **Sign Up/Sign In**: Email and password authentication
- **Password Reset**: Built-in password reset flow

### Subscription System

**Tiers**:
- **Free**: 3 redesigns/month
- **Personal**: 50 redesigns/month
- **Creator**: 200 redesigns/month
- **Business**: Unlimited redesigns (subject to fair use policy)

**Provider**: Polar with Convex webhook integration for:
- Subscription creation and management
- Payment processing via Polar checkout
- Status updates (active, canceled, past_due, revoked)
- Monthly usage reset
- Customer portal access

**Webhook Events Handled**:
- `subscription.created`: New subscription
- `subscription.active`: Subscription activated
- `subscription.updated`: Subscription updated
- `subscription.uncanceled`: Subscription uncanceled
- `subscription.canceled`: Subscription scheduled for cancellation
- `subscription.past_due`: Payment failed
- `subscription.revoked`: Subscription ended
- `order.created`, `order.paid`, `order.updated`: Order/customer reconciliation

## Development Conventions

### Coding Style

- **TypeScript**: Strict mode enabled
- **Components**: Functional with `React.FC` type annotation
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Exports**: Named exports preferred
- **Imports**: ES6 imports with relative paths, grouped by type

### Component Structure

```typescript
import React from 'react';
// Library imports
// Local imports
// Type imports

export const ComponentName: React.FC<Props> = () => {
  // Hooks
  // Event handlers
  // Render
};
```

### Error Handling

- Use `sanitizeError()` from `services/errorUtils.ts` for user-facing errors
- Never expose API keys or internal error details
- Generic error messages: "Service temporarily unavailable", "Network error occurred"
- Toast notifications for user feedback

### Testing

- Test files: `*.test.ts` in `services/` directory
- Run with `tsx` for TypeScript execution
- Focus on error handling and edge cases

### Styling

- Tailwind CSS classes only (no inline styles)
- Mobile-first responsive design
- Semantic HTML with ARIA labels
- Orange accent color (`#orange-500`) for primary actions

## Key Files Reference

### Core Application

| File | Purpose |
|------|---------|
| `App.tsx` | Main component with routing and auth initialization |
| `index.tsx` | React DOM entry point |
| `stores/appStore.ts` | Global state management (navigation, modal, user) |
| `types.ts` | TypeScript type definitions |
| `constants.ts` | Landscaping style definitions |

### Services

| File | Purpose |
|------|---------|
| `services/geminiService.ts` | **Critical**: AI integration, prompt engineering, image generation |
| `services/cloudinaryService.ts` | Image upload to Cloudinary |
| `services/contactService.ts` | Contact form API calls |
| `services/rateLimit.ts` | Rate limiting utilities |
| `services/errorUtils.ts` | Error sanitization |

### Pages

| File | Purpose |
|------|---------|
| `pages/DesignerPage.tsx` | **Critical**: Main redesign functionality, state management |
| `pages/HistoryPage.tsx` | User's redesign history gallery |
| `pages/PricingPage.tsx` | Subscription plans and checkout |
| `pages/SettingsPage.tsx` | User settings and preferences |

### Backend

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema (users, redesigns, webhookEvents) |
| `convex/redesigns.ts` | Redesign CRUD operations with usage tracking |
| `convex/users.ts` | User management and subscription sync |
| `convex/webhooks.ts` | Webhook event logging |
| `convex/polar.ts` | Polar checkout, customer portal, and webhook handler |
| `convex/http.ts` | HTTP router for webhooks |
| `server.js` | Express API for contact form and emails |

### Components

| File | Purpose |
|------|---------|
| `components/ImageUploader.tsx` | Image upload with preview |
| `components/StyleSelector.tsx` | Landscaping style selection grid |
| `components/ResultDisplay.tsx` | Original vs redesigned comparison |
| `components/DesignCatalog.tsx` | Plant and feature catalog display |
| `components/Header.tsx` | Navigation and user menu |

## Database Schema

### Convex Tables

**users**:
- `_id`: Convex internal ID
- `email`: User email (unique, indexed)
- `name`: User display name
- `image`: Profile image URL
- `emailVerified`: Email verification status
- `polarCustomerId`: Polar customer ID (indexed)
- `subscriptionPlan`: Free, Personal, Creator, Business
- `billingCycle`: monthly, annual
- `subscriptionStatus`: active, canceled, past_due, expired
- `subscriptionId`: Polar subscription ID
- `expirationDate`: Subscription expiration timestamp
- `monthlyRedesignLimit`: Monthly redesign allowance
- `redesignsUsedThisMonth`: Used redesigns this month
- `currentMonthStart`: Monthly reset timestamp

**redesigns**:
- `_id`: Convex internal ID
- `userId`: Reference to users table (indexed)
- `redesignId`: Unique identifier (indexed)
- `originalImageUrl`: Original image URL
- `redesignedImageUrl`: AI-redesigned image URL
- `designCatalog`: JSON (plants, features)
- `styles`: Array of selected styles
- `climateZone`: User's climate zone
- `isPinned`: Boolean for pinned items
- `createdAt`: Timestamp (indexed with userId)

**webhookEvents**:
- `_id`: Convex internal ID
- `eventId`: External event ID (for idempotency, indexed)
- `provider`: Event source (e.g., "revenue_cat")
- `eventType`: Type of webhook event
- `processed`: Boolean
- `processedAt`: Timestamp when processed
- `payload`: Full event data

## API Endpoints

### Express Server (port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/contact` | Submit contact form (rate limited) |
| `GET` | `/api/health` | Health check |

### Convex Functions

| Function | Type | Description |
|----------|------|-------------|
| `redesigns.getHistory` | Query | Get user's redesign history |
| `redesigns.saveRedesign` | Mutation | Save new redesign with usage tracking |
| `redesigns.togglePin` | Mutation | Pin/unpin a redesign |
| `redesigns.deleteRedesign` | Mutation | Delete a redesign |
| `redesigns.checkLimit` | Query | Check monthly usage limit |
| `users.getCurrentUser` | Query | Get current authenticated user |
| `users.ensureUser` | Mutation | Create/update user profile |
| `users.linkPolarCustomer` | Mutation | Link Polar customer ID to user |
| `users.updateSubscription` | Mutation | Update subscription from webhook |
| `webhooks.logWebhookEvent` | Mutation | Log webhook event |
| `webhooks.markWebhookProcessed` | Mutation | Mark event as processed |

## Deployment

### Vercel Configuration

```json
{
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Build Process

1. Sitemap generation (`scripts/generate-sitemap.js`)
2. Vite build (`vite build`)
3. Output to `dist/` directory

### Environment Variables (Production)

All `.env.local` variables must be set in Vercel project settings.

## Security Considerations

- **API Keys**: Never hardcode; use environment variables
- **Convex Auth**: Handles all authentication securely with JWT tokens
- **Rate Limiting**: Contact form limited to 3 submissions/hour/IP
- **Input Sanitization**: HTML escaping in email templates
- **CSP**: Content Security Policy in `index.html`
- **Error Sanitization**: `sanitizeError()` prevents info leakage
- **Webhook Verification**: Polar webhook signature verification

## Common Issues & Solutions

### Gemini API Rate Limits

The `geminiService.ts` includes built-in rate limiting. If exceeded, users see a countdown timer.

### Image Upload Failures

Check Cloudinary configuration in `.env.local`. Images are uploaded before AI processing.

### Subscription Sync Issues

Webhook events are logged in `webhookEvents` table for debugging. Check Convex dashboard.

### Monthly Usage Reset

Automatic reset occurs when 30 days have passed since `currentMonthStart`.

## Additional Documentation

- `AGENTS.md`: Agent-specific guidelines for code modifications
- `ENV_VARS_REFERENCE.md`: Current environment variable reference
- `README_CONTACT_SETUP.md`: Contact form setup details
