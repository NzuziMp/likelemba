# Deploy Production Build with Email Confirmation

This package contains the production build of Likelemba with email confirmation enabled.

## What's Included

- **dist/**: Production-ready compiled files
- **EMAIL_CONFIRMATION_SETUP.md**: Complete email confirmation setup guide
- **DEPLOYMENT_CHECKLIST.md**: General deployment checklist
- **README.md**: Project documentation
- **public/.htaccess**: Apache server configuration
- **package.json & package-lock.json**: Dependency information

## Deployment Steps

### 1. Extract the Files

```bash
tar -xzf likelemba-production-with-email-confirmation.tar.gz
```

### 2. Upload to Bluehost

Upload the contents of the **dist/** folder to your web hosting:

**Via cPanel File Manager:**
1. Log in to your Bluehost cPanel
2. Navigate to File Manager
3. Go to `public_html` (or your domain's root folder)
4. Upload all files from the `dist/` folder
5. Ensure the `.htaccess` file is uploaded (enable "Show Hidden Files" if needed)

**Via FTP:**
1. Connect to your Bluehost server using FTP client
2. Navigate to `public_html`
3. Upload all files from the `dist/` folder
4. Verify `.htaccess` file is present

### 3. Configure Supabase

Before users can register and confirm emails, configure Supabase:

**Authentication Settings:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `qbdhxwmzljwrwvifxnqt`
3. Navigate to **Authentication** → **URL Configuration**
4. Add these redirect URLs:
   ```
   https://www.mpingimarket.com/confirm-email
   https://mpingimarket.com/confirm-email
   ```

**Email Confirmation Settings:**
Email confirmation is enabled by default in production. To verify:
1. Go to **Authentication** → **Settings**
2. Under **Email Auth**, check that **Enable email confirmations** is ON

### 4. Test Email Confirmation Flow

1. Go to your production site: https://www.mpingimarket.com
2. Click "Register" and create a test account with a real email address
3. Check your email for the confirmation link
4. Click the confirmation link
5. Verify you're redirected to the confirmation page
6. Try logging in with the confirmed account

## What Changed

**New Features:**
- Users must confirm their email address before logging in
- Confirmation email is automatically sent upon registration
- Dedicated confirmation page at `/confirm-email`
- Better error messages for unconfirmed accounts
- Multi-language support for confirmation messages

**Updated Files:**
- `src/contexts/AuthContext.tsx` - Added email confirmation to signUp
- `src/pages/ConfirmEmail.tsx` - New confirmation page
- `src/App.tsx` - Added `/confirm-email` route
- `src/contexts/LanguageContext.tsx` - Added confirmation translations

## Troubleshooting

### Users not receiving confirmation emails

- Check Supabase Dashboard → Authentication → Logs
- Verify redirect URLs are configured correctly
- Check spam/junk folders
- Ensure Supabase email sending is enabled

### Confirmation link shows error

- Verify redirect URLs in Supabase match your domain exactly
- Check that the link hasn't expired (default: 24 hours)
- Ensure user hasn't already confirmed their email

### Users can log in without confirming

- This indicates email confirmation is disabled in Supabase
- Go to Authentication → Settings and enable email confirmations

## Important Notes

- Email confirmation is required for all new registrations
- Existing users who registered before this update can log in normally
- Confirmation links expire after 24 hours
- Users can request a new confirmation email if needed
- All confirmation messages support English, French, Arabic, and Portuguese

## Support

For detailed setup instructions, see:
- **EMAIL_CONFIRMATION_SETUP.md** - Complete email confirmation guide
- **DEPLOYMENT_CHECKLIST.md** - General deployment checklist
- **README.md** - Project documentation

## Production URL

Once deployed, your application will be live at:
- **https://www.mpingimarket.com**
- **https://mpingimarket.com**

Make sure both URLs are properly configured in Supabase redirect settings.
