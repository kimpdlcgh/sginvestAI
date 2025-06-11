# Integration Guide: Connecting SafeGuard Securities Website with Dashboard

This guide explains how to integrate your existing HTML-based website (safeguardsecurities.us) with your React-based investment dashboard.

## 1. Create a Connection Between Your HTML Website and React Dashboard

The simplest approach is to create a direct link from your HTML website to your dashboard application.

### Step 1: Add Login Link to Your HTML Website

Add a login button or link on your safeguardsecurities.us homepage that points to your dashboard:

```html
<!-- Add this to your HTML website navigation or appropriate section -->
<a href="https://dashboard.safeguardsecurities.us" class="login-button">
    Login to Dashboard
</a>
```

### Step 2: Set Up a Subdomain for Your Dashboard

1. In your Hostinger control panel:
   - Go to "Domains" → "Subdomains"
   - Create a new subdomain: `dashboard.safeguardsecurities.us`
   - Point it to the directory where you'll upload your dashboard files

2. Deploy your React dashboard to this subdomain:
   - Build your React app: `npm run build`
   - Upload the contents of the `dist` folder to the subdomain directory

### Step 3: Configure Supabase for Your Domain

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Add your dashboard subdomain URL:
   - Site URL: `https://dashboard.safeguardsecurities.us`
   - Redirect URLs: `https://dashboard.safeguardsecurities.us/*`

### Step 4: Update Environment Variables

Create a `.env` file in your dashboard project with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. Alternative: Embed Dashboard in an iFrame

If you prefer to keep users on your main domain, you can embed the dashboard in an iframe:

```html
<!-- Add this to a dashboard.html page on your main site -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SafeGuard Securities - Dashboard</title>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        .dashboard-frame { width: 100%; height: 100vh; border: none; }
    </style>
</head>
<body>
    <iframe 
        src="https://dashboard.safeguardsecurities.us" 
        class="dashboard-frame" 
        title="Investment Dashboard">
    </iframe>
</body>
</html>
```

## 3. Production Deployment Considerations

### SSL Certificate

Ensure your subdomain has an SSL certificate for secure HTTPS connections:
- In Hostinger, go to "SSL/TLS" and enable Let's Encrypt for your subdomain

### CORS Configuration

If you experience CORS issues:
1. In Supabase Dashboard, go to **API** → **Settings**
2. Add both domains to the allowed origins:
   - `https://safeguardsecurities.us`
   - `https://dashboard.safeguardsecurities.us`

### Single Sign-On (Optional Enhancement)

For a more seamless experience, you could implement a single sign-on solution:
1. Create a simple API endpoint on your dashboard subdomain
2. When users click "Login" on the main site, redirect to this endpoint
3. The endpoint generates a temporary token and redirects to the dashboard login page
4. The dashboard login page uses the token to authenticate the user

## 4. Deployment Steps

1. **Build your React dashboard**:
   ```bash
   npm run build
   ```

2. **Upload to Hostinger**:
   - Log in to your Hostinger control panel
   - Navigate to File Manager
   - Create a directory for your subdomain (e.g., `dashboard`)
   - Upload all files from your `dist` directory to this folder

3. **Configure subdomain in Hostinger**:
   - Go to "Domains" → "Subdomains"
   - Create `dashboard.safeguardsecurities.us` pointing to your dashboard directory

4. **Test the integration**:
   - Visit your main website
   - Click the login link
   - Verify you're redirected to the dashboard
   - Test authentication flow

## 5. Maintaining Consistent Branding

You've already updated the dashboard with your SafeGuard Securities branding and logo, which is excellent for maintaining a consistent user experience between your main website and the dashboard.

## 6. Troubleshooting Common Issues

- **Authentication errors**: Verify Supabase URL configuration includes your subdomain
- **CORS errors**: Check allowed origins in Supabase API settings
- **Redirect issues**: Ensure your login links use the correct URL format
- **SSL problems**: Verify SSL is properly configured for your subdomain