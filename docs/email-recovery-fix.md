# Fix Email Recovery Error

## The Problem
The error "Error sending recovery email" occurs because Supabase's email service isn't configured for your development environment. This is normal and expected for new projects.

## Quick Fix for Development

### 1. Disable Email Confirmation (Recommended for Development)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll down to **User Signups**
5. **DISABLE** the "Enable email confirmations" toggle
6. Click **Save**

This allows users to:
- Sign up without email verification
- Reset passwords without email (they can just create new accounts)
- Use the app immediately for development/testing

### 2. Alternative: Use Manual Password Reset

Instead of the "Forgot Password" feature, users can:
1. Create a new account with a different email
2. Or you can manually reset passwords in the Supabase dashboard

### 3. Configure Email Service (For Production Only)

If you need email functionality for production, you'll need to configure SMTP:

1. Go to **Authentication** → **Settings**
2. Scroll to **SMTP Settings**
3. Configure with your email provider:
   - **Gmail**: Use App Passwords
   - **SendGrid**: Use API key
   - **Mailgun**: Use SMTP credentials
   - **AWS SES**: Use SMTP credentials

#### Example Gmail SMTP Setup:
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password (not your regular password)
```

### 4. Update Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Test the Fix

1. **Apply the SQL migration** in your Supabase SQL Editor
2. **Disable email confirmations** as described above
3. **Restart your dev server**: `npm run dev`
4. **Test signup** with a new email address
5. **Test signin** with the same credentials

## What This Fixes

✅ **Removes email dependency** for development
✅ **Allows immediate user signup** without email verification
✅ **Fixes password recovery errors** by removing email requirement
✅ **Maintains security** through proper RLS policies
✅ **Enables rapid testing** without email setup

## For Production Deployment

When you're ready for production:

1. **Configure proper SMTP** settings in Supabase
2. **Re-enable email confirmations**
3. **Set up custom email templates** (optional)
4. **Configure proper redirect URLs** for your domain
5. **Test email delivery** thoroughly

## Alternative Authentication Methods

If you want to avoid email altogether, consider:

1. **Magic Links** (still requires email setup)
2. **Social Login** (Google, GitHub, etc.)
3. **Phone Authentication** (requires Twilio setup)
4. **Anonymous Authentication** (for guest users)

## Troubleshooting

### Still getting email errors?
1. **Clear browser cache** and cookies
2. **Check Supabase Auth logs** for detailed error messages
3. **Verify email confirmation is disabled**
4. **Try with a completely new email address**

### Users can't sign in after signup?
1. **Check if email_confirmed_at** is set in auth.users table
2. **Manually confirm users** in Authentication → Users
3. **Verify RLS policies** are not blocking access

The authentication system will work smoothly for development once email confirmation is disabled!