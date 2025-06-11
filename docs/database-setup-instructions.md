# Database Setup Instructions

## Critical: Apply Database Schema

The application is currently failing because the required database tables don't exist in your Supabase project. Follow these steps to fix the database errors:

### 1. Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### 2. Run the Complete Schema Migration

1. Copy the entire contents of `supabase/migrations/complete_schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the migration

This will create all the required tables:
- `profiles` - User profile information
- `portfolio_holdings` - User portfolio holdings
- `trades` - Trade history and orders (**This fixes the main error**)
- `watchlists` - User watchlists
- `assets` - Market asset information
- `positions` - Trading positions
- `transactions` - Transaction history
- `orders` - Trading orders
- `alerts` - Price alerts
- `portfolios` - Portfolio management
- `user_profiles` - Extended user information

### 3. Fix Email Configuration (Development)

To resolve the "Error sending recovery email" issue:

1. In your Supabase Dashboard, go to **Authentication** → **Settings**
2. Scroll down to **User Signups**
3. **Disable** the "Enable email confirmations" toggle
4. Click **Save**

This allows users to sign up and reset passwords without email verification, which is perfect for development.

### 4. Verify Setup

After running the migration:

1. Go to **Table Editor** in your Supabase Dashboard
2. Verify that all tables are created, especially the `trades` table
3. Check that Row Level Security (RLS) is enabled on all tables
4. Test the application - the "relation does not exist" errors should be resolved

### 5. Production Email Setup (Optional)

For production, you'll want to configure proper email delivery:

1. Go to **Authentication** → **Settings**
2. Configure **SMTP Settings** with your email provider
3. Re-enable "Enable email confirmations"
4. Test the email flow

## What This Fixes

✅ **"relation 'public.trades' does not exist" Error** - Creates the missing trades table
✅ **Database Relation Errors** - Creates all missing tables
✅ **Portfolio Service Errors** - Updates service to use correct table names
✅ **Email Recovery Errors** - Disables email confirmation for development
✅ **Row Level Security** - Proper RLS policies for data protection
✅ **Foreign Key Relationships** - Correct table relationships
✅ **Indexes** - Performance optimizations for queries

## Troubleshooting

If you still see errors after running the migration:

1. **Check table creation**: Go to Table Editor and verify the `trades` table exists
2. **Verify RLS policies**: Ensure Row Level Security is enabled
3. **Check user authentication**: Make sure you're signed in to the app
4. **Restart dev server**: Run `npm run dev` again
5. **Clear browser cache**: Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)

## Next Steps

After applying the schema:
1. Restart your development server: `npm run dev`
2. Test user registration and login
3. Test trade functionality - the TradeHistory component should now work
4. Verify all features are working without database errors

The application should now work without the "relation does not exist" errors!