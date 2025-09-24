#!/usr/bin/env node

/**
 * Debug script to check team and team_member records
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

async function debugTeam() {
  console.log('\n🔍 Debugging Team Configuration\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      process.exit(1);
    }

    console.log(`Found ${users.users.length} user(s):\n`);

    for (const user of users.users) {
      console.log(`User: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Created: ${user.created_at}`);

      // Check teams owned by this user
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('owner', user.id);

      if (teamsError) {
        console.error('  ❌ Error fetching teams:', teamsError.message);
      } else {
        console.log(`  Teams owned: ${teams.length}`);
        teams.forEach(team => {
          console.log(`    - ${team.name} (ID: ${team.id})`);
        });
      }

      // Check team memberships
      const { data: memberships, error: memberError } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          created_at,
          teams!inner(name)
        `)
        .eq('user_id', user.id);

      if (memberError) {
        console.error('  ❌ Error fetching team memberships:', memberError.message);
      } else {
        console.log(`  Team memberships: ${memberships.length}`);
        memberships.forEach(membership => {
          console.log(`    - Team: ${membership.teams.name}`);
          console.log(`      Team ID: ${membership.team_id}`);
          console.log(`      Role: ${membership.role}`);
          console.log(`      Joined: ${membership.created_at}`);
        });
      }

      console.log('');
    }

    // Check all teams
    console.log('\n📊 All Teams in Database:\n');
    const { data: allTeams, error: allTeamsError } = await supabase
      .from('teams')
      .select('*');

    if (allTeamsError) {
      console.error('❌ Error fetching all teams:', allTeamsError);
    } else {
      console.log(`Total teams: ${allTeams.length}`);
      allTeams.forEach(team => {
        console.log(`  - ${team.name}`);
        console.log(`    ID: ${team.id}`);
        console.log(`    Owner: ${team.owner}`);
        console.log(`    Created: ${team.created_at}`);
      });
    }

    // Check all team members
    console.log('\n👥 All Team Members:\n');
    const { data: allMembers, error: allMembersError } = await supabase
      .from('team_members')
      .select('*');

    if (allMembersError) {
      console.error('❌ Error fetching team members:', allMembersError);
    } else {
      console.log(`Total team members: ${allMembers.length}`);
      allMembers.forEach(member => {
        console.log(`  - User: ${member.user_id}`);
        console.log(`    Team: ${member.team_id}`);
        console.log(`    Role: ${member.role}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

debugTeam().catch(console.error);