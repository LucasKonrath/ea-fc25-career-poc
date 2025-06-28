#!/usr/bin/env node

import { PlayerDatabase } from './src/database.js';

async function debugAttributes() {
  console.log('🔍 Debugging Player Attributes...\n');
  
  const db = new PlayerDatabase();
  
  try {
    // Get a few players to check their attributes
    const topPlayers = await db.searchPlayers({ minOverall: 90 });
    
    if (topPlayers.length === 0) {
      console.log('❌ No players found with 90+ rating');
      return;
    }
    
    console.log(`📊 Found ${topPlayers.length} top players. Checking first 3 for attributes:\n`);
    
    for (let i = 0; i < Math.min(3, topPlayers.length); i++) {
      const player = topPlayers[i];
      console.log(`🔹 Player: ${player.name}`);
      console.log(`   Overall: ${player.overallRating} | Potential: ${player.potential}`);
      console.log(`   Position: ${player.position} | Age: ${player.age}`);
      console.log(`   Club: ${player.club || 'Free Agent'}`);
      console.log(`   Attributes Object:`, player.attributes);
      console.log(`   - Pace: ${player.attributes?.pace || 'undefined'}`);
      console.log(`   - Shooting: ${player.attributes?.shooting || 'undefined'}`);
      console.log(`   - Passing: ${player.attributes?.passing || 'undefined'}`);
      console.log(`   - Dribbling: ${player.attributes?.dribbling || 'undefined'}`);
      console.log(`   - Defending: ${player.attributes?.defending || 'undefined'}`);
      console.log(`   - Physical: ${player.attributes?.physical || 'undefined'}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugAttributes();
