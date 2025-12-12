# Likelemba Database Setup Guide

## Problem
Your website is deployed on Bluehost but cannot connect to the Supabase database properly. This means the database either:
1. Hasn't been set up yet
2. Is missing required tables/columns
3. Doesn't have the right permissions (RLS policies)

## Step 1: Test Your Database Connection

1. Upload `test-db-connection.html` to your Bluehost server
2. Visit: `https://likelemba.mpingimarket.com/test-db-connection.html`
3. Click "Run Tests" to see what's missing

This will show you exactly which tables and columns are missing.

## Step 2: Access Your Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Sign in to your Supabase account
3. Select your Likelemba project (qbdhxwmzljwrwvifxnqt)

## Step 3: Run All Database Migrations

You need to run all the SQL migration files in your Supabase SQL Editor.

### How to Run Migrations:

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste each migration file content (in order!)
4. Click **Run** for each one

### Migration Files (Run in this exact order):

1. **supabase/migrations/20251130025610_create_likelemba_schema.sql**
   - Creates: profiles, likelemba_groups, group_members, payment_schedules, member_payments, contact_messages tables
   - Sets up all RLS policies

2. **supabase/migrations/20251130035746_add_payment_tracking.sql**
   - Adds payment tracking features

3. **supabase/migrations/20251130042325_add_shareable_links.sql**
   - Adds shareable group links

4. **supabase/migrations/20251130043257_add_profile_photo.sql**
   - Adds avatar_url, phone, and address columns to profiles table
   - **This is critical for profile updates to work!**

5. **supabase/migrations/20251130053729_add_financial_summary_fields.sql**
   - Adds financial tracking fields

6. **supabase/migrations/20251130054412_backfill_financial_summary_data.sql**
   - Populates financial data

7. **supabase/migrations/20251130061940_create_payment_due_notifications.sql**
   - Creates notification system

8. **supabase/migrations/20251130064342_create_member_payment_history.sql**
   - Adds payment history

9. **supabase/migrations/20251130073556_add_group_member_limit_validation.sql**
   - Adds member limit validation

10. **supabase/migrations/20251201032727_add_scheduled_payment_dates.sql**
    - Adds scheduled payment dates

11. **supabase/migrations/20251201040010_add_group_status_and_pause_resume.sql**
    - Adds group status management

12. **supabase/migrations/20251206030503_add_service_fee_payment_tracking.sql**
    - Adds service fee tracking

13. **supabase/migrations/20251206052705_create_faq_system.sql**
    - Creates FAQ system

14. **supabase/migrations/20251206062344_create_admin_system.sql**
    - Creates admin system

## Step 4: Create Storage Bucket for Avatars

The profile photo upload feature requires a storage bucket:

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. Click **New bucket**
3. Set these values:
   - **Name**: `avatars`
   - **Public**: ✅ Yes (enable public access)
   - **File size limit**: 2 MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
4. Click **Create bucket**

### Set Storage Policies:

After creating the bucket, set up the RLS policies:

1. Click on the **avatars** bucket
2. Go to **Policies** tab
3. Add these policies:

**Policy 1: Allow authenticated users to upload their own avatar**
```sql
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Policy 2: Allow authenticated users to update their own avatar**
```sql
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Policy 3: Allow authenticated users to delete their own avatar**
```sql
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Policy 4: Allow public to view avatars**
```sql
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## Step 5: Verify Everything Works

1. Go back to: `https://likelemba.mpingimarket.com/test-db-connection.html`
2. Click "Run Tests" again
3. All tests should now pass ✓

## Step 6: Test Your Website

1. Go to: `https://likelemba.mpingimarket.com`
2. Register a new account or log in
3. Go to your Profile page
4. Try updating your profile information
5. Try uploading a profile photo

Everything should now work!

## Common Issues and Solutions

### Issue: "Table does not exist"
**Solution**: You haven't run all the migration files. Go back to Step 3.

### Issue: "Permission denied for table"
**Solution**: The RLS policies weren't created. Make sure you ran the first migration file completely.

### Issue: "Column does not exist"
**Solution**: You're missing a migration that adds that column. Run migration #4 (add_profile_photo.sql) for profile columns.

### Issue: Profile updates fail with no error
**Solution**:
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check if you're actually logged in

### Issue: Photo upload fails
**Solution**:
1. Make sure the `avatars` storage bucket exists
2. Verify the bucket is set to **Public**
3. Check that all 4 storage policies are created

## Quick Verification Checklist

After setup, verify these in Supabase Dashboard:

- ✅ **Database > Tables**: Should see 10+ tables including profiles, likelemba_groups
- ✅ **Database > Table: profiles**: Should have columns: avatar_url, phone, address
- ✅ **Storage**: Should have an `avatars` bucket that is Public
- ✅ **Storage > avatars > Policies**: Should have 4 policies

## Need Help?

If you're still having issues:
1. Run the test page and screenshot the results
2. Open browser console (F12) and screenshot any errors
3. Check the Supabase Dashboard for any error messages
