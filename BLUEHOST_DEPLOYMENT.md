# Bluehost Deployment Guide

## Overview
This guide will help you deploy your Likelemba application frontend to Bluehost while keeping the Supabase backend infrastructure.

## Prerequisites
- Active Bluehost hosting account
- FTP/SFTP access credentials
- Domain name configured in Bluehost

## Step 1: Build the Application (Already Done!)
The production build has been created in the `dist` folder with optimized assets.

## Step 2: Prepare Environment Variables

### Important: Update Your Domain
Before uploading, you need to update the Supabase configuration to allow your Bluehost domain.

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Add your Bluehost domain to the **Site URL** field (e.g., `https://yourdomain.com`)
5. Go to **Authentication** → **URL Configuration**
6. Add your domain to **Redirect URLs** (e.g., `https://yourdomain.com/**`)

### Environment Variables in Production
Your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

These are already baked into the built files in the `dist` folder. They are safe to expose as they're the public anon key.

## Step 3: Upload Files to Bluehost

### Option A: Using File Manager (Easiest)
1. Log in to your Bluehost cPanel
2. Open **File Manager**
3. Navigate to `public_html` (or your domain's root directory)
4. Delete any existing files (like default index.html)
5. Upload ALL files from the `dist` folder:
   - `index.html`
   - `assets` folder (contains CSS and JS files)
   - `Logo-1.jpg` (if in dist)
   - Any other files in the dist folder

### Option B: Using FTP Client (FileZilla, Cyberduck, etc.)
1. Connect to your Bluehost account via FTP:
   - Host: `ftp.yourdomain.com` or your server IP
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21 (FTP) or 22 (SFTP)
2. Navigate to `public_html`
3. Upload all files from the `dist` folder

## Step 4: Configure .htaccess for React Router

Create a `.htaccess` file in your `public_html` directory with this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

# Caching for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### Why .htaccess?
This file ensures that:
- All routes (like `/dashboard`, `/login`, etc.) properly load your React app
- Static assets are cached for better performance
- Files are compressed for faster loading

## Step 5: Verify Deployment

1. Visit your domain (e.g., `https://yourdomain.com`)
2. Test the following:
   - ✅ Home page loads
   - ✅ Login/Register works
   - ✅ Navigation between pages works
   - ✅ Dashboard loads after login
   - ✅ All Supabase features work (database, auth, etc.)

## Step 6: SSL Certificate (HTTPS)

Bluehost provides free SSL certificates:
1. Go to cPanel → **SSL/TLS Status**
2. Enable SSL for your domain
3. Force HTTPS by adding to `.htaccess` (before the RewriteEngine On line):

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## Troubleshooting

### Issue: 404 errors on page refresh
**Solution:** Make sure the `.htaccess` file is in place and mod_rewrite is enabled.

### Issue: Blank page or errors
**Solution:**
1. Check browser console for errors (F12)
2. Verify Supabase URL and API key are correct
3. Ensure your domain is added to Supabase allowed URLs

### Issue: Authentication not working
**Solution:**
1. Add your domain to Supabase redirect URLs
2. Check that HTTPS is enabled
3. Verify cookies are not being blocked

### Issue: CORS errors
**Solution:**
1. Add your domain to Supabase project settings
2. Ensure API URL is correct in environment variables

## Architecture

After deployment, your application will work as follows:

```
User Browser
    ↓
Bluehost (Static React Files)
    ↓
Supabase Backend (Database, Auth, Edge Functions)
    ↓
Data Storage
```

- **Frontend:** Hosted on Bluehost (your static HTML, CSS, JS)
- **Backend:** Hosted on Supabase (database, authentication, API)
- **Edge Functions:** Running on Supabase infrastructure
- **Database:** PostgreSQL on Supabase

## Future Updates

To update your application:
1. Make changes to your code locally
2. Run `npm run build`
3. Upload the new `dist` folder contents to Bluehost
4. Clear browser cache and test

## Performance Tips

1. **Enable Cloudflare** (free on Bluehost) for CDN and DDoS protection
2. **Optimize images** before uploading
3. **Monitor Supabase usage** in the Supabase dashboard
4. **Set up backups** in cPanel

## Cost Breakdown

- **Bluehost:** Your existing hosting plan (no additional cost)
- **Supabase:**
  - Free tier: 500MB database, 50,000 monthly active users
  - Paid tier: Starts at $25/month for more resources

## Support

- **Bluehost Support:** Available 24/7 via chat/phone
- **Supabase Support:** https://supabase.com/support
- **Application Issues:** Check browser console and Supabase logs

---

Your application is now production-ready and can be deployed to Bluehost! 🚀
