#!/bin/bash

# =====================================================
# Scriptony PostgreSQL Migration Deployment Script
# =====================================================

echo "🚀 Starting Scriptony PostgreSQL Migration..."
echo ""

# =====================================================
# Step 1: Backup old server
# =====================================================

echo "📦 Step 1: Backing up old server..."

if [ -f "supabase/functions/server/index.tsx" ]; then
  cp supabase/functions/server/index.tsx supabase/functions/server/index-old-kv-backup.tsx
  echo "✅ Backup created: index-old-kv-backup.tsx"
else
  echo "⚠️  No existing server file found"
fi

echo ""

# =====================================================
# Step 2: Activate PostgreSQL server
# =====================================================

echo "🔄 Step 2: Activating PostgreSQL server..."

cp supabase/functions/server/index-postgres.tsx supabase/functions/server/index.tsx

echo "✅ PostgreSQL server activated"
echo ""

# =====================================================
# Step 3: Reminder for SQL migration
# =====================================================

echo "📋 Step 3: Database Setup Required"
echo ""
echo "⚠️  IMPORTANT: You need to run the SQL schema in Supabase Dashboard!"
echo ""
echo "Instructions:"
echo "1. Open Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Go to SQL Editor"
echo "4. Copy the contents of: supabase/migrations/001_initial_schema.sql"
echo "5. Paste and click 'Run'"
echo ""
echo "Press ENTER when you've completed the SQL migration..."
read

# =====================================================
# Step 4: Deploy to Supabase (optional)
# =====================================================

echo ""
echo "🚀 Step 4: Deploy to Supabase"
echo ""
echo "Do you want to deploy now? (requires Supabase CLI)"
echo "Type 'yes' to deploy, or press ENTER to skip"
read -r response

if [[ "$response" == "yes" ]]; then
  echo ""
  echo "Deploying Edge Function..."
  
  if command -v supabase &> /dev/null; then
    supabase functions deploy make-server-3b52693b
    echo "✅ Deployed successfully!"
  else
    echo "❌ Supabase CLI not found. Install it from:"
    echo "   https://supabase.com/docs/guides/cli"
  fi
else
  echo "⏭️  Skipping deployment"
  echo ""
  echo "To deploy manually later, run:"
  echo "  supabase functions deploy make-server-3b52693b"
fi

echo ""

# =====================================================
# Step 5: Summary
# =====================================================

echo "✅ Migration Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. ✅ Server files updated"
echo "2. ⚠️  Run SQL schema in Supabase Dashboard (if not done)"
echo "3. ⚠️  Deploy Edge Function (if not done)"
echo "4. 🧪 Run migration in browser:"
echo ""
echo "   // In Browser Console:"
echo "   const token = localStorage.getItem('supabase.auth.token');"
echo "   fetch('YOUR_SUPABASE_URL/functions/v1/make-server-3b52693b/migrate', {"
echo "     method: 'POST',"
echo "     headers: {"
echo "       'Authorization': \`Bearer \${token}\`,"
echo "       'Content-Type': 'application/json'"
echo "     }"
echo "   }).then(r => r.json()).then(console.log);"
echo ""
echo "5. 🎉 Test your app!"
echo ""
echo "Full guide: See MIGRATION_GUIDE.md"
echo ""
