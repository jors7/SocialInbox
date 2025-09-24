#!/usr/bin/env node

/**
 * Script to fix missing team_member record for existing users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

async function fixTeamMember() {
  console.log('\n🔧 Fixing Team Member Record\n');

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  // Initialize Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      process.exit(1);
    }

    console.log(`Found ${users.users.length} user(s)`);

    for (const user of users.users) {
      console.log(`\nChecking user: ${user.email}`);

      // Check if user has a team_member record
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        console.log('✅ Team member record exists');
        continue;
      }

      console.log('⚠️  No team member record found');

      // Check if user owns a team
      const { data: ownedTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('owner', user.id)
        .single();

      if (ownedTeam) {
        // User owns a team but isn't a member - add them
        console.log(`Adding user as member of their team: ${ownedTeam.name}`);

        const { error: addError } = await supabase
          .from('team_members')
          .insert({
            team_id: ownedTeam.id,
            user_id: user.id,
            role: 'owner'
          });

        if (addError) {
          console.error('❌ Error adding team member:', addError);
        } else {
          console.log('✅ Team member record created');
        }
      } else {
        // User doesn't own a team - create one
        console.log('Creating new team for user...');

        const { data: newTeam, error: teamError } = await supabase
          .from('teams')
          .insert({
            name: user.user_metadata?.team_name || 'Default Team',
            owner: user.id
          })
          .select()
          .single();

        if (teamError) {
          console.error('❌ Error creating team:', teamError);
          continue;
        }

        console.log(`✅ Team created: ${newTeam.name}`);

        // Add user as team member
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: newTeam.id,
            user_id: user.id,
            role: 'owner'
          });

        if (memberError) {
          console.error('❌ Error adding team member:', memberError);
        } else {
          console.log('✅ Team member record created');
        }
      }
    }

    console.log('\n✅ Team member fix complete!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
fixTeamMember().catch(console.error);