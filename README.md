# Likelemba - Community Savings Platform

A modern web application for managing traditional African rotating savings and credit associations (ROSCA), known as Likelemba. This platform digitizes the communal savings practice, making it easier to manage groups, track contributions, and coordinate payouts.

## Features

### Public Module
- **Home Page**: Beautiful landing page with feature highlights
- **About Page**: Detailed information about Likelemba and the platform
- **Contact Page**: Contact form for inquiries and support
- **Authentication**:
  - User registration with email/password
  - Secure login
  - Password recovery

### User Module (Protected)
- **Dashboard**:
  - Overview of all Likelemba groups
  - Statistics (total groups, active groups, total members)
  - Quick access to group management

- **Likelemba Management**:
  - Create new savings groups
  - **Edit existing groups**: Modify name, amount, frequency, payment method, and status
  - **Delete groups**: Remove groups with confirmation safeguard
  - Set group parameters (members, contribution amount, frequency)
  - **Dynamic end date calculation**: Automatically calculates group end date based on:
    - Number of members (e.g., 5 members)
    - Payment frequency (daily, weekly, or monthly)
    - Start date (selected by user)
    - Formula: End Date = Start Date + (Number of Members × Frequency)
  - Real-time cycle duration preview
  - Automatic calculation of total payouts
  - Service fee calculation ($2 per member)
  - Support for multiple payment methods (Interac, Cash, Bank Transfer)
  - Flexible payment frequencies (daily, weekly, monthly)
  - Group status management (active, completed, paused)

- **Member Management**:
  - Add, edit, and delete members
  - Track member details (name, email, phone, address)
  - Set receipt order for payout rotation
  - Individual contribution amounts
  - **Payment Cycle Details Card**:
    - Total cycle duration display
    - Payment frequency and method
    - Start and end dates
  - **Financial Summary Card**:
    - Amount per member
    - Total per cycle (stored with group)
    - Service fee ($2 per member, stored with group)
    - Payout information per member
  - **Payment Tracking**: Record member payments with one-click
  - **Payment Status**: Visual indicators for paid/unpaid members
  - **Payment History**: View payment dates for each member
  - **Automated Notifications**: All members receive notifications when payments are recorded
  - **Cycle Management**: Track current payment cycle and next payment dates

- **User Profile Management**:
  - Personal profile page with complete account settings
  - Upload and update profile photo (avatars stored in Supabase Storage)
  - Edit personal information (name, phone, address)
  - Profile photo displayed in navigation menu
  - Dropdown menu with quick access to profile settings
  - **Account deletion** with confirmation safeguard
  - Automatic cleanup of user data on account deletion

- **Shareable Group Links** (Maman Likelemba Feature):
  - Generate secure shareable links for each group
  - Share group information with all members via a single link
  - Public view shows:
    - Group details (name, amount, frequency, start date)
    - Complete member list with receipt order
    - Full payment history for each member with dates
    - Payment status (paid/unpaid) for each cycle
  - Links can be regenerated for security
  - View-only access (no authentication required)
  - Perfect for transparency and member coordination

### Multi-Language Support
- **French (Français)** 🇫🇷 - Default language
- **English** 🇬🇧
- **Arabic (العربية)** 🇸🇦 - with RTL support
- **Portuguese (Português)** 🇵🇹
- Language selector in navigation menu
- Persistent language preference across sessions
- Comprehensive translations for all UI elements

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Build Tool**: Vite

## Database Schema

### Tables
- `profiles` - Extended user information with avatar_url, phone, and address
- `likelemba_groups` - Savings group information with cycle tracking
- `group_members` - Members with payment status and history
- `payment_schedules` - Automated payment schedules
- `member_payments` - Individual payment tracking
- `payment_notifications` - Payment notification history
- `group_share_links` - Shareable links for group transparency
- `contact_messages` - Contact form submissions

All tables have Row Level Security (RLS) enabled for data protection.

### Storage Buckets
- `avatars` - User profile photos (public read, authenticated write with user-specific folders)

### Database Functions
- `get_shared_group_data(token)` - Retrieves complete group data including members and payment history via share token (public access)

### Edge Functions
- `send-payment-notification` - Handles payment notifications to all group members

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd likelemba
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## How It Works

1. **Create a Group**: A "Maman Likelemba" (group organizer) creates a savings group with specific parameters
2. **Add Members**: The organizer adds all participating members with their details
3. **Set Order**: Each member is assigned a position in the payout rotation
4. **Record Payments**: The main member records payments as they are received from each participant
5. **Automated Notifications**: When a payment is recorded, all members automatically receive a notification with:
   - Payment date
   - Member name who paid
   - Amount paid
6. **Payouts**: Each cycle, one member (based on receipt order) receives the total collected amount
7. **Rotation**: This continues until all members have received their payout

### Example
- Group of 20 members
- Each contributes $100/month
- Total monthly collection: $2,000
- Each member receives $2,000 once during the cycle
- Service fee: $40 (20 members × $2)

## Security Features

- Email/password authentication
- Row Level Security (RLS) on all database tables
- Users can only access their own groups and data
- Protected routes for authenticated users
- Secure password reset flow

## Design Philosophy

The application features a clean, modern design with:
- Responsive layouts for mobile and desktop
- Emerald/teal color scheme representing growth and trust
- Intuitive navigation
- Clear visual hierarchy
- Accessibility considerations

## Payment Features

The application includes comprehensive payment tracking:

- **One-Click Payment Recording**: Main member can record payments with a single click
- **Visual Payment Status**: Member cards display green background when paid
- **Payment History**: Each member's card shows their last payment date
- **Cycle Tracking**: Dashboard displays current cycle number and next payment date
- **Automatic Notifications**: All group members receive notifications when any payment is recorded
- **Payment Validation**: Prevents duplicate payment recording for the same cycle

## Future Enhancements

- Payment integration (Interac e-Transfer)
- SMS notifications
- Scheduled payment reminders
- Payment history reports and analytics
- Multi-language support
- Mobile app (React Native)
- Automatic cycle advancement when all members have paid

## License

Copyright © 2025 Likelemba. All rights reserved.

## Support

For support, email contact@likelemba.com or visit our contact page.
