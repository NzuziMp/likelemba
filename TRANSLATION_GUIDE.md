# Translation Implementation Guide

## Overview
The Likelemba application now supports 4 languages:
- **French (fr) - Default Language** 🇫🇷
- English (en) 🇬🇧
- Arabic (ar) - with RTL support 🇸🇦
- Portuguese (pt) 🇵🇹

## Current Implementation Status

### ✅ Fully Translated
1. **Navigation Menus** (PublicLayout & UserLayout)
   - All menu items
   - Footer text
   - Language selector component

2. **Home Page** (`src/pages/Home.tsx`)
   - All headings, descriptions, and buttons
   - Feature cards
   - How it works section
   - Call-to-action sections

### 📝 Translation Keys Available (Not Yet Applied to Pages)

The following pages have translation keys defined in `LanguageContext.tsx` but need to be updated to use them:

#### About Page (`src/pages/About.tsx`)
Translation keys available:
- `about.title`, `about.subtitle`
- `about.whatIs`, `about.whatIsDesc1`, `about.whatIsDesc2`, `about.whatIsDesc3`
- `about.mission`, `about.missionDesc`
- `about.objectives`, `about.objective1-4`
- `about.values`, `about.communityFirst`, `about.transparency`, etc.

#### Contact Page (`src/pages/Contact.tsx`)
Translation keys available:
- `contact.title`, `contact.subtitle`
- `contact.fullName`, `contact.emailAddress`, `contact.phoneNumber`
- `contact.message`, `contact.sendButton`
- `contact.successMessage`

#### Login Page (`src/pages/Login.tsx`)
Translation keys available:
- `login.title`, `login.subtitle`
- `login.email`, `login.password`
- `login.signIn`, `login.forgotPassword`
- `login.noAccount`, `login.registerHere`

#### Register Page (`src/pages/Register.tsx`)
Translation keys available:
- `register.title`, `register.subtitle`
- `register.fullName`, `register.email`, `register.password`
- `register.createAccount`, `register.successMessage`

#### Forgot Password Page (`src/pages/ForgotPassword.tsx`)
Translation keys available:
- `forgotPassword.title`, `forgotPassword.subtitle`
- `forgotPassword.sendLink`, `forgotPassword.successMessage`

#### Dashboard Page (`src/pages/Dashboard.tsx`)
Translation keys available:
- `dashboard.welcome`, `dashboard.totalGroups`, `dashboard.activeGroups`
- `dashboard.yourGroups`, `dashboard.createGroup`
- `dashboard.noGroups`, `dashboard.noGroupsDesc`

#### Likelemba Page (`src/pages/Likelemba.tsx`)
Translation keys available:
- `likelemba.title`, `likelemba.subtitle`
- `likelemba.groupName`, `likelemba.numberOfMembers`
- `likelemba.paymentFrequency`, `likelemba.daily`, `likelemba.weekly`, `likelemba.monthly`
- `likelemba.summary`, `likelemba.createButton`

#### Members Page (`src/pages/Members.tsx`)
Translation keys available:
- `members.title`, `members.addMember`, `members.noMembers`
- `members.fullName`, `members.email`, `members.phone`
- `members.recordPayment`, `members.paid`
- `members.cycle`, `members.nextPayment`

## How to Apply Translations to a Page

### Step 1: Import the useLanguage hook
```typescript
import { useLanguage } from '../contexts/LanguageContext';
```

### Step 2: Use the hook in your component
```typescript
export const YourPage = () => {
  const { t } = useLanguage();
  // ... rest of component
};
```

### Step 3: Replace hardcoded text with translation keys
```typescript
// Before:
<h1>Welcome to Likelemba</h1>

// After:
<h1>{t('page.welcomeTitle')}</h1>
```

## Example: Updating About Page

```typescript
// Add import
import { useLanguage } from '../contexts/LanguageContext';

export const About = () => {
  const { t } = useLanguage();  // Add this line

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1>{t('about.title')}</h1>  {/* Replace hardcoded text */}
            <p>{t('about.subtitle')}</p>
          </div>
          {/* Continue replacing all text... */}
        </div>
      </div>
    </PublicLayout>
  );
};
```

## Translation Key Structure

All translation keys follow this pattern:
- `section.element` - e.g., `nav.home`, `login.title`
- Keys are organized by page/section for easy maintenance
- Common elements use `common.` prefix (e.g., `common.loading`)

## RTL Support

Arabic language automatically enables RTL (Right-to-Left) text direction via:
```typescript
document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
```

## Language Persistence

Language selection is saved in localStorage and persists across sessions:
```typescript
localStorage.setItem('language', selectedLanguage);
```

## Testing Translations

1. Click the globe icon in the navigation bar
2. Select a language from the dropdown
3. Verify all text updates immediately
4. Check that the selection persists on page reload

## Next Steps

To complete full translation implementation:
1. Update each remaining page following the pattern above
2. Replace all hardcoded strings with `t('translation.key')` calls
3. Test each page in all 4 languages
4. Verify RTL layout works correctly for Arabic

## Adding New Translation Keys

To add new translation keys:
1. Open `src/contexts/LanguageContext.tsx`
2. Add the key to all 4 language objects (en, fr, ar, pt)
3. Use the new key in your component with `t('your.new.key')`
