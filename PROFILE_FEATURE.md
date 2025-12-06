# User Profile Management Feature

## Overview
Users can now manage their personal profile, upload a profile photo, update their information, and delete their account if needed. The profile is accessible through a dropdown menu in the navigation bar.

## Features

### 1. Profile Menu in Navigation
- **Avatar Display**: User's profile photo appears as a circular avatar in the top-right navigation
- **Default Avatar**: Users without a photo see a gradient circle with a user icon
- **Dropdown Menu**: Click the avatar to access:
  - User's name and email
  - "Mon Profil" (My Profile) link
  - Logout button

### 2. Profile Settings Page (`/profile`)

#### Personal Information
Users can view and edit:
- **Full Name**: Required field
- **Email**: Read-only (cannot be changed)
- **Phone**: Optional contact number
- **Address**: Optional full address

#### Profile Photo Management
- **Upload Photo**: Click the camera icon on the avatar
- **Requirements**:
  - Image files only (JPG, PNG, etc.)
  - Maximum file size: 2MB
  - Auto-replaces old photo on new upload
- **Storage**: Photos stored in Supabase Storage (`avatars` bucket)
- **Access**: Organized by user ID for security
- **Display**: Photo appears immediately in navigation after upload

#### Account Deletion
- **Danger Zone**: Clearly marked red section at bottom of profile page
- **Confirmation Required**: User must type "DELETE" to confirm
- **Warning Modal**: Shows consequences before deletion
- **Process**:
  1. User clicks "Supprimer mon compte"
  2. Modal appears with warning
  3. User types "DELETE" to confirm
  4. Account and all data permanently deleted
  5. User logged out and redirected to home page
- **Data Cleanup**: All user-related data removed from database

## Technical Implementation

### Database Changes

#### `profiles` Table Updates
```sql
- avatar_url (text) - URL to user's profile photo in storage
- phone (text) - User's phone number
- address (text) - User's address
```

#### Storage Bucket
```sql
- Bucket: 'avatars'
- Public: true (for viewing)
- Structure: {user_id}/avatar.{ext}
```

#### RLS Policies for Storage
- Users can upload their own avatar
- Users can update their own avatar
- Users can delete their own avatar
- Anyone can view avatars (public read)

### Frontend Components

#### Profile Page (`src/pages/Profile.tsx`)
- Form for editing user information
- Photo upload with preview
- Delete account modal with confirmation
- Real-time photo updates

#### UserLayout Navigation (`src/components/Layout/UserLayout.tsx`)
- Profile dropdown menu
- Avatar display with image or default icon
- Click-outside detection to close menu
- Smooth transitions

### State Management

#### AuthContext Updates
```typescript
interface Profile {
  id: string;
  full_name: string;
  email?: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  is_maman_likelemba: boolean;
}

- Added setProfile to context
- Profile updates propagate throughout app
```

### Photo Upload Process

1. **File Selection**: User clicks camera icon, selects image
2. **Validation**: Check file type and size
3. **Upload**: Upload to Supabase Storage with user ID path
4. **Old Photo Cleanup**: Remove previous avatar if exists
5. **URL Generation**: Get public URL for uploaded image
6. **Database Update**: Save avatar URL to profiles table
7. **UI Update**: Avatar immediately appears in navigation

### Account Deletion Process

1. **Safety Check**: Requires exact text "DELETE"
2. **Database Cleanup**: (Future: RPC function to clean all user data)
3. **Sign Out**: User session terminated
4. **Navigation**: Redirect to home page
5. **Confirmation**: Success message displayed

## User Experience

### Profile Access Flow
```
Navigation Bar → Avatar Click → Dropdown Menu → Mon Profil → Profile Page
```

### Photo Upload Flow
```
Profile Page → Camera Icon → File Picker → Image Selected → Upload → Success
```

### Account Deletion Flow
```
Profile Page → Danger Zone → Delete Button → Modal → Type DELETE → Confirm → Account Deleted
```

## Security Considerations

### Photo Upload Security
- **File Type Validation**: Only image files accepted
- **Size Limit**: 2MB maximum to prevent abuse
- **User-Specific Storage**: Each user can only access their own folder
- **RLS Policies**: Database-level security for storage access

### Account Deletion Security
- **Confirmation Required**: Prevents accidental deletion
- **Exact Text Match**: Must type "DELETE" (case-sensitive)
- **Warning Modal**: Clear information about consequences
- **Immediate Logout**: Session terminated after deletion

### Data Privacy
- **Profile Photos**: Public read access (anyone can view if they have URL)
- **Personal Info**: Only user can edit their own profile
- **Email**: Cannot be changed (tied to authentication)
- **Phone/Address**: Optional fields, user controls visibility

## Best Practices

### For Users

1. **Profile Photo**:
   - Use a clear, recognizable photo
   - Keep file size reasonable (under 1MB recommended)
   - Update photo if you change your appearance

2. **Personal Information**:
   - Keep your name current for group management
   - Add phone number for better communication
   - Address helps with payment coordination

3. **Account Deletion**:
   - Export any important data first
   - Understand it's permanent and irreversible
   - Contact all group members if you're Maman

### For Developers

1. **Photo Storage**:
   - Clean up old photos on new uploads
   - Implement image optimization/resizing
   - Monitor storage usage

2. **Account Deletion**:
   - Implement cascade deletion for all user data
   - Consider "soft delete" option for recovery period
   - Log deletions for audit purposes

3. **Profile Updates**:
   - Validate all input fields
   - Handle upload errors gracefully
   - Provide clear user feedback

## Future Enhancements

Potential improvements:
- Image cropping/editing before upload
- Multiple photo support (gallery)
- Two-factor authentication
- Password change from profile page
- Email change with verification
- Account export (GDPR compliance)
- Account deactivation (soft delete)
- Activity log (login history)
- Privacy settings (profile visibility)
- Profile completeness indicator

## Translation Support

Profile page uses French by default but supports all 4 languages:
- French: Mon Profil, Enregistrer, Supprimer mon compte
- English: My Profile, Save, Delete my account
- Arabic: الملف الشخصي (with RTL support)
- Portuguese: Meu Perfil, Salvar, Excluir minha conta

## Error Handling

### Photo Upload Errors
- Invalid file type: "Veuillez sélectionner une image"
- File too large: "L'image doit faire moins de 2MB"
- Upload failure: "Erreur lors du téléchargement de la photo"

### Profile Update Errors
- Network error: "Erreur lors de la mise à jour du profil"
- Validation error: Field-specific messages

### Account Deletion Errors
- Wrong confirmation: "Veuillez taper DELETE pour confirmer"
- Deletion failure: "Erreur lors de la suppression du compte"

## Support

For issues with profile management:
- Check internet connection
- Verify image file format and size
- Clear browser cache
- Contact support through Contact page
