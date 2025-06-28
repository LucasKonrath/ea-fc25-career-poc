#!/usr/bin/env node

import { readFileSync } from 'fs';

function debugRawCSV() {
  console.log('🔍 Debugging Raw CSV Data...\n');
  
  try {
    const csvContent = readFileSync('./dataset/player-data-full-2025-june.csv', 'utf-8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    
    console.log('📋 CSV Headers (attribute-related):');
    const attributeHeaders = headers.filter(h => 
      ['acceleration', 'sprint_speed', 'finishing', 'shot_power', 'short_passing', 'long_passing', 
       'dribbling', 'defensive_awareness', 'standing_tackle', 'strength', 'stamina'].includes(h)
    );
    console.log(attributeHeaders);
    console.log('');
    
    // Look at a few player rows
    console.log('📊 Sample player data:');
    for (let i = 1; i <= 3 && i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Simple CSV parsing for debugging
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      console.log(`Player ${i}:`);
      console.log(`  Name: ${values[headers.indexOf('name')] || 'N/A'}`);
      console.log(`  Overall: ${values[headers.indexOf('overall_rating')] || 'N/A'}`);
      console.log(`  Acceleration: ${values[headers.indexOf('acceleration')] || 'N/A'}`);
      console.log(`  Sprint Speed: ${values[headers.indexOf('sprint_speed')] || 'N/A'}`);
      console.log(`  Finishing: ${values[headers.indexOf('finishing')] || 'N/A'}`);
      console.log(`  Shot Power: ${values[headers.indexOf('shot_power')] || 'N/A'}`);
      console.log(`  Short Passing: ${values[headers.indexOf('short_passing')] || 'N/A'}`);
      console.log(`  Dribbling: ${values[headers.indexOf('dribbling')] || 'N/A'}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugRawCSV();
