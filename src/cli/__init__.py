"""
Command-line interface commands for the EA FC 25 player manager.
"""

import logging
from typing import Optional
from tabulate import tabulate

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.models import SearchCriteria, Position
from src.data import PlayerDatabase, SampleDataGenerator, CSVDataLoader
from src.analysis import PlayerAnalyzer


logger = logging.getLogger(__name__)


def format_currency(value: int) -> str:
    """Format currency values in a readable way"""
    if value >= 1_000_000:
        return f"€{value / 1_000_000:.1f}M"
    elif value >= 1_000:
        return f"€{value / 1_000:.0f}K"
    else:
        return f"€{value}"


def search_players(position: Optional[str], max_price: Optional[int], 
                  min_rating: int, max_age: Optional[int], 
                  min_potential: Optional[int], limit: int):
    """Search and display players based on criteria"""
    try:
        db = PlayerDatabase()
        
        # Check if database has data
        stats = db.get_stats()
        if stats.get('total_players', 0) == 0:
            print("No player data found. Generating sample data...")
            _populate_sample_data(db)
        
        # Build search criteria
        pos = Position(position) if position else None
        criteria = SearchCriteria(
            position=pos,
            max_price=max_price,
            min_overall=min_rating,
            max_age=max_age,
            min_potential=min_potential,
            limit=limit
        )
        
        players = db.search_players(criteria)
        
        if not players:
            print("No players found matching your criteria.")
            return
        
        # Prepare data for display
        headers = ["Name", "Age", "Pos", "Rating", "Potential", "Value", "Club"]
        table_data = []
        
        for player in players:
            table_data.append([
                player.name,
                player.age,
                player.position.value,
                player.overall_rating,
                player.potential,
                format_currency(player.market_value),
                player.club or "Free Agent"
            ])
        
        print(f"\n🔍 Found {len(players)} players matching your criteria:\n")
        print(tabulate(table_data, headers=headers, tablefmt="grid"))
        
        # Show summary statistics
        total_value = sum(p.market_value for p in players)
        avg_rating = sum(p.overall_rating for p in players) / len(players)
        avg_age = sum(p.age for p in players) / len(players)
        
        print(f"\n📊 Summary:")
        print(f"   Total value: {format_currency(total_value)}")
        print(f"   Average rating: {avg_rating:.1f}")
        print(f"   Average age: {avg_age:.1f}")
        
    except Exception as e:
        logger.error(f"Error searching players: {e}")
        print(f"Error: {e}")


def update_data():
    """Update player database with latest data"""
    try:
        db = PlayerDatabase()
        
        print("🔄 Loading player data from CSV file...")
        
        # Load real player data from CSV
        csv_loader = CSVDataLoader()
        players = csv_loader.load_players_from_csv()
        
        if not players:
            print("❌ No player data loaded from CSV. Falling back to sample data...")
            # Fallback to sample data if CSV loading fails
            players = SampleDataGenerator.create_sample_players(200)
        
        success_count = 0
        for player in players:
            if db.add_player(player):
                success_count += 1
        
        print(f"✅ Successfully loaded {success_count} players")
        
        # Show updated stats
        stats = db.get_stats()
        print(f"📊 Database now contains {stats['total_players']} players")
        
    except Exception as e:
        logger.error(f"Error updating data: {e}")
        print(f"Error: {e}")


def show_stats(position: Optional[str]):
    """Show player statistics and market analysis"""
    try:
        db = PlayerDatabase()
        analyzer = PlayerAnalyzer(db)
        
        # Check if database has data
        general_stats = db.get_stats()
        if general_stats.get('total_players', 0) == 0:
            print("No player data found. Run 'python main.py update' first.")
            return
        
        print("📊 EA FC 25 Player Database Statistics\n")
        
        if position:
            # Position-specific analysis
            try:
                pos = Position(position.upper())
                market_analysis = analyzer.analyze_position_market(pos)
                
                if market_analysis:
                    print(f"🎯 {position.upper()} Position Analysis:")
                    print(f"   Total players: {market_analysis['total_players']}")
                    print(f"   Average rating: {market_analysis['rating_stats']['average']}")
                    print(f"   Average value: {format_currency(market_analysis['value_stats']['average'])}")
                    print(f"   Average age: {market_analysis['age_stats']['average']}")
                    
                    print("\n💰 Value by Rating Range:")
                    for rating_range, avg_value in market_analysis['avg_values_by_rating'].items():
                        print(f"   {rating_range}: {format_currency(int(avg_value))}")
                else:
                    print(f"No data found for position: {position}")
                    
            except ValueError:
                print(f"Invalid position: {position}")
                print(f"Valid positions: {', '.join([p.value for p in Position])}")
                return
        else:
            # General statistics
            print(f"🌍 General Statistics:")
            print(f"   Total players: {general_stats['total_players']}")
            print(f"   Average rating: {general_stats['average_rating']}")
            print(f"   Average value: {format_currency(general_stats['average_value'])}")
            print(f"   Average age: {general_stats['average_age']}")
            
            # Show position distribution
            positions = db.get_all_positions()
            print(f"\n📍 Available positions: {', '.join(positions)}")
            
            # Show young talents
            young_talents = analyzer.find_young_talents(max_age=21, min_potential=85)
            if young_talents:
                print(f"\n⭐ Top Young Talents (Under 21, 85+ Potential):")
                for i, player in enumerate(young_talents[:5], 1):
                    print(f"   {i}. {player.name} ({player.position.value}) - "
                          f"{player.overall_rating} OVR, {player.potential} POT, "
                          f"{format_currency(player.market_value)}")
            
            # Show best value players
            value_players = analyzer.find_best_value_players(max_budget=50_000_000)
            if value_players:
                print(f"\n💎 Best Value Players (Under €50M):")
                for i, (player, value_score) in enumerate(value_players[:5], 1):
                    print(f"   {i}. {player.name} ({player.position.value}) - "
                          f"{player.overall_rating} OVR, {format_currency(player.market_value)} "
                          f"(Score: {value_score:.1f})")
        
    except Exception as e:
        logger.error(f"Error showing stats: {e}")
        print(f"Error: {e}")


def _populate_sample_data(db: PlayerDatabase):
    """Populate database with real CSV data or sample data as fallback"""
    print("Loading player data...")
    
    # Try to load from CSV first
    csv_loader = CSVDataLoader()
    players = csv_loader.load_players_from_csv(limit=100)
    
    if not players:
        print("CSV loading failed, generating sample data...")
        players = SampleDataGenerator.create_sample_players(100)
    
    for player in players:
        db.add_player(player)
    
    print(f"✅ Added {len(players)} players to database")
