#!/bin/bash

# Script to add dark mode classes to all page files

FILES=(
  "src/pages/Contact.tsx"
  "src/pages/Dashboard.tsx"
  "src/pages/FAQ.tsx"
  "src/pages/ForgotPassword.tsx"
  "src/pages/Home.tsx"
  "src/pages/Likelemba.tsx"
  "src/pages/Login.tsx"
  "src/pages/Members.tsx"
  "src/pages/PaymentTracking.tsx"
  "src/pages/PayoutHistory.tsx"
  "src/pages/Profile.tsx"
  "src/pages/Register.tsx"
  "src/pages/SharedGroup.tsx"
  "src/pages/admin/ActivityLog.tsx"
  "src/pages/admin/AdminDashboard.tsx"
  "src/pages/admin/GroupManagement.tsx"
  "src/pages/admin/MessageManagement.tsx"
  "src/pages/admin/UserManagement.tsx"
)

for file in "${FILES[@]}"; do
  echo "Processing $file..."

  # bg-white -> bg-white dark:bg-slate-800
  sed -i 's/className="\([^"]*\)bg-white\([^"]*\)"/className="\1bg-white dark:bg-slate-800\2"/g' "$file"

  # bg-gray-50 -> bg-gray-50 dark:bg-slate-900
  sed -i 's/className="\([^"]*\)bg-gray-50\([^"]*\)"/className="\1bg-gray-50 dark:bg-slate-900\2"/g' "$file"

  # bg-slate-50 -> bg-slate-50 dark:bg-slate-800
  sed -i 's/className="\([^"]*\)bg-slate-50\([^"]*\)"/className="\1bg-slate-50 dark:bg-slate-800\2"/g' "$file"

  # text-gray-900 -> text-gray-900 dark:text-white
  sed -i 's/className="\([^"]*\)text-gray-900\([^"]*\)"/className="\1text-gray-900 dark:text-white\2"/g' "$file"

  # text-slate-900 -> text-slate-900 dark:text-white
  sed -i 's/className="\([^"]*\)text-slate-900\([^"]*\)"/className="\1text-slate-900 dark:text-white\2"/g' "$file"

  # text-gray-600 -> text-gray-600 dark:text-gray-300
  sed -i 's/className="\([^"]*\)text-gray-600\([^"]*\)"/className="\1text-gray-600 dark:text-gray-300\2"/g' "$file"

  # text-slate-600 -> text-slate-600 dark:text-slate-300
  sed -i 's/className="\([^"]*\)text-slate-600\([^"]*\)"/className="\1text-slate-600 dark:text-slate-300\2"/g' "$file"

  # text-gray-500 -> text-gray-500 dark:text-gray-400
  sed -i 's/className="\([^"]*\)text-gray-500\([^"]*\)"/className="\1text-gray-500 dark:text-gray-400\2"/g' "$file"

  # text-slate-500 -> text-slate-500 dark:text-slate-400
  sed -i 's/className="\([^"]*\)text-slate-500\([^"]*\)"/className="\1text-slate-500 dark:text-slate-400\2"/g' "$file"

  # text-gray-700 -> text-gray-700 dark:text-gray-200
  sed -i 's/className="\([^"]*\)text-gray-700\([^"]*\)"/className="\1text-gray-700 dark:text-gray-200\2"/g' "$file"

  # text-slate-700 -> text-slate-700 dark:text-slate-200
  sed -i 's/className="\([^"]*\)text-slate-700\([^"]*\)"/className="\1text-slate-700 dark:text-slate-200\2"/g' "$file"

  # border-gray-200 -> border-gray-200 dark:border-slate-700
  sed -i 's/className="\([^"]*\)border-gray-200\([^"]*\)"/className="\1border-gray-200 dark:border-slate-700\2"/g' "$file"

  # border-slate-200 -> border-slate-200 dark:border-slate-700
  sed -i 's/className="\([^"]*\)border-slate-200\([^"]*\)"/className="\1border-slate-200 dark:border-slate-700\2"/g' "$file"

  # border-gray-300 -> border-gray-300 dark:border-slate-600
  sed -i 's/className="\([^"]*\)border-gray-300\([^"]*\)"/className="\1border-gray-300 dark:border-slate-600\2"/g' "$file"

  # border-slate-300 -> border-slate-300 dark:border-slate-600
  sed -i 's/className="\([^"]*\)border-slate-300\([^"]*\)"/className="\1border-slate-300 dark:border-slate-600\2"/g' "$file"

  # Remove duplicate dark: classes that may have been added
  sed -i 's/dark:bg-slate-800 dark:bg-slate-800/dark:bg-slate-800/g' "$file"
  sed -i 's/dark:bg-slate-900 dark:bg-slate-900/dark:bg-slate-900/g' "$file"
  sed -i 's/dark:text-white dark:text-white/dark:text-white/g' "$file"
  sed -i 's/dark:text-slate-300 dark:text-slate-300/dark:text-slate-300/g' "$file"
  sed -i 's/dark:text-gray-300 dark:text-gray-300/dark:text-gray-300/g' "$file"
  sed -i 's/dark:text-slate-400 dark:text-slate-400/dark:text-slate-400/g' "$file"
  sed -i 's/dark:text-gray-400 dark:text-gray-400/dark:text-gray-400/g' "$file"
  sed -i 's/dark:text-slate-200 dark:text-slate-200/dark:text-slate-200/g' "$file"
  sed -i 's/dark:text-gray-200 dark:text-gray-200/dark:text-gray-200/g' "$file"
  sed -i 's/dark:border-slate-700 dark:border-slate-700/dark:border-slate-700/g' "$file"
  sed -i 's/dark:border-slate-600 dark:border-slate-600/dark:border-slate-600/g' "$file"
done

echo "Dark mode update complete!"
