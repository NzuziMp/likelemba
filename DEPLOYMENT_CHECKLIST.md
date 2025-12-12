# Bluehost Deployment Checklist

## Before Uploading

- [ ] Production build completed (`npm run build` ✅ - Already done!)
- [ ] Review environment variables in `.env` file
- [ ] Have Bluehost cPanel login credentials ready
- [ ] Know your domain name

## Supabase Configuration

- [ ] Log in to Supabase Dashboard (https://app.supabase.com)
- [ ] Add Bluehost domain to **Site URL** (Settings → API)
- [ ] Add domain to **Redirect URLs** (Authentication → URL Configuration)
  - Format: `https://yourdomain.com/**`

## File Upload

- [ ] Log in to Bluehost cPanel
- [ ] Open File Manager
- [ ] Navigate to `public_html`
- [ ] Delete default files (index.html, etc.)
- [ ] Upload ALL contents from `dist` folder:
  - [ ] `index.html`
  - [ ] `.htaccess` (IMPORTANT!)
  - [ ] `assets` folder (contains all CSS and JS)
  - [ ] Logo and images

## Post-Deployment Testing

- [ ] Visit your domain
- [ ] Test home page loads correctly
- [ ] Test login functionality
- [ ] Test register new account
- [ ] Test dashboard access
- [ ] Test navigation between pages
- [ ] Test creating a Likelemba group
- [ ] Test member management
- [ ] Test payment tracking
- [ ] Check browser console for errors (F12)

## Security

- [ ] Enable SSL certificate in cPanel
- [ ] Verify HTTPS is working
- [ ] Test that HTTP redirects to HTTPS
- [ ] Verify all API calls work over HTTPS

## Optional but Recommended

- [ ] Enable Cloudflare for CDN
- [ ] Set up cPanel backups
- [ ] Add custom 404 error page
- [ ] Set up email forwarding for contact form

## Files to Upload

Your `dist` folder should contain:
```
dist/
├── index.html
├── .htaccess (IMPORTANT!)
├── assets/
│   ├── index-[hash].css
│   └── index-[hash].js
└── [any other static files]
```

## Quick Reference

**Bluehost cPanel:** https://my.bluehost.com
**Supabase Dashboard:** https://app.supabase.com
**Your Site:** https://yourdomain.com

## Need Help?

- Read: BLUEHOST_DEPLOYMENT.md (detailed guide)
- Bluehost Support: 24/7 chat/phone
- Check browser console for errors (F12)

---

Total Upload Size: ~1.1 MB (very fast!)
Estimated Upload Time: < 1 minute
