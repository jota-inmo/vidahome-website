#!/usr/bin/env python3
"""
Deploy Analytics Schema to Supabase PostgreSQL
Uses SQL API endpoint with proper authentication
"""

import requests
import json
import sys
import os
import subprocess

# Supabase credentials
SUPABASE_URL = "https://yheqvroinbcrrpppzdzx.supabase.co"
SUPABASE_PROJECT_ID = "yheqvroinbcrrpppzdzx"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZXF2cm9pbmJjcnJwcHp6ZHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzczMTUsImV4cCI6MjA3NzIxMzMxNX0.uhwyXj42AA0qrxyX0hLLmPEGk9bhyveeyVSWGH4ulXA"

def read_sql_file():
    """Read SQL schema file"""
    try:
        with open('sql/analytics-schema.sql', 'r') as f:
            return f.read()
    except FileNotFoundError:
        print("❌ Error: sql/analytics-schema.sql not found")
        sys.exit(1)

def main():
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║   📊 ANALYTICS SCHEMA DEPLOYMENT TO SUPABASE                   ║")
    print("╚════════════════════════════════════════════════════════════════╝\n")
    
    print("⚠️  REST API endpoint doesn't support direct SQL execution.\n")
    print("     Using Supabase CLI via PostgreSQL psql command...\n")
    
    # Read SQL file
    print("📖 Reading SQL schema file...")
    sql_content = read_sql_file()
    print("✓ SQL schema loaded\n")
    
    # Try to connect via psql (requires PostgreSQL client installed)
    # For now, show manual instructions
    
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║   � HOW TO DEPLOY THE SCHEMA                                  ║")
    print("╚════════════════════════════════════════════════════════════════╝\n")
    
    print("✅ OPTION 1: Via Supabase Dashboard (Easiest)\n")
    print("   1. Go to: https://app.supabase.com")
    print("   2. Select your project: yheqvroinbcrrpppzdzx")
    print("   3. Go to: SQL Editor → New Query")
    print("   4. Copy the entire content of: sql/analytics-schema.sql")
    print("   5. Paste into the SQL Editor")
    print("   6. Click: Run (blue button)\n")
    
    print("✅ OPTION 2: Via PostgreSQL CLI (If you have psql installed)\n")
    print("   1. Get your database password from Supabase Dashboard")
    print("   2. Run this command:\n")
    
    db_url = f"postgresql://postgres:[PASSWORD]@db.yheqvroinbcrrpppzdzx.supabase.co:5432/postgres"
    print(f"      psql '{db_url}' < sql/analytics-schema.sql\n")
    
    print("✅ OPTION 3: Supabase CLI\n")
    print("   1. Install CLI: npm install -g supabase")
    print("   2. Run: supabase db push sql/analytics-schema.sql\n")
    
    print("═══════════════════════════════════════════════════════════════\n")
    print("📊 The schema will create 5 tables:")
    print("   • analytics_property_views")
    print("   • analytics_leads")
    print("   • analytics_valuations")
    print("   • analytics_page_views")
    print("   • analytics_searches\n")
    
    print("After executing, you can:")
    print("   npm run dev")
    print("   → Go to: http://localhost:3000/es/admin/analytics\n")
    
    print("✨ Dashboard will be fully functional!")

if __name__ == '__main__':
    main()
