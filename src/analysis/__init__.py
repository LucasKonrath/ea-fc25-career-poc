"""
Player analysis and market evaluation tools.
"""

import logging
import sys
import os
from typing import List, Dict, Any, Optional, Tuple
from statistics import mean, median
from collections import defaultdict

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.models import Player, Position, SearchCriteria
from src.data import PlayerDatabase


logger = logging.getLogger(__name__)


class PlayerAnalyzer:
    """Analyze player data and provide insights"""
    
    def __init__(self, database: PlayerDatabase):
        self.db = database
    
    def find_best_value_players(self, position: Optional[Position] = None, 
                              max_budget: Optional[int] = None) -> List[Tuple[Player, float]]:
        """Find players with the best value for money"""
        criteria = SearchCriteria(
            position=position,
            max_price=max_budget,
            limit=50
        )
        
        players = self.db.search_players(criteria)
        
        # Calculate value score (rating per million euros) and return tuples
        value_players = []
        for player in players:
            if player.market_value > 0:
                value_score = (player.overall_rating * 1000000) / player.market_value
                value_players.append((player, value_score))
            else:
                value_players.append((player, 0))
        
        # Sort by value score
        return sorted(value_players, key=lambda x: x[1], reverse=True)
    
    def find_young_talents(self, max_age: int = 21, min_potential: int = 80) -> List[Player]:
        """Find promising young players"""
        criteria = SearchCriteria(
            max_age=max_age,
            min_potential=min_potential,
            limit=50
        )
        
        players = self.db.search_players(criteria)
        
        # Sort by potential and growth potential
        return sorted(players, 
                     key=lambda p: (p.potential, p.growth_potential()), 
                     reverse=True)
    
    def analyze_position_market(self, position: Position) -> Dict[str, Any]:
        """Analyze market trends for a specific position"""
        criteria = SearchCriteria(position=position, limit=100)
        players = self.db.search_players(criteria)
        
        if not players:
            return {}
        
        ratings = [p.overall_rating for p in players]
        values = [p.market_value for p in players]
        ages = [p.age for p in players]
        
        # Group by rating ranges
        rating_groups = defaultdict(list)
        for player in players:
            rating_range = f"{(player.overall_rating // 5) * 5}-{(player.overall_rating // 5) * 5 + 4}"
            rating_groups[rating_range].append(player.market_value)
        
        avg_values_by_rating = {
            rating: mean(values) for rating, values in rating_groups.items()
        }
        
        return {
            'position': position.value,
            'total_players': len(players),
            'rating_stats': {
                'average': round(mean(ratings), 1),
                'median': median(ratings),
                'min': min(ratings),
                'max': max(ratings)
            },
            'value_stats': {
                'average': int(mean(values)),
                'median': int(median(values)),
                'min': min(values),
                'max': max(values)
            },
            'age_stats': {
                'average': round(mean(ages), 1),
                'median': median(ages),
                'min': min(ages),
                'max': max(ages)
            },
            'avg_values_by_rating': avg_values_by_rating
        }
    
    def find_expiring_contracts(self, months_threshold: int = 12) -> List[Player]:
        """Find players with expiring contracts (potential free transfers)"""
        from datetime import datetime, timedelta
        
        criteria = SearchCriteria(limit=100)
        all_players = self.db.search_players(criteria)
        
        threshold_date = datetime.now() + timedelta(days=months_threshold * 30)
        
        expiring_players = []
        for player in all_players:
            if player.contract_expiry and player.contract_expiry <= threshold_date:
                expiring_players.append(player)
        
        # Sort by overall rating
        return sorted(expiring_players, key=lambda p: p.overall_rating, reverse=True)
    
    def compare_players(self, player_ids: List[int]) -> Dict[str, Any]:
        """Compare multiple players side by side"""
        players = []
        for pid in player_ids:
            player = self.db.get_player(pid)
            if player:
                players.append(player)
        
        if len(players) < 2:
            return {'error': 'Need at least 2 players to compare'}
        
        comparison = {
            'players': [],
            'winner_per_attribute': {}
        }
        
        # Collect player data
        for player in players:
            comparison['players'].append({
                'id': player.id,
                'name': player.name,
                'age': player.age,
                'position': player.position.value,
                'overall_rating': player.overall_rating,
                'potential': player.potential,
                'market_value': player.market_value,
                'attributes': player.attributes.dict(),
                'value_per_rating': player.value_per_rating()
            })
        
        # Find winner for each attribute
        attributes = ['overall_rating', 'potential', 'pace', 'shooting', 'passing', 
                     'dribbling', 'defending', 'physical']
        
        for attr in attributes:
            if attr in ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical']:
                values = [getattr(p.attributes, attr) for p in players]
            else:
                values = [getattr(p, attr) for p in players]
            
            max_value = max(values)
            winners = [players[i].name for i, v in enumerate(values) if v == max_value]
            comparison['winner_per_attribute'][attr] = {
                'value': max_value,
                'winners': winners
            }
        
        return comparison
    
    def suggest_team_improvements(self, current_squad_ids: List[int], 
                                budget: int, formation: str = "4-3-3") -> Dict[str, Any]:
        """Suggest improvements for a team based on current squad and budget"""
        # This is a simplified version - in a real implementation, this would be much more complex
        current_squad = []
        for pid in current_squad_ids:
            player = self.db.get_player(pid)
            if player:
                current_squad.append(player)
        
        if not current_squad:
            return {'error': 'No valid players in current squad'}
        
        # Analyze squad strengths and weaknesses
        position_ratings = defaultdict(list)
        for player in current_squad:
            position_ratings[player.position].append(player.overall_rating)
        
        avg_ratings_by_position = {
            pos: mean(ratings) for pos, ratings in position_ratings.items()
        }
        
        # Find weakest positions
        weakest_positions = sorted(avg_ratings_by_position.items(), 
                                 key=lambda x: x[1])
        
        suggestions = []
        remaining_budget = budget
        
        for position, avg_rating in weakest_positions[:3]:  # Top 3 weakest positions
            # Find better players for this position within budget
            criteria = SearchCriteria(
                position=position,
                min_overall=int(avg_rating) + 5,  # Look for significant improvement
                max_price=remaining_budget,
                limit=5
            )
            
            candidates = self.db.search_players(criteria)
            if candidates:
                best_candidate = candidates[0]
                suggestions.append({
                    'position': position.value,
                    'current_avg_rating': round(avg_rating, 1),
                    'suggested_player': {
                        'name': best_candidate.name,
                        'rating': best_candidate.overall_rating,
                        'price': best_candidate.market_value,
                        'improvement': best_candidate.overall_rating - avg_rating
                    }
                })
                remaining_budget -= best_candidate.market_value
        
        return {
            'budget': budget,
            'squad_analysis': avg_ratings_by_position,
            'suggestions': suggestions,
            'remaining_budget': remaining_budget
        }
