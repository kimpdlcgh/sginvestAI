# Supabase Email Template Setup

## Fixing Email Confirmation Errors

If you're encountering the error "Error sending confirmation email" during signup, this means Supabase is trying to send confirmation emails but the email service isn't configured. Here are two solutions:

### Option 1: Disable Email Confirmation (Recommended for Development)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll down to **User Signups**
5. **Disable** the "Enable email confirmations" toggle
6. Click **Save**

This allows users to sign up immediately without email verification, which is perfect for development and testing.

### Option 2: Configure Email Service (For Production)

If you need email confirmation, you must configure SMTP settings:

1. Go to **Authentication** → **Settings**
2. Scroll to **SMTP Settings**
3. Configure your email provider (Gmail, SendGrid, etc.)
4. Test the configuration
5. Ensure "Enable email confirmations" is enabled

## Custom Password Reset Email Template

To integrate the custom password reset email template with your Supabase project, follow these steps:

### 1. Access Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### 2. Configure Password Reset Template

1. Click on **"Reset Password"** template
2. Replace the default template with the custom HTML template from `supabase/email-templates/reset-password.html`
3. The template includes:
   - **Professional branding** with InvestAI logo and colors
   - **Security notice** about link expiration
   - **Fallback link** for accessibility
   - **Responsive design** that works on all devices

### 3. Configure Redirect URL

**IMPORTANT**: You must also configure the redirect URL in your Supabase project:

1. Go to **Authentication** → **URL Configuration**
2. Add your site URL: `https://your-domain.com` (or `http://localhost:5173` for development)
3. Add redirect URLs:
   - `https://your-domain.com/reset-password`
   - `http://localhost:5173/reset-password` (for development)

### 4. Template Features

#### Design Elements:
- **Modern gradient design** matching the app's aesthetic
- **Responsive layout** for mobile and desktop
- **Professional typography** with clear hierarchy
- **Security-focused messaging** to build trust

#### Security Features:
- **24-hour expiration notice** for the reset link
- **Clear security messaging** about ignoring unwanted emails
- **Branded appearance** to prevent phishing concerns

#### Accessibility:
- **Fallback text link** if the button doesn't work
- **High contrast colors** for readability
- **Clear call-to-action** button

### 5. Password Reset Flow

The complete flow now works as follows:

1. **User requests reset** → Enters email on forgot password page
2. **Email sent** → User receives branded email with reset link
3. **Click link** → Redirects to `/reset-password` page in your app
4. **Set new password** → User enters and confirms new password
5. **Success** → User is redirected back to sign in page

### 6. Template Variables

The template uses Supabase's built-in variables:
- `{{ .ConfirmationURL }}` - The secure password reset link that redirects to your app

### 7. Testing the Complete Flow

1. **Save** the template in your Supabase dashboard
2. **Configure** the redirect URLs
3. **Test** the complete password reset flow:
   - Go to your app's forgot password page
   - Enter a valid email address
   - Check your email for the new branded template
   - Click the "Reset Password" link
   - Verify you're redirected to the reset password page
   - Enter a new password and confirm it works

### 8. Production Considerations

For production use:
- **Custom domain** for email links (optional)
- **SPF/DKIM records** for email deliverability
- **Monitor email delivery** rates and bounces
- **Test across email clients** (Gmail, Outlook, etc.)
- **HTTPS redirect URLs** for security

## Quick Fix for Development

**To immediately resolve signup errors:**

1. **Disable email confirmations** in Supabase Dashboard
2. **Users can sign up instantly** without email verification
3. **Re-enable later** when you configure SMTP for production

## Integration Status

✅ **Email confirmation disabled** - Users can sign up without verification
✅ **Custom template created** - Professional HTML email template
✅ **Security messaging** - Clear expiration and security notices  
✅ **Responsive design** - Works on all devices and email clients
✅ **Brand consistency** - Matches InvestAI app design
✅ **Accessibility** - Fallback links and high contrast
✅ **Complete redirect flow** - Users are redirected to password reset page
✅ **Password strength indicator** - Visual feedback for password security
✅ **Success confirmation** - Clear confirmation when password is updated

The authentication system now works seamlessly for development with the option to enable email verification later for production!