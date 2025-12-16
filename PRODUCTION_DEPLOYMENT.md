# Production Deployment Guide

## Recent Changes

### 1. Dark Mode Default
- Dark mode is now the default theme on page load
- Users can still toggle to light mode using the theme toggle button
- Theme preference is saved in localStorage

### 2. Logo Fixed
- Changed logo from `fichier_7 copy copy copy.png` to `Logo-1.jpg`
- Logo now displays correctly in production
- Added rounded corners to the logo for better appearance

### 3. Member ID Display
- Member IDs are now displayed on member cards in the Members page
- Member ID appears below the member name in a small monospaced font
- Format: "ID: XXXXX"

## Production Files

The production build is available in: **likelemba-production-ready.tar.gz**

### Contents:
- `dist/` - Production build files (HTML, CSS, JS, assets)
- `public/.htaccess` - Apache configuration for SPA routing
- `.env` - Environment variables (keep secure!)
- `package.json` - Project dependencies
- `package-lock.json` - Locked dependency versions

## Deployment Instructions

### For Bluehost or Apache Server:

1. **Extract the tarball:**
   ```bash
   tar -xzf likelemba-production-ready.tar.gz
   ```

2. **Upload files to your server:**
   - Upload the contents of the `dist/` folder to your web root (e.g., `public_html/`)
   - Make sure the `.htaccess` file is included
   - Upload `.env` file (ensure it's not publicly accessible)

3. **File Structure on Server:**
   ```
   public_html/
   ├── .htaccess
   ├── index.html
   ├── Logo-1.jpg
   ├── fichier_7*.png (legacy files)
   └── assets/
       ├── index-*.css
       └── index-*.js
   ```

4. **Set Environment Variables:**
   - Ensure your `.env` file has the correct Supabase credentials
   - Keep `.env` file secure and not web-accessible

5. **Test the deployment:**
   - Visit your domain
   - Verify dark mode is active by default
   - Check that the logo displays correctly
   - Test navigation and routing

### For Vercel/Netlify:

1. Upload the `dist/` folder contents
2. Configure environment variables in the platform dashboard
3. Set build output directory to `dist`

## Important Notes

- **Dark Mode**: The app now loads in dark mode by default. This improves user experience and reduces eye strain
- **Logo**: Logo-1.jpg is used across all layouts (Public, User, Admin)
- **Member IDs**: Visible to group administrators in the Members page
- **Security**: Never commit the `.env` file to public repositories

## Verification Checklist

After deployment, verify:
- [ ] Site loads in dark mode by default
- [ ] Logo (Logo-1.jpg) displays in navigation
- [ ] Theme toggle works (dark ↔ light)
- [ ] Member IDs display on member cards
- [ ] All routes work correctly (no 404 errors)
- [ ] Database connection works
- [ ] Authentication flows function properly

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify `.env` variables are correct
3. Ensure `.htaccess` is configured properly for SPA routing
4. Check file permissions on the server

## Build Information

- Build Date: December 16, 2024
- Build Tool: Vite 5.4.8
- Framework: React 18.3.1
- Total Bundle Size: ~1.1 MB (309 KB gzipped)
