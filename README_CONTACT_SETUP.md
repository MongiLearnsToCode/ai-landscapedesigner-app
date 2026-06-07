# Contact Form Setup with Resend

This guide explains how to set up the contact form email functionality using Resend.

## Prerequisites

1. A [Resend](https://resend.com) account
2. The `ai-landscapedesigner.com` domain verified in Resend for production emails

## Setup Steps

### 1. Get Your Resend API Key

1. Sign up for a Resend account at [resend.com](https://resend.com)
2. Go to your dashboard and create an API key:
   - Select **Sending access** permission (more secure than Full access)
   - Optionally restrict to your domain for additional security
3. **Important**: Copy the API key immediately - it can only be viewed once
4. Store it securely - never commit API keys to version control

### 2. Configure Environment Variables

Create a `.env.local` file in the project root (copy from `.env.example`):

```bash
# Resend API Key (required for contact form emails - server-side only)
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL="AI Landscape Designer <noreply@ai-landscapedesigner.com>"
SUPPORT_EMAIL=support@ai-landscapedesigner.com
```

<Warning>
**Security Note**: API keys are sensitive credentials that should never be committed to version control or shared publicly. Always use environment variables and keep your `.env.local` file secure.
</Warning>

### 3. Verified Production Domain

Production email is configured to send from the verified `ai-landscapedesigner.com` domain:

- From address: `AI Landscape Designer <noreply@ai-landscapedesigner.com>`
- Support inbox: `support@ai-landscapedesigner.com`

If the sending address ever changes, set these server-side env vars instead of editing the API route:

```bash
RESEND_FROM_EMAIL="AI Landscape Designer <noreply@ai-landscapedesigner.com>"
SUPPORT_EMAIL=support@ai-landscapedesigner.com
```

## Features

### Rate Limiting
- Maximum 3 contact form submissions per hour per IP address
- Server-side rate limiting using IP-based tracking
- Prevents spam and abuse

### Email Templates
- **Contact Email**: Professional HTML email sent to support team
- **Auto-Reply**: Thank-you email sent to the user
- Responsive design that works on all devices

### Error Handling
- Comprehensive error handling with user-friendly messages
- Graceful degradation if email service is unavailable
- Detailed logging for debugging

### Validation
- Required field validation
- Email format validation
- Input sanitization

## Testing

### Development Testing
A valid `RESEND_API_KEY` is required for development. Set it in your `.env.local` file:

```bash
RESEND_API_KEY=re_your_actual_api_key_here
```

The contact form will send real emails during development, so use a test API key or the verified `ai-landscapedesigner.com` sender.

### Production Testing
1. Set up a real Resend API key
2. Confirm `ai-landscapedesigner.com` still shows as verified in Resend
3. Test the contact form on your production site
4. Check your email inbox for the contact submissions

## Troubleshooting

### Common Issues

1. **"Email service is not configured"**
    - Check that `RESEND_API_KEY` is set in your environment variables
    - Make sure the API key is valid

2. **"Too many contact form submissions"**
   - Rate limit exceeded (3 per hour)
   - Wait for the rate limit to reset or clear sessionStorage

3. **Emails not being delivered**
   - Check that your domain is verified in Resend
   - Verify the `from` email address uses a verified domain
   - Check your Resend dashboard for delivery status

### Logs
Check your server/serverless logs (e.g., Vercel deployment logs) for detailed email sending activity:
- `📧 Sending contact email to support team...`
- `✅ Contact email sent successfully: [email-id]`
- `📧 Sending auto-reply email to user...`
- `✅ Auto-reply email sent successfully: [email-id]`

## API Key Management

### Best Practices (Following Resend Documentation)
- Use **Sending access** API keys instead of Full access for better security
- Restrict API keys to specific domains when possible for additional protection
- Regularly rotate API keys and delete inactive ones (unused for 30+ days)
- Monitor API key usage and logs in your Resend dashboard
- Keep API keys confidential - they can only be viewed once during creation
- Use separate API keys for different applications/actions

### API Key Permissions
- **Full access**: Complete control over all resources (use sparingly)
- **Sending access**: Email sending only (recommended for contact forms)
- Domain restrictions can be applied to Sending access keys

### Troubleshooting
- Check your Resend dashboard for API key status and recent usage logs
- Verify domain verification if emails are not being delivered
- Review server/serverless logs for detailed error messages
- Test API key permissions and domain restrictions
- Ensure API key follows `re_` format as specified in Resend docs

## Security Notes

- API keys are securely stored server-side and never exposed to the client
- Server-side rate limiting prevents abuse and spam
- All user input is HTML-escaped to prevent XSS attacks in email templates
- Email functionality is handled via secure Vercel serverless functions
- No sensitive data is logged or exposed

## Cost

Resend has a generous free tier:
- 3,000 emails/month free
- $0.0006 per email after that

The contact form sends 2 emails per submission (contact + auto-reply), so you can handle ~1,500 contact form submissions per month on the free tier.
