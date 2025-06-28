"""
Data handling and storage for player information.
"""

import sqlite3
import json
import logging
import sys
import os
import pandas as pd
import re
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.models import Player, PlayerAttributes, Position, SearchCriteria


logger = logging.getLogger(__name__)


class CSVDataLoader:
    """Load real player data from CSV files"""
    
    def __init__(self, csv_path: str = "dataset/player-data-full-2025-june.csv"):
        self.csv_path = Path(csv_path)
        if not self.csv_path.is_absolute():
            # Make path relative to project root
            project_root = Path(__file__).parent.parent.parent
            self.csv_path = project_root / csv_path
    
    def parse_currency_value(self, value_str: str) -> int:
        """Parse currency strings like '€115.5M' or '€440K' to integer euros"""
        if pd.isna(value_str) or not value_str or value_str == '':
            return 0
        
        # Remove currency symbol and spaces
        clean_value = str(value_str).replace('€', '').replace(',', '').strip()
        
        if clean_value == '' or clean_value == '-':
            return 0
        
        try:
            # Handle K (thousands) and M (millions)
            if 'M' in clean_value:
                number = float(clean_value.replace('M', ''))
                return int(number * 1_000_000)
            elif 'K' in clean_value:
                number = float(clean_value.replace('K', ''))
                return int(number * 1_000)
            else:
                # Just a number
                return int(float(clean_value))
        except (ValueError, TypeError):
            logger.warning(f"Could not parse currency value: {value_str}")
            return 0
    
    def parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date strings like '2027' or '2027-06-30'"""
        if pd.isna(date_str) or not date_str or date_str == '':
            return None
        
        try:
            if len(str(date_str)) == 4:  # Just year
                return datetime(int(date_str), 12, 31)  # End of year
            else:
                return datetime.fromisoformat(str(date_str))
        except (ValueError, TypeError):
            logger.warning(f"Could not parse date: {date_str}")
            return None
    
    def calculate_age(self, dob_str: str) -> int:
        """Calculate age from date of birth string"""
        if pd.isna(dob_str) or not dob_str:
            return 25  # Default age
        
        try:
            dob = datetime.fromisoformat(str(dob_str))
            today = datetime.now()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            return max(16, min(45, age))  # Clamp between reasonable limits
        except (ValueError, TypeError):
            logger.warning(f"Could not parse date of birth: {dob_str}")
            return 25
    
    def parse_position(self, positions_str: str) -> Position:
        """Parse position string and return primary position"""
        if pd.isna(positions_str) or not positions_str:
            return Position.CM  # Default position
        
        # Split by comma and take first position
        primary_pos = str(positions_str).split(',')[0].strip()
        
        # Map common position variations
        position_mapping = {
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
        }
        
        return position_mapping.get(primary_pos, Position.CM)
    
    def safe_int(self, value: Any, default: int = 0) -> int:
        """Safely convert value to integer"""
        if pd.isna(value) or value == '' or value == ' ':
            return default
        try:
            return int(float(str(value).strip()))
        except (ValueError, TypeError):
            return default
    
    def load_players_from_csv(self, limit: Optional[int] = None) -> List[Player]:
        """Load players from CSV file"""
        try:
            logger.info(f"Loading player data from {self.csv_path}")
            
            if not self.csv_path.exists():
                logger.error(f"CSV file not found: {self.csv_path}")
                return []
            
            # Read CSV file
            df = pd.read_csv(self.csv_path)
            logger.info(f"Loaded {len(df)} rows from CSV")
            
            if limit:
                df = df.head(limit)
            
            players = []
            
            for idx, row in df.iterrows():
                try:
                    # Parse individual attribute values
                    pace = max(
                        self.safe_int(row.get('acceleration', 50)),
                        self.safe_int(row.get('sprint_speed', 50))
                    ) if self.safe_int(row.get('acceleration', 0)) > 0 else 50
                    
                    shooting = max(
                        self.safe_int(row.get('finishing', 50)),
                        self.safe_int(row.get('shot_power', 50))
                    ) if self.safe_int(row.get('finishing', 0)) > 0 else 50
                    
                    passing = max(
                        self.safe_int(row.get('short_passing', 50)),
                        self.safe_int(row.get('long_passing', 50))
                    ) if self.safe_int(row.get('short_passing', 0)) > 0 else 50
                    
                    dribbling = self.safe_int(row.get('dribbling', 50), 50)
                    defending = max(
                        self.safe_int(row.get('defensive_awareness', 50)),
                        self.safe_int(row.get('standing_tackle', 50))
                    ) if self.safe_int(row.get('defensive_awareness', 0)) > 0 else 50
                    
                    physical = max(
                        self.safe_int(row.get('strength', 50)),
                        self.safe_int(row.get('stamina', 50))
                    ) if self.safe_int(row.get('strength', 0)) > 0 else 50
                    
                    # Create player attributes
                    attributes = PlayerAttributes(
                        pace=min(99, max(1, pace)),
                        shooting=min(99, max(1, shooting)),
                        passing=min(99, max(1, passing)),
                        dribbling=min(99, max(1, dribbling)),
                        defending=min(99, max(1, defending)),
                        physical=min(99, max(1, physical))
                    )
                    
                    # Parse contract expiry
                    contract_expiry = self.parse_date(row.get('club_contract_valid_until'))
                    
                    # Create player object
                    player = Player(
                        id=self.safe_int(row.get('player_id', idx + 1)),
                        name=str(row.get('name', f'Player {idx + 1}')).strip(),
                        age=self.calculate_age(row.get('dob')),
                        nationality=str(row.get('country_name', 'Unknown')).strip(),
                        club=str(row.get('club_name', '')).strip() if pd.notna(row.get('club_name')) else None,
                        league=str(row.get('club_league_name', '')).strip() if pd.notna(row.get('club_league_name')) else None,
                        position=self.parse_position(row.get('positions')),
                        preferred_foot=str(row.get('preferred_foot', 'Right')).strip(),
                        overall_rating=min(99, max(40, self.safe_int(row.get('overall_rating', 75)))),
                        potential=min(99, max(40, self.safe_int(row.get('potential', 75)))),
                        market_value=self.parse_currency_value(row.get('value')),
                        wage=self.parse_currency_value(row.get('wage')),
                        release_clause=self.parse_currency_value(row.get('release_clause')),
                        attributes=attributes,
                        contract_expiry=contract_expiry,
                        last_updated=datetime.now()
                    )
                    
                    players.append(player)
                    
                except Exception as e:
                    logger.warning(f"Error processing row {idx}: {e}")
                    continue
            
            logger.info(f"Successfully loaded {len(players)} players from CSV")
            return players
            
        except Exception as e:
            logger.error(f"Error loading CSV file: {e}")
            return []


class PlayerDatabase:
    """SQLite database handler for player data"""
    
    def __init__(self, db_path: str = "data/players.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self._initialize_database()
    
    def _initialize_database(self):
        """Create database tables if they don't exist"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Players table
            cursor.execute("""
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
                    last_updated TEXT NOT NULL,
                    UNIQUE(id)
                )
            """)
            
            # Create indexes for better performance
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_position ON players(position)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_overall ON players(overall_rating)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_age ON players(age)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_value ON players(market_value)")
            
            conn.commit()
            logger.info("Database initialized successfully")
    
    def add_player(self, player: Player) -> bool:
        """Add or update a player in the database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT OR REPLACE INTO players (
                        id, name, age, nationality, club, league, position,
                        preferred_foot, overall_rating, potential, market_value,
                        wage, release_clause, contract_expiry, attributes, last_updated
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    player.id,
                    player.name,
                    player.age,
                    player.nationality,
                    player.club,
                    player.league,
                    player.position.value,
                    player.preferred_foot,
                    player.overall_rating,
                    player.potential,
                    player.market_value,
                    player.wage,
                    player.release_clause,
                    player.contract_expiry.isoformat() if player.contract_expiry else None,
                    player.attributes.json(),
                    player.last_updated.isoformat()
                ))
                
                conn.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error adding player {player.name}: {e}")
            return False
    
    def get_player(self, player_id: int) -> Optional[Player]:
        """Get a player by ID"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM players WHERE id = ?", (player_id,))
                row = cursor.fetchone()
                
                if row:
                    return self._row_to_player(row)
                return None
                
        except Exception as e:
            logger.error(f"Error getting player {player_id}: {e}")
            return None
    
    def search_players(self, criteria: SearchCriteria) -> List[Player]:
        """Search players based on criteria"""
        try:
            query = "SELECT * FROM players WHERE 1=1"
            params = []
            
            if criteria.position:
                query += " AND position = ?"
                params.append(criteria.position.value)
            
            query += " AND overall_rating >= ?"
            params.append(criteria.min_overall)
            
            if criteria.max_overall:
                query += " AND overall_rating <= ?"
                params.append(criteria.max_overall)
            
            if criteria.min_potential:
                query += " AND potential >= ?"
                params.append(criteria.min_potential)
            
            if criteria.max_age:
                query += " AND age <= ?"
                params.append(criteria.max_age)
            
            if criteria.min_age:
                query += " AND age >= ?"
                params.append(criteria.min_age)
            
            if criteria.max_price:
                query += " AND market_value <= ?"
                params.append(criteria.max_price)
            
            if criteria.min_price:
                query += " AND market_value >= ?"
                params.append(criteria.min_price)
            
            if criteria.nationality:
                query += " AND nationality = ?"
                params.append(criteria.nationality)
            
            if criteria.league:
                query += " AND league = ?"
                params.append(criteria.league)
            
            if criteria.preferred_foot:
                query += " AND preferred_foot = ?"
                params.append(criteria.preferred_foot)
            
            # Order by overall rating and potential
            query += " ORDER BY overall_rating DESC, potential DESC, market_value ASC"
            query += f" LIMIT {criteria.limit}"
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                return [self._row_to_player(row) for row in rows]
                
        except Exception as e:
            logger.error(f"Error searching players: {e}")
            return []
    
    def get_all_positions(self) -> List[str]:
        """Get list of all positions in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT DISTINCT position FROM players ORDER BY position")
                return [row[0] for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error getting positions: {e}")
            return []
    
    def get_stats(self, position: Optional[str] = None) -> Dict[str, Any]:
        """Get database statistics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                base_query = "SELECT COUNT(*), AVG(overall_rating), AVG(market_value), AVG(age) FROM players"
                if position:
                    cursor.execute(f"{base_query} WHERE position = ?", (position,))
                else:
                    cursor.execute(base_query)
                
                count, avg_rating, avg_value, avg_age = cursor.fetchone()
                
                return {
                    'total_players': count or 0,
                    'average_rating': round(avg_rating or 0, 1),
                    'average_value': int(avg_value or 0),
                    'average_age': round(avg_age or 0, 1)
                }
                
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {}
    
    def _row_to_player(self, row) -> Player:
        """Convert database row to Player object"""
        attributes_dict = json.loads(row[14])  # attributes column
        
        return Player(
            id=row[0],
            name=row[1],
            age=row[2],
            nationality=row[3],
            club=row[4],
            league=row[5],
            position=Position(row[6]),
            preferred_foot=row[7],
            overall_rating=row[8],
            potential=row[9],
            market_value=row[10],
            wage=row[11],
            release_clause=row[12],
            contract_expiry=datetime.fromisoformat(row[13]) if row[13] else None,
            attributes=PlayerAttributes(**attributes_dict),
            last_updated=datetime.fromisoformat(row[15])
        )


class SampleDataGenerator:
    """Generate sample player data for testing"""
    
    @staticmethod
    def create_sample_players(count: int = 100) -> List[Player]:
        """Create sample players with realistic data"""
        import random
        
        # Sample data
        first_names = [
            "Lionel", "Cristiano", "Kylian", "Erling", "Robert", "Sadio", "Mohamed", "Kevin",
            "Virgil", "Luka", "Toni", "Joshua", "Harry", "Raheem", "Jadon", "Marcus",
            "Pedri", "Gavi", "Jude", "Eduardo", "Vinicius", "Karim", "Antoine", "Luis"
        ]
        
        last_names = [
            "Messi", "Ronaldo", "Mbappe", "Haaland", "Lewandowski", "Mane", "Salah", "De Bruyne",
            "van Dijk", "Modric", "Kroos", "Kimmich", "Kane", "Sterling", "Sancho", "Rashford",
            "Gonzalez", "Lopez", "Bellingham", "Camavinga", "Junior", "Benzema", "Griezmann", "Suarez"
        ]
        
        nationalities = [
            "Argentina", "Portugal", "France", "Norway", "Poland", "Senegal", "Egypt", "Belgium",
            "Netherlands", "Croatia", "Germany", "England", "Spain", "Brazil", "Morocco", "Italy"
        ]
        
        clubs = [
            "Real Madrid", "Barcelona", "Manchester City", "Liverpool", "Bayern Munich", "PSG",
            "Chelsea", "Manchester United", "Arsenal", "Tottenham", "Juventus", "AC Milan",
            "Inter Milan", "Atletico Madrid", "Borussia Dortmund", "RB Leipzig"
        ]
        
        players = []
        
        for i in range(count):
            # Generate random player data
            age = random.randint(16, 35)
            overall = random.randint(65, 95)
            potential = max(overall, min(99, overall + random.randint(0, 15)))
            
            # Adjust potential based on age
            if age > 28:
                potential = max(overall, min(99, overall + random.randint(-5, 2)))
            
            # Generate market value based on rating and age
            base_value = int((overall ** 1.8) * random.randint(10000, 50000))
            if age < 23:
                base_value = int(base_value * random.uniform(1.2, 2.0))  # Young player bonus
            elif age > 30:
                base_value = int(base_value * random.uniform(0.3, 0.7))  # Age penalty
            
            player = Player(
                id=i + 1,
                name=f"{random.choice(first_names)} {random.choice(last_names)}",
                age=age,
                nationality=random.choice(nationalities),
                club=random.choice(clubs),
                league="Premier League" if random.random() > 0.7 else "La Liga",
                position=random.choice(list(Position)),
                preferred_foot=random.choice(["Right", "Left"]),
                overall_rating=overall,
                potential=potential,
                market_value=base_value,
                wage=random.randint(50000, 500000),
                release_clause=int(base_value * random.uniform(1.5, 3.0)) if random.random() > 0.5 else None,
                attributes=PlayerAttributes(
                    pace=random.randint(40, 99),
                    shooting=random.randint(40, 99),
                    passing=random.randint(40, 99),
                    dribbling=random.randint(40, 99),
                    defending=random.randint(40, 99),
                    physical=random.randint(40, 99)
                ),
                contract_expiry=datetime.now() + timedelta(days=random.randint(30, 1095))
            )
            
            players.append(player)
        
        return players
