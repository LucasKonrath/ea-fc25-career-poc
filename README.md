# EA FC 25 Career Mode Player Manager

A Python-based system to help manage your EA FC 25 career mode by tracking player data, market values, and finding the best players for your team.

## Features

- **Player Database Management**: Track player statistics, positions, ages, and attributes
- **Market Analysis**: Monitor player prices and market trends
- **Best Player Search**: Find the best players based on various criteria (position, budget, age, etc.)
- **Career Mode Tools**: Helpful utilities for managing your career mode progression

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Basic Usage
```bash
python main.py --help
```

### Find Best Players
```bash
# Find best strikers under 25 years old
python main.py search --position ST --max-age 25

# Find best players under 50M budget
python main.py search --max-price 50000000

# Find best young talents
python main.py search --max-age 21 --min-potential 85
```

### Update Player Data
```bash
python main.py update-data
```

## Project Structure

```
ea-fc25-career-poc/
├── src/
│   ├── models/           # Data models for players, teams, etc.
│   ├── data/            # Data handling and storage
│   ├── analysis/        # Market analysis and player evaluation
│   └── cli/             # Command-line interface
├── data/                # Player databases and cache files
├── config/              # Configuration files
└── tests/               # Unit tests
```

## Configuration

Create a `.env` file in the root directory to configure the application:

```env
# API Configuration (if using external data sources)
FUTBIN_API_KEY=your_api_key_here

# Database Configuration
DATABASE_PATH=data/players.db

# Cache Settings
CACHE_DURATION_HOURS=24
```

## Contributing

This is a personal project for career mode management. Feel free to fork and customize for your own needs!
