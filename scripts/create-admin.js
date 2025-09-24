#!/usr/bin/env node

/**
 * Script to create an admin user account for SocialInbox
 * Run with: npm run create-admin
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const { promisify } = require('util');

// Load environment variables
require('dotenv').config({ path: './apps/web/.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = promisify(rl.question).bind(rl);

async function createAdminUser() {
  console.log('\n🚀 SocialInbox Admin Account Setup\n');
  console.log('This script will create an admin user account for your SocialInbox instance.\n');

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
  }

  // Initialize Supabase client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get admin details from user
    const email = await question('Admin email address: ');
    const password = await question('Admin password (min 6 characters): ');
    const teamName = await question('Team name (default: Admin Team): ') || 'Admin Team';

    console.log('\n📝 Creating admin account...');

    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        team_name: teamName,
        is_admin: true,
      },
    });

    if (authError) {
      console.error('❌ Error creating user:', authError.message);
      process.exit(1);
    }

    const userId = authData.user.id;
    console.log('✅ User account created');

    // Create team
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: teamName,
        owner: userId,
      })
      .select()
      .single();

    if (teamError) {
      console.error('❌ Error creating team:', teamError.message);
      // Try to clean up the created user
      await supabase.auth.admin.deleteUser(userId);
      process.exit(1);
    }

    console.log('✅ Team created');

    // Add user as team owner
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: teamData.id,
        user_id: userId,
        role: 'owner',
      });

    if (memberError) {
      console.error('❌ Error adding team member:', memberError.message);
      process.exit(1);
    }

    console.log('✅ User added as team owner');

    console.log('\n🎉 Admin account created successfully!\n');
    console.log('📋 Account Details:');
    console.log('   Email:', email);
    console.log('   Team:', teamName);
    console.log('   Team ID:', teamData.id);
    console.log('   User ID:', userId);
    console.log('\n🚀 You can now log in at http://localhost:3000/auth/login');
    console.log('   Run "npm run dev" to start the development server.\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
createAdminUser().catch(console.error);