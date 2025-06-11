# Admin Dashboard Guide

## Overview

The InvestAI Admin Dashboard provides a comprehensive set of tools for platform administrators to manage users, orders, wallets, and funding requests. This guide explains how to access and use the admin features effectively.

## Accessing the Admin Dashboard

### Admin Access Method

The system identifies admin users based on their email address:
- Any user with an email containing "admin" or "support" is automatically granted admin privileges
- Example: `admin@example.com` or `support@yourdomain.com`

To access the admin dashboard:
1. Sign in with your admin email
2. The "Admin" tab will automatically appear in your sidebar
3. Click on the "Admin" tab to access the dashboard

## Admin Dashboard Sections

### 1. Overview

The dashboard overview provides a quick snapshot of platform activity:
- Total users and active users count
- Total wallet balance across all users
- Today's trading volume and number of trades
- Pending orders requiring attention
- Pending funding requests awaiting review
- System status indicators

Quick action buttons allow you to:
- Create new users
- Create orders for users
- Review pending orders
- Process funding requests

### 2. User Management

The Users tab allows you to:
- View all registered users
- Search and filter users by email or name
- Create new users with initial wallet balances
- Manage user wallets (add/withdraw funds)
- View user details and status

### 3. Order Management

The Orders tab allows you to:
- View all pending orders
- Execute or cancel orders
- Filter orders by type, status, or user
- Create new orders on behalf of users

### 4. Wallet Management

The Wallets tab allows you to:
- View all user wallets and balances
- Process deposits and withdrawals
- View transaction history
- Add transactions with detailed descriptions

### 5. Funding Requests

The Funding Requests tab allows you to:
- View all user funding requests
- Filter requests by status (pending, approved, rejected, completed)
- Approve or reject funding requests
- Process deposits after receiving user payments
- Add admin notes for record-keeping

### 6. Settings

The Settings tab provides system-level configuration options (coming soon).

## Managing Funding Requests

When a user requests funds, follow this workflow:

1. **Review the Request**
   - Check the user's details and requested amount
   - Review any message provided by the user

2. **Approve or Reject**
   - Click "Approve" if you want to proceed with the funding
   - Click "Reject" if the request cannot be fulfilled

3. **Contact the User**
   - After approving, contact the user with deposit instructions
   - Provide secure payment methods and reference information

4. **Process the Deposit**
   - Once payment is received, click "Process Deposit"
   - Enter the actual amount received
   - Add any relevant admin notes
   - Click "Complete Deposit" to add funds to the user's wallet

5. **Verification**
   - The request will be marked as "Completed"
   - The user's wallet balance will be updated
   - A transaction record will be created

## Security Best Practices

- Only grant admin access to trusted individuals
- Regularly review admin actions in the database
- Use strong, unique passwords for admin accounts
- Log out of admin sessions when not in use
- Verify user identity before processing large transactions

## Troubleshooting

If you encounter issues with the admin dashboard:

1. **Admin tab not visible**
   - Verify your email contains "admin" or "support"
   - Try signing out and back in
   - Clear browser cache and cookies

2. **Can't process transactions**
   - Check that you have the service role key configured
   - Verify the user's wallet exists
   - Check for any error messages in the console

3. **Data not refreshing**
   - Use the refresh buttons on each panel
   - Try reloading the page
   - Check your network connection

For additional support, contact the development team.