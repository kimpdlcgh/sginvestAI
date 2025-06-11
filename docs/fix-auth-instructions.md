# Fix Supabase Authentication Issues

## Quick Solution for Password Reset and Email Errors

The error you're seeing is because Supabase is trying to send emails, but email service isn't configured in your development environment. Here's how to fix it:

### Option 1: Disable Email Confirmation (Recommended for Development)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll down to **User Signups**
5. **DISABLE** the "Enable email confirmations" toggle
6. Click **Save**

This allows users to sign up without email verification, which is perfect for development and testing.

### Option 2: Create a New Account

If you just need to get in quickly:
1. Go back to the sign-up page
2. Create a new account with a different email address
3. You'll be able to log in immediately without email verification

### Option 3: Configure SMTP for Email Delivery

For production environments, you should set up proper email delivery:

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure with your email provider details:
   - SMTP Host (e.g., smtp.gmail.com)
   - SMTP Port (e.g., 587)
   - SMTP Username (your email)
   - SMTP Password (app password for Gmail)
3. Test the configuration
4. Enable email confirmations

## Why This Happens

Supabase requires email service configuration for:
- Password reset emails
- Email verification
- Magic link authentication

In development, it's common to disable these features for easier testing.

## Additional Troubleshooting

If you're still having issues:
- Clear browser cache and cookies
- Try using an incognito/private browser window
- Check Supabase logs for specific error messages
- Ensure your environment variables are correctly set

Remember that for production, you should properly configure email services to ensure security features work correctly.