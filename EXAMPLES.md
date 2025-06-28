# EA FC 25 Career Mode Manager - Usage Examples

This document showcases how to use the EA FC 25 Player Manager with **real player data** from the 2025 June dataset containing **18,166 actual EA FC 25 players**.

## Database Information

The system loads real player data from `dataset/player-data-full-2025-june.csv` containing official EA FC 25 ratings, market values, and player attributes.

## Getting Started

1. **Update the database** (load real player data):
   ```bash
   python main.py update
   ```

2. **Search for players** based on your needs:
   ```bash
   python main.py search --help
   ```

3. **View statistics** and market analysis:
   ```bash
   python main.py stats
   ```

## Common Use Cases

### 1. Finding the Best Strikers
```bash
# Find the best strikers overall
python main.py search --position ST --min-rating 85 --limit 10
```

**Real Results from EA FC 25 Data:**
- Kylian Mbappé (Real Madrid) - 90 OVR, €160.0M
- Erling Haaland (Manchester City) - 90 OVR, €157.0M  
- Harry Kane (FC Bayern München) - 90 OVR, €117.5M
- Robert Lewandowski (FC Barcelona) - 89 OVR, €44.0M
python main.py search --position ST --limit 10

# Find affordable strikers under €30M
python main.py search --position ST --max-price 30000000

# Find young striker prospects
python main.py search --position ST --max-age 23 --min-potential 85
```

### 2. Building on a Budget
```bash
# Find quality players under €20M
python main.py search --max-price 20000000 --min-rating 80

# Find good value players (high rating, reasonable price)
python main.py search --max-price 50000000 --min-rating 85
```

### 3. Youth Development
```bash
# Find the best young talents
python main.py search --max-age 21 --min-potential 85

# Find promising teenagers
python main.py search --max-age 18 --min-potential 80
```

### 4. Position-Specific Analysis
```bash
# Analyze the goalkeeper market
python main.py stats --position GK

# Analyze center-back market
python main.py stats --position CB

# General market overview
python main.py stats
```

### 5. Age-Based Searches
```bash
# Find experienced players (28+) for immediate impact
python main.py search --min-age 28 --min-rating 85

# Find players in their prime (24-28)
python main.py search --min-age 24 --max-age 28 --min-rating 82
```

## Advanced Search Examples

### Transfer Window Planning
```bash
# High-end signings (€100M+ budget)
python main.py search --min-price 100000000 --min-rating 90

# Squad depth signings (€10-30M range)
python main.py search --min-price 10000000 --max-price 30000000 --min-rating 78
```

### Position-Specific Needs
```bash
# Creative midfielders
python main.py search --position CAM --min-rating 82

# Defensive midfielders
python main.py search --position CDM --min-rating 80

# Wing-backs for modern formations
python main.py search --position RWB --min-rating 75
python main.py search --position LWB --min-rating 75
```

## Sample Output Interpretation

When you run a search, you'll see:

- **Name**: Player's full name
- **Age**: Current age (important for growth potential)
- **Pos**: Position (GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, CF, ST)
- **Rating**: Current overall rating (40-99)
- **Potential**: Maximum possible rating the player can reach
- **Value**: Current market value in euros
- **Club**: Current club (or "Free Agent")

### Understanding the Data

- **Young Talents**: Players under 23 with potential 80+
- **Growth Potential**: Difference between potential and current rating
- **Value Score**: Rating per million euros spent (higher = better value)
- **Contract Status**: How long until contract expires (good for free transfers)

## Tips for Career Mode

1. **Youth Investment**: Focus on players under 21 with high potential
2. **Value Signings**: Look for older players with good ratings but lower prices
3. **Position Needs**: Use position-specific stats to understand market prices
4. **Contract Timing**: Monitor contract expiries for potential free transfers
5. **Balanced Squad**: Mix experienced players with young prospects

## Troubleshooting

- If you see "No players found", try relaxing your criteria (lower minimum rating, increase budget, etc.)
- The sample data is generated randomly, so player names and combinations might be unrealistic
- Market values are simulated and may not reflect actual EA FC 25 values

## Future Enhancements

This tool could be extended to include:
- Real player data from EA Sports
- Historical price tracking
- Team chemistry calculations
- Formation-specific recommendations
- Contract negotiation helpers
