# Contact Form Alternatives

Since the Resend integration is having issues, here are simpler alternatives to get your contact form working immediately.

## Option 1: Formspree (Recommended - 2 minutes setup)

Formspree is a simple form handling service that forwards emails to you.

### Setup Steps:

1. **Sign up**: Go to [formspree.io](https://formspree.io) and create a free account

2. **Create a form**: Click "Create a new form" and give it a name like "Contact Form"

3. **Get your form ID**: Copy the form endpoint URL (looks like `https://formspree.io/f/xxxxxxxx`)

4. **Update ContactPage.tsx**:

```typescript
// Replace the fetch call in ContactPage.tsx with:
const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(contactData),
});
```

5. **Test**: Submit the contact form and check your email

**Pros**: Free tier, no server setup, works immediately
**Cons**: Limited customization, external service dependency

## Option 2: Direct Email (No Third-Party - SMTP Required)

### Option 2A: Mailto Link (Simplest - No server needed)

Opens the user's email client with pre-filled message:

```typescript
// In ContactPage.tsx, replace the handleSubmit logic with:
const subject = `Contact Form: Message from ${contactData.name}`;
const body = `Name: ${contactData.name}
Email: ${contactData.email}

Message:
${contactData.message}`;

const mailtoUrl = `mailto:your-email@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
window.open(mailtoUrl, '_blank');

addToast('Opening your email client with the message...', 'success');
```

**Pros**: Works immediately, no server setup, no external services
**Cons**: Requires user to have email client configured, manual sending

### Option 2B: Server-Side SMTP (Most Reliable)

Send emails directly using SMTP. Requires email account credentials.

**Setup Steps:**
1. Install nodemailer: `npm install nodemailer @types/nodemailer`
2. Add to environment variables:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```
3. Replace Resend code in `api/contact.ts` with:

```typescript
import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send email function
const sendEmail = async (to: string, subject: string, html: string) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html,
  });
};
```

**For Gmail**: Use App Passwords (not regular password)
**For Outlook/Hotmail**: Use regular credentials
**For Custom SMTP**: Use your server details

**Pros**: Fully automated, no third-party services, professional
**Cons**: Requires SMTP setup, email account credentials needed

## Option 3: Console Logging (For Development)

The current implementation just logs to console and shows success. This is good for testing the UI/UX.

## Option 4: Webhook to Zapier/Make.com

Set up a webhook that posts to automation services:

1. Create a Zapier webhook
2. Update the fetch URL to your webhook URL
3. Set up email sending in Zapier

## Recommendation

Start with **Formspree** - it's the quickest way to get a working contact form with actual email delivery.</content>
</xai:function_call"> 

<xai:function_call name="bash">
<parameter name="command">git add .