# Data Troubleshooting Guide

## Your Data is Safe!

Your data is still in the database. We confirmed:
- 3 Likelemba groups exist
- 6 user profiles exist
- All database tables are intact

## Why Can't I See My Data?

The most common reason is **authentication**. Your session may have expired or been cleared.

### How Row Level Security (RLS) Works

The database uses RLS policies to protect your data:
- You can ONLY see groups where you are the creator
- If you're not logged in, you see NOTHING
- Each user's data is isolated from other users

### Common Causes

1. **Not Logged In**
   - Your session expired
   - You cleared browser data (cookies/localStorage)
   - You're accessing from a different browser/device

2. **Wrong Account**
   - You created groups with a different email
   - You need to log in with the original account

3. **Environment Variables Missing** (Production Only)
   - `.env` file not uploaded to server
   - Supabase credentials not configured

## How to Fix

### Step 1: Check Browser Console

1. Open browser console (F12)
2. Look for these messages:
   ```
   [Supabase] Initializing client with URL: Present
   [Supabase] Anon key: Present
   [Supabase] Client initialized successfully
   [AuthContext] Initial session check: Authenticated OR Not authenticated
   ```

### Step 2: Verify Authentication

**If you see "Not authenticated":**
1. Go to the Login page
2. Log in with your original email and password
3. Return to Dashboard

**If you see "Authenticated" but no groups:**
1. Note your User ID in the console
2. Check if this is the account that created the groups

### Step 3: Database Query (For Developers)

Run this query in Supabase Dashboard to see all groups:
```sql
SELECT id, name, creator_id, status, created_at
FROM likelemba_groups;
```

Match your User ID with the `creator_id` to confirm ownership.

### Step 4: Production Deployment

**For production, ensure:**
1. `.env` file is in the root directory
2. Contains valid Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Web server serves the `.env` file (or uses environment variables)

## Diagnostic Logs

The application now includes detailed logging:

### Supabase Connection
- Shows if environment variables are loaded
- Confirms client initialization

### Authentication
- Shows session status on page load
- Logs auth state changes
- Shows user ID when authenticated

### Dashboard
- Shows if session is active
- Shows number of groups fetched
- Indicates RLS filtering in action

## Need More Help?

1. Check browser console for error messages
2. Verify you're using the correct login credentials
3. Ensure `.env` file is properly configured
4. Contact support with:
   - Console logs (F12)
   - Your user email (not password!)
   - Browser and device info

## Data Recovery

If you're still unable to see your data after logging in:

1. Verify you're using the correct account
2. Check if you have multiple accounts
3. Contact support with your user ID from console logs

Your data is safe in the database and protected by RLS. You just need to authenticate with the correct account to access it.
