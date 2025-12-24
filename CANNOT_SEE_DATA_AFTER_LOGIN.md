# Cannot See Data After Login - Troubleshooting Guide

## The Issue
You're logged in but cannot see any groups on the Dashboard.

## Why This Happens
The database uses **Row Level Security (RLS)** which ONLY shows you groups where **YOU are the creator**. This is working as designed for security.

## Check These Things

### 1. Open Browser Console (Press F12)
Look for the section that says `=== DASHBOARD DIAGNOSTICS ===`

You should see:
```
Current session: Authenticated
User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
User email: your@email.com
Profile loaded: true
Groups fetched: X
```

### 2. Check Which Account You're Using
There are 3 existing accounts with groups:
- `nzuzimpingi2025@gmail.com` - Created "Projet A"
- `nzuzimp@gmail.com` - Created "Bomoko"
- `benvenutomike@gmail.com` - Created "Union fait la force"

**You can ONLY see groups you created!**

## Solutions

### Solution 1: Log In With The Correct Account
If you want to see an existing group:
1. Log out
2. Log in with one of the accounts above
3. You'll see the groups that account created

### Solution 2: Create a New Group
If you're logged in with a different account:
1. You won't see existing groups (that's correct behavior)
2. Click "Create Group" button
3. Create your own group
4. You'll now see your group on the Dashboard

### Solution 3: Use Test Page
Visit `/test-auth` to see:
- Your authentication status
- Your User ID
- Database connection status
- Exactly what's happening

## Database Schema
```sql
likelemba_groups table:
- id (uuid)
- name (text)
- creator_id (uuid) ← This MUST match your User ID
- ...

RLS Policy:
Users can view groups WHERE auth.uid() = creator_id
```

## Common Mistakes

### ❌ Wrong: "I should see all groups"
No. Security prevents you from seeing other people's groups.

### ❌ Wrong: "The database is empty"
No. The database has 3 groups, but they belong to other accounts.

### ✓ Correct: "I can only see MY groups"
Yes! This is the correct behavior.

## Still Not Working?

### Check Console Errors
Look for error messages in the console:
- `Error fetching groups:` - Shows what went wrong
- `Error details:` - Shows specific error information

### Verify Environment Variables
Make sure `.env` file exists with:
```
VITE_SUPABASE_URL=https://qbdhxwmzljwrwvifxnqt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Test Authentication
1. Go to `/test-auth`
2. Click "Run Tests"
3. Check the results
4. If `groupsQuery.count` is 0 but you expect groups, you're using the wrong account

## Quick Test Script

Run this in browser console while logged in:
```javascript
// Check authentication
const { data: { session } } = await supabase.auth.getSession();
console.log('User ID:', session?.user?.id);
console.log('Email:', session?.user?.email);

// Check groups
const { data: groups, error } = await supabase
  .from('likelemba_groups')
  .select('id, name, creator_id');

console.log('Your groups:', groups);
console.log('Error:', error);
```

If `groups` is empty but you expect data, your User ID doesn't match any group's creator_id.
