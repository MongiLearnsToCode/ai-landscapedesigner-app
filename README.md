<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1rfjqLceVuySgBwiJ_UKNZ-XmGokOukSH

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Configure the following required variables:
     - `VITE_GEMINI_API_KEY`: Your Gemini API key from Google AI Studio
     - `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
     - `DATABASE_URL`: PostgreSQL database URL
     - `POLAR_ACCESS_TOKEN`: Your Polar.sh access token
     - `RESEND_API_KEY`: Your Resend API key for email
     - `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`: Cloudinary credentials
3. Set up the database:
   `npm run db:migrate`
4. Run the app:
   `npm run dev`

## Polar.sh Subscription Setup

This app uses Polar.sh for subscription management. To set up payments:

1. Create a [Polar.sh account](https://polar.sh/signup)
2. Create products for each plan (Personal, Creator, Business) with monthly and annual prices
3. Configure the following environment variables with your Polar product/price IDs:
   - `POLAR_PERSONAL_PRODUCT_ID`
   - `POLAR_CREATOR_PRODUCT_ID`
   - `POLAR_BUSINESS_PRODUCT_ID`
   - `VITE_POLAR_PRICE_PERSONAL_MONTHLY`
   - `VITE_POLAR_PRICE_CREATOR_MONTHLY`
   - `VITE_POLAR_PRICE_BUSINESS_MONTHLY`
   - `VITE_POLAR_PRICE_PERSONAL_ANNUAL`
   - `VITE_POLAR_PRICE_CREATOR_ANNUAL`
   - `VITE_POLAR_PRICE_BUSINESS_ANNUAL`
4. Set up webhooks in your Polar dashboard pointing to `/api/webhooks/polar`
5. Configure webhook secret: `POLAR_WEBHOOK_SECRET`

For sandbox testing, set `POLAR_SERVER=sandbox` in your environment.

## Deployment

### Environment Variables for Production

Ensure all environment variables from `.env.example` are properly configured:

- **Polar.sh**: Switch `POLAR_SERVER` to `production` and use production access tokens
- **Database**: Use a production PostgreSQL database
- **URLs**: Update `VITE_APP_URL`, `POLAR_SUCCESS_URL`, `POLAR_WEBHOOK_URL` to production URLs
- **Security**: Never commit `.env` files to version control

### Build Commands

- `npm run build`: Builds the app and generates sitemap
- `npm run db:generate`: Generate database migrations
- `npm run db:migrate`: Run database migrations

### Webhook Configuration

Set up Polar webhooks in production:
- Endpoint: `https://yourdomain.com/api/webhooks/polar`
- Events: `subscription.created`, `subscription.updated`, `subscription.canceled`
- Secret: Configure `POLAR_WEBHOOK_SECRET`
