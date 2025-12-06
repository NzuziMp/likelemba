# Admin Module Documentation

## Overview

The Admin Module provides comprehensive administrative tools for managing the Likelemba platform. It includes user management, group oversight, message handling, activity logging, and system monitoring.

## Features

### 1. Admin Dashboard (`/admin/dashboard`)
- **System Statistics**: View total users, groups, revenue, and pending messages
- **Recent Activity**: Monitor recent admin actions
- **System Health**: Check database and API status
- **Quick Metrics**: See active vs total counts for users and groups

### 2. User Management (`/admin/users`)
- **View All Users**: See complete list of platform users
- **Search & Filter**: Search by name/email and filter by account status
- **Account Status Control**: Set user accounts to active, suspended, or banned
- **User Details**: View contact information, role (Organizer/Member), and join date
- **Admin Indicators**: Identify admin users with special badges

### 3. Group Management (`/admin/groups`)
- **Monitor All Groups**: View all Likelemba groups across the platform
- **Search & Filter**: Search by group name/creator and filter by status
- **Group Details**: See member count, contribution amounts, start dates
- **Status Tracking**: Monitor active, paused, completed, and cancelled groups
- **Statistics**: View total groups, active groups, and total members

### 4. Message Management (`/admin/messages`)
- **View Contact Messages**: Access all user inquiries from the contact form
- **Filter by Status**: View new, read, or replied messages
- **Respond to Users**: Write and send responses directly from the interface
- **Message Details**: See sender information, timestamps, and message content
- **Response History**: Track when messages were responded to and by whom

### 5. Activity Log (`/admin/activity`)
- **Audit Trail**: Complete log of all admin actions
- **Filter by Type**: View activities by target type (user, group, message, etc.)
- **Detailed Information**: See timestamp, admin name, action, and target type
- **Compliance**: Activity logs are permanent for audit purposes

## Database Structure

### Admin Tables

#### `admin_users`
Tracks users with administrative privileges
- `id`: User ID (references profiles)
- `role`: Admin level (super_admin, admin, moderator)
- `permissions`: JSON object with specific permissions
- `created_at`: When admin status was granted
- `created_by`: Admin who granted the status

#### `admin_activity_log`
Logs all administrative actions
- `id`: Unique log ID
- `admin_id`: Admin who performed the action
- `action`: Description of the action
- `target_type`: Type of entity affected
- `target_id`: ID of affected entity
- `details`: Additional details in JSON format
- `created_at`: When the action occurred

#### `system_settings`
Stores platform-wide configuration
- `key`: Setting identifier
- `value`: Setting value (JSON)
- `description`: What the setting controls
- `updated_at`: Last update timestamp
- `updated_by`: Admin who made the change

### Modified Tables

#### `profiles`
Added admin-related fields:
- `is_admin`: Quick flag for admin status
- `account_status`: Account state (active, suspended, banned)

#### `contact_messages`
Added response tracking:
- `responded_at`: Response timestamp
- `responded_by`: Admin who responded
- `response`: Admin's response text

## Admin Roles & Permissions

### Super Admin
- Full access to all admin features
- Can manage other admins
- Can modify system settings
- Can perform all administrative actions

### Admin
- Can manage users (view, suspend, ban)
- Can monitor groups
- Can respond to messages
- Can view activity logs
- Cannot manage other admins or system settings

### Moderator
- Limited permissions based on configuration
- Typically can respond to messages
- Can view but not modify user/group data

## Security Features

1. **Row Level Security (RLS)**: All admin tables have strict RLS policies
2. **Activity Logging**: All admin actions are automatically logged
3. **Role-Based Access**: Different permission levels for different admin roles
4. **Audit Trail**: Permanent record of all administrative actions
5. **Protected Routes**: Admin pages require authentication and admin status

## Creating the First Admin

To create the first admin user, you need to manually insert a record into the `admin_users` table:

```sql
-- First, get the user ID from profiles table
SELECT id FROM profiles WHERE email = 'admin@example.com';

-- Then insert into admin_users
INSERT INTO admin_users (id, role, permissions)
VALUES ('user-id-here', 'super_admin', '{"users": true, "groups": true, "payments": true, "messages": true, "faqs": true}');

-- Update the profile to mark as admin
UPDATE profiles SET is_admin = true WHERE id = 'user-id-here';
```

## Accessing the Admin Panel

1. Log in with an admin account
2. Navigate to `/admin/dashboard`
3. Use the sidebar navigation to access different admin sections
4. Switch to user view anytime using the "User View" link

## Best Practices

1. **Regular Monitoring**: Check the dashboard daily for system health
2. **Prompt Responses**: Respond to user messages within 24 hours
3. **Activity Review**: Regularly review activity logs for unusual patterns
4. **Status Management**: Use account suspension before banning users
5. **Documentation**: Document reasons for administrative actions
6. **Security**: Limit super admin access to trusted personnel only

## Routes

### Admin Routes
- `/admin/dashboard` - Admin Dashboard
- `/admin/users` - User Management
- `/admin/groups` - Group Management
- `/admin/messages` - Contact Messages
- `/admin/activity` - Activity Log
- `/admin/settings` - System Settings (Super Admin only)

All admin routes are protected and require admin privileges to access.
