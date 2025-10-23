#!/bin/bash

# ============================================================================
# SCRIPTONY QUICK DEPLOY SCRIPT
# ============================================================================
#
# Deployt die Supabase Edge Function "make-server-3b52693b" automatisch
#
# USAGE:
#   chmod +x quick-deploy.sh
#   ./quick-deploy.sh
#
# ============================================================================

set -e  # Exit on error

echo ""
echo "🚀 SCRIPTONY QUICK DEPLOY"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project Config
PROJECT_REF="ctkouztastyirjywiduc"
FUNCTION_NAME="make-server-3b52693b"
SUPABASE_URL="https://ctkouztastyirjywiduc.supabase.co"

# ============================================================================
# STEP 1: Check if Supabase CLI is installed
# ============================================================================
echo "📦 Step 1: Checking Supabase CLI..."

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo ""
    echo "Please install it first:"
    echo ""
    echo "macOS/Linux:"
    echo "  brew install supabase/tap/supabase"
    echo ""
    echo "Windows:"
    echo "  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    echo "  scoop install supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI installed${NC}"
echo ""

# ============================================================================
# STEP 2: Login to Supabase
# ============================================================================
echo "🔐 Step 2: Login to Supabase..."

if supabase projects list &> /dev/null; then
    echo -e "${GREEN}✅ Already logged in${NC}"
else
    echo -e "${YELLOW}⚠️  Not logged in yet${NC}"
    echo ""
    supabase login
fi

echo ""

# ============================================================================
# STEP 3: Link Project
# ============================================================================
echo "🔗 Step 3: Linking to project..."

# Check if already linked
if [ -f ".supabase/config.toml" ]; then
    echo -e "${GREEN}✅ Project already linked${NC}"
else
    echo -e "${YELLOW}⚠️  Linking to project ${PROJECT_REF}...${NC}"
    supabase link --project-ref "$PROJECT_REF"
fi

echo ""

# ============================================================================
# STEP 4: Prepare Function Files
# ============================================================================
echo "📝 Step 4: Preparing function files..."

# Create function directory if it doesn't exist
mkdir -p "supabase/functions/$FUNCTION_NAME"

# Check if server files exist
if [ ! -f "supabase/functions/server/index.tsx" ]; then
    echo -e "${RED}❌ Server files not found at supabase/functions/server/index.tsx${NC}"
    echo ""
    echo "Please make sure you're in the project root directory."
    exit 1
fi

# Copy main index file (rename .tsx to .ts)
echo "  → Copying index.tsx..."
sed 's/\.tsx"/\.ts"/g' supabase/functions/server/index.tsx > "supabase/functions/$FUNCTION_NAME/index.ts"

# Copy all route files
echo "  → Copying route files..."
for file in supabase/functions/server/routes-*.tsx; do
    if [ -f "$file" ]; then
        basename=$(basename "$file" .tsx)
        sed 's/\.tsx"/\.ts"/g' "$file" > "supabase/functions/$FUNCTION_NAME/${basename}.ts"
    fi
done

# Copy all tool files
echo "  → Copying tool files..."
for file in supabase/functions/server/tools-*.tsx; do
    if [ -f "$file" ]; then
        basename=$(basename "$file" .tsx)
        sed 's/\.tsx"/\.ts"/g' "$file" > "supabase/functions/$FUNCTION_NAME/${basename}.ts"
    fi
done

# Copy other necessary files
echo "  → Copying utility files..."
for file in supabase/functions/server/*.tsx; do
    basename=$(basename "$file")
    # Skip index.tsx (already copied)
    if [ "$basename" != "index.tsx" ] && [ "$basename" != "routes-"* ] && [ "$basename" != "tools-"* ]; then
        basename_no_ext=$(basename "$file" .tsx)
        sed 's/\.tsx"/\.ts"/g' "$file" > "supabase/functions/$FUNCTION_NAME/${basename_no_ext}.ts"
    fi
done

echo -e "${GREEN}✅ Function files prepared${NC}"
echo ""

# ============================================================================
# STEP 5: Deploy Function
# ============================================================================
echo "🚀 Step 5: Deploying function..."

supabase functions deploy "$FUNCTION_NAME" --no-verify-jwt

echo -e "${GREEN}✅ Function deployed${NC}"
echo ""

# ============================================================================
# STEP 6: Set Environment Variables
# ============================================================================
echo "🔧 Step 6: Setting environment variables..."

echo -e "${YELLOW}⚠️  You need to set these secrets manually:${NC}"
echo ""
echo "Run these commands:"
echo ""
echo -e "${BLUE}supabase secrets set SUPABASE_URL=$SUPABASE_URL${NC}"
echo -e "${BLUE}supabase secrets set SUPABASE_ANON_KEY=<YOUR_ANON_KEY>${NC}"
echo -e "${BLUE}supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>${NC}"
echo ""
echo "Find your keys at:"
echo "https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo ""

read -p "Press Enter when you've set the secrets..."

echo ""

# ============================================================================
# STEP 7: Test Health Check
# ============================================================================
echo "🧪 Step 7: Testing health check..."

HEALTH_URL="$SUPABASE_URL/functions/v1/$FUNCTION_NAME/health"

echo "Testing: $HEALTH_URL"
echo ""

# Wait a bit for function to be ready
echo "Waiting 5 seconds for function to initialize..."
sleep 5

# Test health endpoint
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$HTTP_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    echo ""
    echo "Response:"
    curl -s "$HEALTH_URL" | jq .
    echo ""
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_STATUS)${NC}"
    echo ""
    echo "Possible issues:"
    echo "  1. Environment variables not set"
    echo "  2. Function still initializing (wait 30s)"
    echo "  3. Check function logs in Supabase Dashboard"
    echo ""
fi

# ============================================================================
# DONE
# ============================================================================
echo ""
echo "================================"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "  1. Reload your app (F5)"
echo "  2. Check for the green banner: '✅ Server ist online und bereit!'"
echo "  3. If offline, check function logs:"
echo "     supabase functions logs $FUNCTION_NAME --tail"
echo ""
echo "Function URL:"
echo "  $SUPABASE_URL/functions/v1/$FUNCTION_NAME"
echo ""
echo "Dashboard:"
echo "  https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo ""
echo "Happy coding! 🚀"
echo ""
