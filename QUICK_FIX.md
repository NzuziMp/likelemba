# Quick Fix - Data Not Showing

## Your Data is Safe
All data is in the database:
- 3 groups: "Projet A", "Bomoko", "Union fait la force"
- 6 user accounts
- All members and payment history intact

## Why You Can't See Data

**You need to log in.** The database uses Row Level Security (RLS) that only shows groups you created.

## How to Fix (Choose One)

### Option 1: Use the Test Page (Easiest)

1. Go to: `http://yoursite.com/test-auth`
2. See your authentication status
3. See exactly what the issue is
4. Follow the instructions shown

### Option 2: Log In Directly

**Existing accounts you can use:**
- `nzuzimpingi2025@gmail.com` - Created "Projet A"
- `nzuzimp@gmail.com` - Created "Bomoko"
- `benvenutomike@gmail.com` - Created "Union fait la force"

**Steps:**
1. Go to `/login`
2. Enter email and password
3. Click "Sign In"
4. Go to `/dashboard`
5. You should see your groups

### Option 3: Reset Password (If You Forgot)

1. Go to `/forgot-password`
2. Enter your email
3. Check your email for reset link
4. Create new password
5. Log in

## Still Not Working?

Visit `/test-auth` to see detailed diagnostics including:
- Supabase connection status
- Your authentication status
- Database query results
- Specific error messages

## For Production Deployment

Make sure `.env` file is uploaded with:
```
VITE_SUPABASE_URL=https://qbdhxwmzljwrwvifxnqt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Without these, the app can't connect to the database.
