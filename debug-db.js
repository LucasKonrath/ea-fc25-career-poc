#!/usr/bin/env node

import sqlite3 from 'sqlite3';

async function debugDatabaseSchema() {
  console.log('🔍 Debugging Database Schema and Data...\n');
  
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('./data/players.db', sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        reject(err);
        return;
      }
      
      // Check table schema
      console.log('📋 Table Schema:');
      db.all("PRAGMA table_info(players)", (err, schema) => {
        if (err) {
          console.error('❌ Error getting schema:', err);
          reject(err);
          return;
        }
        
        schema.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
        });
        
        console.log('\n📊 Sample Data (first player):');
        db.get("SELECT * FROM players LIMIT 1", (err, firstPlayer) => {
          if (err) {
            console.error('❌ Error getting first player:', err);
            reject(err);
            return;
          }
          
          if (firstPlayer) {
            Object.keys(firstPlayer).forEach(key => {
              console.log(`   ${key}: ${firstPlayer[key]}`);
            });
          } else {
            console.log('   No data found in database');
          }
          
          console.log('\n🧪 Checking attributes specifically:');
          db.all("SELECT name, pace, shooting, passing, dribbling, defending, physical FROM players WHERE overall_rating >= 90 LIMIT 3", (err, attributeCheck) => {
            if (err) {
              console.error('❌ Error checking attributes:', err);
              reject(err);
              return;
            }
            
            attributeCheck.forEach((player, index) => {
              console.log(`   ${index + 1}. ${player.name}:`);
              console.log(`      Pace: ${player.pace}, Shooting: ${player.shooting}, Passing: ${player.passing}`);
              console.log(`      Dribbling: ${player.dribbling}, Defending: ${player.defending}, Physical: ${player.physical}`);
            });
            
            db.close();
            resolve(true);
          });
        });
      });
    });
  });
}

debugDatabaseSchema().catch(console.error);
