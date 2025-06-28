import sqlite3 from 'sqlite3';
import { readFileSync } from 'node:fs';
import { Player, Position, SearchCriteria, DatabaseStats, PlayerAttributes } from './types.js';

export class PlayerDatabase {
  private db: sqlite3.Database;

  constructor(dbPath: string = 'data/players.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        nationality TEXT,
        club TEXT,
        league TEXT,
        position TEXT NOT NULL,
        preferred_foot TEXT DEFAULT 'Right',
        overall_rating INTEGER NOT NULL,
        potential INTEGER NOT NULL,
        market_value INTEGER NOT NULL,
        wage INTEGER,
        release_clause INTEGER,
        contract_expiry TEXT,
        attributes TEXT NOT NULL,
        last_updated TEXT NOT NULL
      )
    `;

    this.db.run(createTableSQL);
  }

  async searchPlayers(criteria: SearchCriteria, limit: number = 50): Promise<Player[]> {
    return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM players WHERE 1=1';
      const params: any[] = [];

      if (criteria.position) {
        sql += ' AND position = ?';
        params.push(criteria.position);
      }

      if (criteria.minOverall) {
        sql += ' AND overall_rating >= ?';
        params.push(criteria.minOverall);
      }

      if (criteria.maxAge) {
        sql += ' AND age <= ?';
        params.push(criteria.maxAge);
      }

      if (criteria.maxPrice) {
        sql += ' AND market_value <= ?';
        params.push(criteria.maxPrice);
      }

      if (criteria.minPotential) {
        sql += ' AND potential >= ?';
        params.push(criteria.minPotential);
      }

      if (criteria.nationality) {
        sql += ' AND nationality LIKE ?';
        params.push(`%${criteria.nationality}%`);
      }

      if (criteria.league) {
        sql += ' AND league LIKE ?';
        params.push(`%${criteria.league}%`);
      }

      if (criteria.club) {
        sql += ' AND club LIKE ?';
        params.push(`%${criteria.club}%`);
      }

      sql += ' ORDER BY overall_rating DESC, market_value DESC';
      sql += ` LIMIT ${limit}`;

      this.db.all(sql, params, (err: sqlite3.RunResult | null, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const players = rows.map(row => this.rowToPlayer(row));
        resolve(players);
      });
    });
  }

  async getStats(): Promise<DatabaseStats> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_players,
          AVG(overall_rating) as avg_rating,
          AVG(market_value) as avg_value,
          AVG(age) as avg_age,
          position,
          COUNT(*) as position_count
        FROM players 
        GROUP BY position
      `;

      this.db.all(sql, [], (err: sqlite3.RunResult | null, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const totalPlayers = rows.reduce((sum, row) => sum + row.position_count, 0);
        const avgRating = rows.reduce((sum, row) => sum + (row.avg_rating * row.position_count), 0) / totalPlayers;
        const avgValue = rows.reduce((sum, row) => sum + (row.avg_value * row.position_count), 0) / totalPlayers;
        const avgAge = rows.reduce((sum, row) => sum + (row.avg_age * row.position_count), 0) / totalPlayers;

        const positionCounts = rows.reduce((acc, row) => {
          acc[row.position as Position] = row.position_count;
          return acc;
        }, {} as Record<Position, number>);

        resolve({
          totalPlayers,
          averageRating: Math.round(avgRating * 10) / 10,
          averageValue: Math.round(avgValue),
          averageAge: Math.round(avgAge * 10) / 10,
          positionCounts
        });
      });
    });
  }

  async addPlayer(player: Player): Promise<boolean> {
    return new Promise((resolve) => {
      const sql = `
        INSERT OR REPLACE INTO players (
          id, name, age, nationality, club, league, position, preferred_foot,
          overall_rating, potential, market_value, wage, release_clause, contract_expiry,
          attributes, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        player.id, player.name, player.age, player.nationality, player.club, player.league,
        player.position, player.preferredFoot, player.overallRating, player.potential,
        player.marketValue, player.wage, player.releaseClause, 
        player.contractExpiry?.toISOString() ?? null, JSON.stringify(player.attributes), player.lastUpdated.toISOString()
      ];

      this.db.run(sql, params, function(err: Error | null) {
        resolve(!err);
      });
    });
  }

  async getLeagues(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT DISTINCT league 
        FROM players 
        WHERE league IS NOT NULL AND league != '' 
        ORDER BY league
      `;

      this.db.all(sql, [], (err: sqlite3.RunResult | null, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const leagues = rows.map(row => row.league);
        resolve(leagues);
      });
    });
  }

  async getPlayersByLeague(league: string, minRating: number = 80, limit: number = 50): Promise<Player[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM players 
        WHERE league = ? AND overall_rating >= ? 
        ORDER BY overall_rating DESC, market_value DESC 
        LIMIT ?
      `;

      this.db.all(sql, [league, minRating, limit], (err: sqlite3.RunResult | null, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const players = rows.map(row => this.rowToPlayer(row));
        resolve(players);
      });
    });
  }

  async getPlayersByContinent(continent: string, minRating: number = 75, limit: number = 50): Promise<Player[]> {
    const continentCountries = this.getContinentCountries(continent);
    
    return new Promise((resolve, reject) => {
      const placeholders = continentCountries.map(() => '?').join(',');
      const sql = `
        SELECT * FROM players 
        WHERE nationality IN (${placeholders}) AND overall_rating >= ? 
        ORDER BY overall_rating DESC, market_value DESC 
        LIMIT ?
      `;

      const params = [...continentCountries, minRating, limit];
      this.db.all(sql, params, (err: sqlite3.RunResult | null, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const players = rows.map(row => this.rowToPlayer(row));
        resolve(players);
      });
    });
  }

  private getContinentCountries(continent: string): string[] {
    const continentMap: Record<string, string[]> = {
      'Europe': [
        'Spain', 'France', 'Netherlands', 'Portugal', 'England', 'Italy', 'Germany', 
        'Sweden', 'Norway', 'Croatia', 'Poland', 'Hungary', 'Denmark', 'Ukraine', 
        'Scotland', 'Finland', 'Czechia', 'Belgium', 'Austria', 'Switzerland', 
        'Greece', 'Serbia', 'Turkey', 'Russia', 'Romania', 'Bulgaria', 'Slovenia',
        'Slovakia', 'Ireland', 'Wales', 'Iceland', 'Bosnia and Herzegovina',
        'North Macedonia', 'Albania', 'Montenegro', 'Lithuania', 'Latvia', 'Estonia'
      ],
      'South America': [
        'Argentina', 'Brazil', 'Uruguay', 'Colombia', 'Chile', 'Peru', 'Ecuador',
        'Paraguay', 'Bolivia', 'Venezuela', 'Guyana', 'Suriname'
      ],
      'North America': [
        'United States', 'Mexico', 'Canada', 'Costa Rica', 'Honduras', 'Guatemala',
        'Panama', 'El Salvador', 'Nicaragua', 'Jamaica', 'Trinidad and Tobago'
      ],
      'Africa': [
        'Morocco', 'Ghana', 'Nigeria', 'Egypt', 'South Africa', 'Tunisia', 'Algeria',
        'Senegal', 'Cameroon', 'Ivory Coast', 'Mali', 'Burkina Faso', 'Kenya',
        'Ethiopia', 'Zimbabwe', 'Zambia', 'Angola', 'Madagascar', 'Mozambique'
      ],
      'Asia': [
        'Japan', 'South Korea', 'China', 'India', 'Thailand', 'Iran', 'Iraq',
        'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Jordan', 'Lebanon', 'Syria',
        'Israel', 'Palestine', 'Vietnam', 'Malaysia', 'Singapore', 'Indonesia',
        'Philippines', 'Myanmar', 'Cambodia', 'Laos', 'North Korea', 'Mongolia',
        'Kazakhstan', 'Uzbekistan', 'Kyrgyzstan', 'Tajikistan', 'Turkmenistan',
        'Afghanistan', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan'
      ],
      'Oceania': [
        'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Solomon Islands',
        'Vanuatu', 'Samoa', 'Tonga', 'Palau', 'Marshall Islands', 'Micronesia'
      ]
    };

    return continentMap[continent] || [];
  }

  async getContinents(): Promise<{ continent: string; playerCount: number }[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT nationality, COUNT(*) as count 
        FROM players 
        WHERE nationality IS NOT NULL AND nationality != '' AND nationality != 'Unknown'
        GROUP BY nationality
      `;

      this.db.all(sql, [], (err: sqlite3.RunResult | null, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const continentCounts: Record<string, number> = {
          'Europe': 0,
          'South America': 0,
          'North America': 0,
          'Africa': 0,
          'Asia': 0,
          'Oceania': 0
        };

        rows.forEach((row: any) => {
          const continents = ['Europe', 'South America', 'North America', 'Africa', 'Asia', 'Oceania'];
          for (const continent of continents) {
            if (this.getContinentCountries(continent).includes(row.nationality)) {
              continentCounts[continent] += row.count;
              break;
            }
          }
        });

        const result = Object.entries(continentCounts)
          .filter(([_, count]) => count > 0)
          .map(([continent, count]) => ({ continent, playerCount: count }))
          .sort((a, b) => b.playerCount - a.playerCount);

        resolve(result);
      });
    });
  }

  private rowToPlayer(row: any): Player {
    // Parse attributes from JSON string
    let attributes: PlayerAttributes;
    try {
      attributes = typeof row.attributes === 'string' 
        ? JSON.parse(row.attributes) 
        : row.attributes;
    } catch (error) {
      // Fallback to default values if JSON parsing fails
      attributes = {
        pace: 50,
        shooting: 50,
        passing: 50,
        dribbling: 50,
        defending: 50,
        physical: 50
      };
    }

    return {
      id: row.id,
      name: row.name,
      age: row.age,
      nationality: row.nationality,
      club: row.club,
      league: row.league,
      position: row.position as Position,
      preferredFoot: row.preferred_foot,
      overallRating: row.overall_rating,
      potential: row.potential,
      marketValue: row.market_value,
      wage: row.wage,
      releaseClause: row.release_clause,
      attributes,
      contractExpiry: row.contract_expiry ? new Date(row.contract_expiry) : undefined,
      lastUpdated: new Date(row.last_updated)
    };
  }

  close(): void {
    this.db.close();
  }


}

export class CSVDataLoader {
  constructor(private csvPath: string = 'dataset/player-data-full-2025-june.csv') {}

  async loadPlayersFromCSV(): Promise<Player[]> {
    try {
      const csvContent = readFileSync(this.csvPath, 'utf-8');
      const lines = csvContent.split('\n');
      
      if (lines.length < 2) {
        return [];
      }
      
      // Parse header to get column indices
      const headers = this.parseCSVLine(lines[0]);
      console.log('CSV Headers found:', headers.length);
      
      const players: Player[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        try {
          const values = this.parseCSVLine(lines[i]);
          
          // Create a row object with proper column mapping
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          const player = this.parsePlayerFromRow(row);
          if (player) {
            players.push(player);
          }
        } catch (error) {
          // Skip invalid rows
          continue;
        }
      }
      
      return players;
    } catch (error) {
      console.error('Error loading CSV:', error);
      return [];
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
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

  private parsePlayerFromRow(row: any): Player | null {
    try {
      // Since the CSV doesn't have detailed attribute data, we'll omit them
      // rather than showing fabricated values
      const attributes: PlayerAttributes = {
        pace: 0,
        shooting: 0,
        passing: 0,
        dribbling: 0,
        defending: 0,
        physical: 0
      };

      return {
        id: this.safeInt(row.player_id, Math.floor(Math.random() * 1000000)),
        name: row.name || 'Unknown Player',
        age: this.calculateAge(row.dob),
        nationality: row.country_name || 'Unknown',
        club: row.club_name || undefined,
        league: row.club_league_name || undefined,
        position: this.parsePosition(row.positions),
        preferredFoot: row.preferred_foot || 'Right',
        overallRating: Math.min(99, Math.max(40, this.safeInt(row.overall_rating, 75))),
        potential: Math.min(99, Math.max(40, this.safeInt(row.potential, 75))),
        marketValue: this.parseCurrencyValue(row.value),
        wage: this.parseCurrencyValue(row.wage),
        releaseClause: this.parseCurrencyValue(row.release_clause),
        attributes,
        contractExpiry: this.parseDate(row.club_contract_valid_until),
        lastUpdated: new Date()
      };
    } catch (error) {
      return null;
    }
  }

  private safeInt(value: any, defaultValue: number = 0): number {
    if (!value || value === '' || value === ' ') return defaultValue;
    const parsed = parseInt(String(value).trim());
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private parseCurrencyValue(value: string): number {
    if (!value || value === '') return 0;
    
    const clean = String(value).replace('€', '').replace(',', '').trim();
    if (clean === '' || clean === '-') return 0;
    
    try {
      if (clean.includes('M')) {
        return Math.floor(parseFloat(clean.replace('M', '')) * 1_000_000);
      } else if (clean.includes('K')) {
        return Math.floor(parseFloat(clean.replace('K', '')) * 1_000);
      } else {
        return Math.floor(parseFloat(clean));
      }
    } catch {
      return 0;
    }
  }

  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr || dateStr === '' || dateStr === 'nan' || dateStr === 'NaN') return undefined;
    try {
      const date = new Date(dateStr);
      // Check if the date is valid
      if (isNaN(date.getTime())) return undefined;
      return date;
    } catch {
      return undefined;
    }
  }

  private calculateAge(dobStr: string): number {
    if (!dobStr) return 25;
    try {
      const dob = new Date(dobStr);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear() - 
        (today.getMonth() < dob.getMonth() || 
         (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0);
      return Math.max(16, Math.min(45, age));
    } catch {
      return 25;
    }
  }

  private parsePosition(positionsStr: string): Position {
    if (!positionsStr) return Position.CM;
    
    const primaryPos = String(positionsStr).split(',')[0].trim();
    
    const positionMap: Record<string, Position> = {
      'GK': Position.GK,
      'CB': Position.CB,
      'LB': Position.LB,
      'RB': Position.RB,
      'LWB': Position.LWB,
      'RWB': Position.RWB,
      'CDM': Position.CDM,
      'CM': Position.CM,
      'CAM': Position.CAM,
      'LM': Position.LM,
      'RM': Position.RM,
      'LW': Position.LW,
      'RW': Position.RW,
      'CF': Position.CF,
      'ST': Position.ST
    };

    return positionMap[primaryPos] || Position.CM;
  }
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `€${Math.floor(value / 1_000)}K`;
  } else {
    return `€${value}`;
  }
}
