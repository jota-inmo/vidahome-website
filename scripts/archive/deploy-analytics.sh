#!/bin/bash
# Deploy Analytics Schema using Supabase CLI

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   📊 ANALYTICS SCHEMA DEPLOYMENT VIA SUPABASE CLI              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo "   Install it first: npm install -g supabase"
    echo ""
    echo "Or use OPTION 1 instead (manual via dashboard)"
    exit 1
fi

echo "✓ Supabase CLI found"
echo ""

# Try to read the SQL file
if [ ! -f "sql/analytics-schema.sql" ]; then
    echo "❌ SQL file not found: sql/analytics-schema.sql"
    exit 1
fi

echo "📖 Reading SQL schema file..."
echo "✓ SQL file loaded"
echo ""

# Push to Supabase
echo "🚀 Deploying schema to Supabase..."
echo ""

psql "postgresql://postgres:YOUR_PASSWORD@db.yheqvroinbcrrpppzdzx.supabase.co:5432/postgres" < sql/analytics-schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║   ✅ DEPLOYMENT SUCCESSFUL                                     ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📊 Tables Created:"
    echo "   ✓ analytics_property_views"
    echo "   ✓ analytics_leads"
    echo "   ✓ analytics_valuations"
    echo "   ✓ analytics_page_views"
    echo "   ✓ analytics_searches"
    echo ""
else
    echo ""
    echo "❌ Deployment failed"
    echo "   Use OPTION 1 instead (manual via Supabase Dashboard)"
    exit 1
fi
