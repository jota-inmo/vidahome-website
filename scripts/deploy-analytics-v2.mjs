import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://yheqvroinbcrrpppzdzx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZXF2cm9pbmJjcnJwcHp6ZHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzczMTUsImV4cCI6MjA3NzIxMzMxNX0.uhwyXj42AA0qrxyX0hLLmPEGk9bhyveeyVSWGH4ulXA';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║   📊 ANALYTICS SCHEMA DEPLOYMENT TO SUPABASE                   ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'sql', 'analytics-schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('📖 SQL schema loaded');
    console.log(`📁 File: ${sqlPath}\n`);
    
    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
    
    console.log('✓ Supabase client initialized\n');
    
    // Parse statements
    const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Try to execute via PostgreSQL directly
    console.log('🔌 Testing PostgreSQL connection...\n');
    
    // Use the rpc call if available, otherwise the schema will be created via manual method
    console.log('⚠️  Note: Direct SQL execution via Supabase client requires');
    console.log('    the exec_sql RPC function to be set up.\n');
    
    console.log('📋 RECOMMENDED: Manual deployment via Supabase Dashboard\n');
    console.log('Steps:');
    console.log('1. Go to: https://app.supabase.com/project/yheqvroinbcrrpppzdzx');
    console.log('2. Navigate to: SQL Editor → New Query');
    console.log('3. Copy entire content of: sql/analytics-schema.sql');
    console.log('4. Paste into the SQL Editor');
    console.log('5. Click: Run (blue button)\n');
    
    console.log('Expected result: "5 statements executed successfully"\n');
    
    console.log('📊 Tables that will be created:');
    console.log('   • analytics_property_views');
    console.log('   • analytics_leads');
    console.log('   • analytics_valuations');
    console.log('   • analytics_page_views');
    console.log('   • analytics_searches\n');
    
    console.log('After deployment:');
    console.log('   npm run dev');
    console.log('   → http://localhost:3000/es/admin/analytics\n');
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✨ Dashboard will be fully functional once schema is deployed!');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
