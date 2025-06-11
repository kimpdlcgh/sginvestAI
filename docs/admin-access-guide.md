# Admin Access Guide

## How to Access the Admin Dashboard

The InvestAI platform includes a comprehensive admin dashboard for managing users, orders, wallets, and funding requests. Here's how to access and use it:

### Setting Up Admin Access

1. **Admin Detection Method**:
   - The system identifies admin users based on their email address
   - Any user with an email containing "admin" or "support" is automatically granted admin privileges
   - For example: `admin@example.com` or `support@yourdomain.com`

2. **Creating an Admin Account**:
   - Sign up normally with an email containing "admin" or "support"
   - Or modify an existing user's email in the Supabase dashboard

### Accessing the Admin Dashboard

Once you have an admin account:

1. **Sign in** with your admin email and password
2. The **Admin** tab will automatically appear in your sidebar navigation
3. Click on the **Admin** tab to access the full admin dashboard

### Alternative: Direct Database Configuration

For production environments, you may want more secure admin designation:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **Users**
3. Find your user and click **Edit**
4. Add a custom claim in the user metadata:
   ```json
   {
     "role": "admin"
   }
   ```
5. Update the RLS policies to check for this role instead of email pattern

## Admin Dashboard Features

The admin dashboard provides comprehensive management tools:

### 1. User Management
- View all registered users
- Create new users
- Manage user wallets
- View user profiles and statistics

### 2. Order Management
- Review pending orders
- Execute or cancel orders
- View order history
- Create orders on behalf of users

### 3. Wallet Management
- View all user wallets
- Process deposits and withdrawals
- View transaction history
- Adjust wallet balances

### 4. Funding Requests
- Review pending funding requests
- Approve or reject requests
- Mark requests as completed after processing
- View funding request history

### 5. System Overview
- View key platform statistics
- Monitor user activity
- Track trading volume
- View pending actions requiring attention

## Processing Funding Requests

When a user submits a funding request:

1. The request appears in the **Funding Requests** tab
2. Review the request details (user, amount, message)
3. Click **Approve** if you want to proceed
4. Contact the user with deposit instructions via email
5. Once the user completes the payment, manually add funds to their wallet:
   - Go to **Wallet Management**
   - Find the user
   - Click **Add Transaction**
   - Select "deposit" type and enter the amount
6. Return to **Funding Requests** and mark the request as **Completed**

## Security Considerations

- Admin access is powerful - only grant it to trusted individuals
- All admin actions are logged in the database
- Consider implementing additional security measures for production:
  - Two-factor authentication
  - IP restrictions
  - More granular role-based permissions
  - Audit logging

## Troubleshooting

If the admin dashboard is not appearing:
1. Verify your email contains "admin" or "support"
2. Check that you're properly signed in
3. Try signing out and back in
4. Clear browser cache and cookies
5. Check browser console for any errors

For any issues, contact the development team for assistance.