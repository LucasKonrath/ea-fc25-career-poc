#!/usr/bin/env node

import { readFileSync } from 'fs';

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim().replace(/"/g, ''));
    return result;
}

function debugSpecificPlayer() {
  console.log('🔍 Debugging Specific Player CSV Parsing...\n');
  
  try {
    const csvContent = readFileSync('./dataset/player-data-full-2025-june.csv', 'utf-8');
    const lines = csvContent.split('\n');
    
    // Parse headers
    const headers = parseCSVLine(lines[0]);
    console.log('📋 Total headers found:', headers.length);
    console.log('');
    
    // Find attribute column indices
    const attributeColumns = [
      'acceleration', 'sprint_speed', 'finishing', 'shot_power', 
      'short_passing', 'long_passing', 'dribbling', 
      'defensive_awareness', 'standing_tackle', 'strength', 'stamina'
    ];
    
    console.log('🎯 Attribute column indices:');
    attributeColumns.forEach(col => {
      const index = headers.indexOf(col);
      console.log(`   ${col}: ${index >= 0 ? index : 'NOT FOUND'}`);
    });
    console.log('');
    
    // Parse a few high-rated players
    console.log('👤 Sample player data:');
    for (let i = 1; i <= 5 && i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = parseCSVLine(lines[i]);
      const nameIndex = headers.indexOf('name');
      const overallIndex = headers.indexOf('overall_rating');
      
      if (nameIndex >= 0 && overallIndex >= 0) {
        const name = values[nameIndex] || 'Unknown';
        const overall = values[overallIndex] || 'N/A';
        
        console.log(`   Player ${i}: ${name} (Overall: ${overall})`);
        
        // Check attribute values
        attributeColumns.forEach(col => {
          const index = headers.indexOf(col);
          if (index >= 0) {
            const value = values[index] || 'empty';
            console.log(`     ${col}: "${value}"`);
          }
        });
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugSpecificPlayer();
