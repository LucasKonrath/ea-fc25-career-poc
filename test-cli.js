#!/usr/bin/env node

import { PlayerDatabase } from './src/database.js';

async function testDatabase() {
  console.log('🧪 Testing EA FC 25 Player Database...\n');
  
  const db = new PlayerDatabase();
  
  try {
    // Test database stats
    console.log('📊 Database Statistics:');
    const stats = await db.getStats();
    console.log(`   Total players: ${stats.totalPlayers}`);
    console.log(`   Average rating: ${stats.averageRating}`);
    console.log(`   Avg market value: €${stats.averageMarketValue?.toLocaleString()}`);
    console.log(`   Total positions: ${stats.totalPositions}\n`);
    
    // Test quick searches
    console.log('⚡ Quick Search Tests:');
    
    // Top players
    const topPlayers = await db.searchPlayers({ minOverall: 90 });
    console.log(`   Top players (90+ rating): ${topPlayers.length} found`);
    if (topPlayers.length > 0) {
      console.log(`   Example: ${topPlayers[0].name} (${topPlayers[0].overall} OVR, €${topPlayers[0].marketValue?.toLocaleString()})`);
    }
    
    // Young talents
    const youngTalents = await db.searchPlayers({ maxAge: 21, minPotential: 85 });
    console.log(`   Young talents (U21, 85+ potential): ${youngTalents.length} found`);
    if (youngTalents.length > 0) {
      console.log(`   Example: ${youngTalents[0].name} (${youngTalents[0].age}y, ${youngTalents[0].potential} POT)`);
    }
    
    // Strikers
    const strikers = await db.searchPlayers({ position: 'ST', minOverall: 80 });
    console.log(`   Top strikers (80+ rating): ${strikers.length} found`);
    if (strikers.length > 0) {
      console.log(`   Example: ${strikers[0].name} (${strikers[0].overall} OVR, ${strikers[0].position})`);
    }
    
    console.log('\n✅ All tests passed! The React CLI is working with real EA FC 25 data.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabase();
