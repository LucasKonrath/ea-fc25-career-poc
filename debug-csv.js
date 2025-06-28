#!/usr/bin/env node

import { CSVDataLoader } from './src/database.js';

async function debugCSVData() {
  console.log('🔍 Debugging CSV Data Parsing...\n');
  
  try {
    const loader = new CSVDataLoader();
    const players = await loader.loadPlayersFromCSV();
    
    if (players.length === 0) {
      console.log('❌ No players loaded from CSV');
      return;
    }
    
    console.log(`📊 Loaded ${players.length} players from CSV\n`);
    
    // Check first few top-rated players
    const topPlayers = players
      .filter(p => p.overallRating >= 85)
      .sort((a, b) => b.overallRating - a.overallRating)
      .slice(0, 3);
    
    console.log('🌟 Top 3 high-rated players with attributes:\n');
    
    topPlayers.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name}`);
      console.log(`   Overall: ${player.overallRating} | Position: ${player.position}`);
      console.log(`   Attributes:`);
      console.log(`     Pace: ${player.attributes.pace}`);
      console.log(`     Shooting: ${player.attributes.shooting}`);
      console.log(`     Passing: ${player.attributes.passing}`);
      console.log(`     Dribbling: ${player.attributes.dribbling}`);
      console.log(`     Defending: ${player.attributes.defending}`);
      console.log(`     Physical: ${player.attributes.physical}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugCSVData();
