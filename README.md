# EA FC 25 Career Mode Player Manager

A modern interactive React CLI application built with Node.js and TypeScript for managing EA FC 25 career mode data. Features advanced player search, market analysis, and comprehensive team building tools using real EA FC 25 player data.

## Screenshots

![alt text](image.png)

![alt text](image-1.png)

![alt text](image-2.png)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the interactive React CLI
npm start
```

## ✨ Features

### 🔍 Advanced Search & Filtering
- **Advanced Player Search**: Multi-criteria filtering (position, rating, age, market value, nationality)
- **Quick Search Presets**: Top players (90+), young talents (U21), best value deals
- **Position-Specific Search**: Best strikers, top goalkeepers, elite midfielders
- **League Filtering**: Find players by specific leagues
- **🌍 Continent Filtering**: Search by continent (Europe, Asia, Africa, Americas, Oceania)

### 📊 Analytics & Intelligence
- **Database Statistics**: Complete overview of player database
- **Position Analysis**: Detailed breakdown by player positions
- **Market Intelligence**: Identify undervalued players and market opportunities
- **Player Comparisons**: Side-by-side player attribute analysis

### 🎯 Career Mode Tools
- **Real EA FC 25 Data**: 18,000+ authentic player profiles
- **Live Database Updates**: Refresh with latest player data from CSV
- **Interactive Navigation**: Intuitive keyboard-driven interface
- **Detailed Player Profiles**: Complete stats, attributes, and contract information

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- SQLite3 (for database operations)

### Setup
1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd ea-fc25-career-poc
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Run the interactive CLI:
   ```bash
   npm start
   ```

## 💻 Usage

### Interactive React CLI Menu
The main interface provides comprehensive options:

- **🔍 Advanced Player Search**: Custom multi-filter search
- **⚡ Quick Search (Top Players)**: Find 90+ rated elite players
- **🌟 Young Talents (U21)**: High-potential prospects under 21
- **💎 Best Value Players**: Market bargains and undervalued gems
- **⚽ Best Strikers**: Top attacking players by position
- **🥅 Top Goalkeepers**: Elite goalkeeper options
- **🏆 Best Players by League**: Filter by specific leagues
- **🌍 Best Players by Continent**: Continental player filtering
- **📊 Database Statistics**: Complete database overview
- **📍 Position Analysis**: Player distribution by positions
- **🔄 Update Database**: Refresh data from CSV file

### Example Use Cases
- **Scout Asian Players**: Use Continent filter → Select Asia
- **Find World-Class Strikers**: Quick Search → Best Strikers
- **Discover Young Talent**: Young Talents for players under 21 with high potential
- **Market Bargains**: Best Value Players for transfer deals
- **League-Specific Search**: Filter by Premier League, La Liga, etc.
- **Custom Criteria**: Advanced Search for specific requirements

## 🏗️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **CLI Framework**: React with Ink for interactive terminal UI
- **Database**: SQLite3 for local data storage
- **Data Processing**: CSV parsing and JSON handling
- **Build Tool**: TSX for TypeScript execution

## 📁 Project Structure

```
src/
├── AdvancedApp.tsx     # Main React CLI application with all features
├── SimpleApp.tsx       # Simplified CLI version
├── database.ts         # SQLite database operations and CSV loading
├── types.ts           # TypeScript interfaces and data models
└── index.tsx          # CLI entry point

dataset/
└── player-data-full-2025-june.csv  # EA FC 25 player data (18,000+ players)

data/
└── players.db         # SQLite database (auto-generated)
```

## ⚙️ Data Management

### Player Data Structure
- **Core Info**: Name, age, nationality, club, league, position
- **Ratings**: Overall rating, potential, market value, wage
- **Attributes**: Pace, shooting, passing, dribbling, defending, physical
- **Contract**: Expiry date, release clause information
- **Metadata**: Last updated timestamp

### Database Operations
- **Automatic CSV Import**: Loads player data on first run
- **Incremental Updates**: Refresh data without losing custom configurations  
- **Efficient Querying**: Optimized searches with proper indexing
- **Data Validation**: Ensures data integrity and type safety

## 🌐 Continent & League Support

### Supported Continents
- **Europe**: 35+ countries including major football nations
- **Asia**: 25+ countries (Japan, South Korea, China, India, etc.)
- **Africa**: 15+ countries including top football nations
- **South America**: All CONMEBOL nations
- **North America**: CONCACAF nations
- **Oceania**: Australia, New Zealand, Pacific islands

### Major Leagues
Supports filtering by all major leagues present in the dataset including Premier League, La Liga, Serie A, Bundesliga, Ligue 1, and many more.

## 🤝 Contributing

This is a personal project for EA FC 25 career mode management. Feel free to fork and customize for your own needs!

### Development
```bash
# Run in development mode
npm run dev

# Build the project
npm run build

# Run tests (when available)
npm test
```
