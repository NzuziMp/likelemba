# Shareable Group Links Feature

## Overview
Maman Likelemba (group administrators) can now generate and share secure links that display complete group information to all members. This promotes transparency and keeps everyone informed about payment status.

## How It Works

### For Maman Likelemba (Group Administrator)

1. **Access Share Feature**
   - Navigate to the Dashboard
   - Find your group card
   - Click the "Partager" (Share) button

2. **Generate Share Link**
   - Click "Générer un lien de partage" (Generate share link)
   - A unique, secure link is created instantly
   - The link format: `https://yoursite.com/shared/[unique-token]`

3. **Share the Link**
   - Copy the link using the "Copier le lien" button
   - Share via WhatsApp, SMS, email, or any messaging platform
   - Click the external link icon to preview the shared page

4. **Manage Links**
   - Only one active link per group at a time
   - Generate a new link to replace the old one (for security)
   - Old links are automatically deactivated

### For Group Members (Recipients)

1. **Access Shared Information**
   - Click the shared link (no login required)
   - View complete group details:
     - Group name
     - Amount per member
     - Payment frequency
     - Start date
     - Total number of members

2. **Member Information**
   - See all group members in receipt order
   - Each member shows:
     - Full name
     - Email address
     - Phone number
     - Receipt position (#1, #2, etc.)

3. **Payment History**
   - Complete payment history for each member
   - Each payment displays:
     - Cycle number
     - Payment date
     - Amount paid
     - Payment status (paid with green checkmark)
   - Unpaid members show "Aucun paiement enregistré"

## Security Features

- **Unique Tokens**: Each link has a cryptographically secure random token
- **View-Only Access**: Recipients can only view, not modify data
- **Link Regeneration**: Administrators can create new links anytime
- **Database RLS**: Row-level security ensures only authorized access
- **No Authentication Required**: Members don't need accounts to view

## Technical Implementation

### Database Schema

**Table: `group_share_links`**
```sql
- id (uuid, primary key)
- group_id (uuid, references likelemba_groups)
- share_token (text, unique)
- created_by (uuid, references profiles)
- created_at (timestamptz)
- expires_at (timestamptz, nullable)
- is_active (boolean)
```

### Database Function

**Function: `get_shared_group_data(token text)`**
- Returns complete group data for a valid token
- Includes all members and their payment histories
- Joins across multiple tables
- Security definer function with proper access control

### Frontend Components

1. **ShareGroupLink Component** (`src/components/ShareGroupLink.tsx`)
   - Modal interface for link generation
   - Copy to clipboard functionality
   - Link preview and management

2. **SharedGroup Page** (`src/pages/SharedGroup.tsx`)
   - Public route at `/shared/:token`
   - Displays formatted group information
   - Responsive design for mobile viewing
   - Multi-language support

### Routes

```typescript
<Route path="/shared/:token" element={<SharedGroup />} />
```

## Use Cases

### 1. Member Transparency
Share the link with all group members so everyone can:
- See who has paid and who hasn't
- Know their position in the receipt order
- Track the group's progress

### 2. New Member Onboarding
Send the link to new members to:
- Show them how the group operates
- Display existing payment history
- Build trust and transparency

### 3. Payment Reminders
When requesting payments:
- Share the link showing who has already paid
- Encourage timely payments through peer visibility
- Reduce need for individual follow-ups

### 4. Group Updates
Use as a reference point:
- During group meetings
- When discussing payment schedules
- For resolving payment disputes

## Best Practices

### For Administrators

1. **Share Responsibly**
   - Only share with actual group members
   - Use secure messaging platforms
   - Regenerate links if compromised

2. **Keep Information Updated**
   - Record payments promptly
   - Ensure member information is accurate
   - Update the link after member changes

3. **Communication**
   - Explain what the link shows when sharing
   - Remind members it's view-only
   - Encourage members to save the link

### For Members

1. **Save the Link**
   - Bookmark or save in notes app
   - Check regularly for updates
   - Don't share outside the group

2. **Verify Your Information**
   - Confirm your payment status is correct
   - Check your receipt position
   - Report any discrepancies to Maman

## Troubleshooting

### Link Not Working
- Link may have been regenerated (ask Maman for new link)
- Check for complete URL (no truncation)
- Ensure stable internet connection

### Information Not Showing
- Data loads from server (may take a moment)
- Refresh the page
- Check if link is still active

### Wrong Information Displayed
- Contact Maman Likelemba to correct data
- Link shows real-time database information
- Updates appear immediately after Maman makes changes

## Future Enhancements

Potential improvements for this feature:
- Link expiration dates for added security
- View analytics (who accessed the link)
- Download payment history as PDF
- Email/SMS link distribution from app
- Password protection for sensitive groups
- Custom link names/URLs

## Privacy Considerations

**What's Shared:**
- Group name and details
- Member names, emails, phones
- Payment history and dates
- Receipt order

**What's NOT Shared:**
- Member addresses
- Bank account details
- Personal notes
- Private messages
- Other group information

## Support

For questions or issues:
- Contact through the Contact page
- Email: support@likelemba.com
- Include your group name and issue description
