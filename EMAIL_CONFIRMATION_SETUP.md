# Email Confirmation Setup Guide

This application now requires users to confirm their email address before they can log in. Here's what has been implemented and what you need to configure in Supabase.

## What's Been Implemented

1. **Updated Sign-Up Flow**: Users receive a confirmation email when they register
2. **Email Confirmation Page**: A dedicated page at `/confirm-email` handles the email confirmation
3. **Better Error Messages**: Users see clear messages if they try to log in without confirming their email
4. **Multi-language Support**: Email confirmation messages in English, French, Arabic, and Portuguese

## Required Supabase Configuration

To enable email confirmation, you need to configure your Supabase project settings:

### Step 1: Access Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project: `qbdhxwmzljwrwvifxnqt`

### Step 2: Configure Email Confirmation

1. Navigate to **Authentication** → **Settings**
2. Under **Email Auth**, ensure these settings:
   - **Enable email confirmations**: ON (this should be enabled by default in production)
   - **Confirm email**: Should be set to require confirmation

### Step 3: Configure Redirect URLs

1. In **Authentication** → **URL Configuration**
2. Add the following redirect URLs:
   ```
   http://localhost:5173/confirm-email
   https://www.mpingimarket.com/confirm-email
   https://mpingimarket.com/confirm-email
   ```

### Step 4: Configure Email Templates (Optional)

You can customize the email template that users receive:

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Customize the email content and styling if desired
4. Make sure the confirmation link points to: `{{ .ConfirmationURL }}`

## How It Works

### Registration Flow

1. User fills out registration form with name, email, and password
2. User submits the form
3. Account is created in Supabase, but marked as "unconfirmed"
4. Supabase sends a confirmation email to the user's email address
5. User sees success message: "Account created successfully! Please check your email to confirm your account."

### Confirmation Flow

1. User clicks the confirmation link in their email
2. Link redirects to: `https://www.mpingimarket.com/confirm-email#access_token=...&type=signup...`
3. The ConfirmEmail page verifies the token
4. User sees success message: "Email Confirmed! Your email has been successfully confirmed. You can now log in to your account."
5. Page automatically redirects to login after 3 seconds

### Login Flow

1. If user tries to log in before confirming email, they see:
   - "Please confirm your email address before logging in. Check your inbox for the confirmation email."
2. After confirming email, user can log in normally

## Testing

To test the email confirmation flow:

1. Register a new account with a valid email address you can access
2. Check your email for the confirmation link
3. Click the confirmation link
4. Verify you're redirected to the confirmation page
5. Try logging in with the confirmed account

## Troubleshooting

### Users not receiving confirmation emails

- Check Supabase email logs in Dashboard → Authentication → Logs
- Verify email settings are configured correctly
- Check spam/junk folders
- Ensure your Supabase project has email sending enabled

### Confirmation link shows error

- Verify the redirect URL is correctly configured in Supabase
- Check that the confirmation link hasn't expired (default: 24 hours)
- Ensure the user hasn't already confirmed their email

### Users can log in without confirmation

- Check that "Enable email confirmations" is turned ON in Supabase settings
- This setting is typically OFF for development and ON for production

## Important Notes

- By default, Supabase requires email confirmation in production environments
- In local development, email confirmation might be disabled for easier testing
- Users must confirm their email within 24 hours (configurable in Supabase)
- The confirmation link can only be used once
- Users can request a new confirmation email if needed
