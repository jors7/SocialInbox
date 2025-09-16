#!/bin/bash

# Fix all @/lib/supabase imports in the web app

cd apps/web

# Fix imports in all TypeScript files
echo "Fixing imports..."

# Replace @/lib/supabase imports with relative imports
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" | while read file; do
  # Count the depth of the file
  depth=$(echo "$file" | tr -cd '/' | wc -c)
  
  # Build the relative path based on depth
  if [ $depth -eq 1 ]; then
    # Root level files
    sed -i '' "s|from '@/lib/supabase/|from './lib/supabase/|g" "$file"
    sed -i '' "s|from '@/components/|from './components/|g" "$file"
    sed -i '' "s|from '@/hooks/|from './hooks/|g" "$file"
  elif [ $depth -eq 2 ]; then
    # One level deep (e.g., app/page.tsx)
    sed -i '' "s|from '@/lib/supabase/|from '../lib/supabase/|g" "$file"
    sed -i '' "s|from '@/components/|from '../components/|g" "$file"
    sed -i '' "s|from '@/hooks/|from '../hooks/|g" "$file"
  elif [ $depth -eq 3 ]; then
    # Two levels deep (e.g., app/auth/login.tsx)
    sed -i '' "s|from '@/lib/supabase/|from '../../lib/supabase/|g" "$file"
    sed -i '' "s|from '@/components/|from '../../components/|g" "$file"
    sed -i '' "s|from '@/hooks/|from '../../hooks/|g" "$file"
  elif [ $depth -eq 4 ]; then
    # Three levels deep (e.g., app/dashboard/flows/page.tsx)
    sed -i '' "s|from '@/lib/supabase/|from '../../../lib/supabase/|g" "$file"
    sed -i '' "s|from '@/components/|from '../../../components/|g" "$file"
    sed -i '' "s|from '@/hooks/|from '../../../hooks/|g" "$file"
  elif [ $depth -eq 5 ]; then
    # Four levels deep
    sed -i '' "s|from '@/lib/supabase/|from '../../../../lib/supabase/|g" "$file"
    sed -i '' "s|from '@/components/|from '../../../../components/|g" "$file"
    sed -i '' "s|from '@/hooks/|from '../../../../hooks/|g" "$file"
  fi
done

echo "✅ Import paths fixed!"
echo ""
echo "The app should now compile successfully."
echo "Note: This uses relative imports instead of the @ alias."