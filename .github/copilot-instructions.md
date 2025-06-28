<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# EA FC 25 Career Mode Manager - Copilot Instructions

This is a Python project for managing EA FC 25 career mode data. When working on this project:

## Project Context
- This is a career mode management tool for EA FC 25 (FIFA)
- Focus on player data analysis, market values, and team building
- Use football/soccer terminology and concepts
- Player attributes follow FIFA/EA FC standards (pace, shooting, passing, dribbling, defending, physical)

## Code Style & Patterns
- Use Python 3.8+ features and type hints
- Follow PEP 8 style guidelines
- Use Pydantic for data models and validation
- Implement proper error handling and logging
- Use pandas for data analysis and manipulation
- Structure code with clear separation of concerns

## Data Handling
- Player data should include: name, position, age, overall rating, potential, market value, attributes
- Use SQLite for local data storage
- Implement caching for expensive operations
- Handle both current and historical player data

## Domain-Specific Guidelines
- Use standard football positions (GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, CF, ST)
- Market values should be in euros (€)
- Age calculations should be precise to career mode timelines
- Consider player growth potential and decline curves

## Testing & Quality
- Write unit tests for core functionality
- Use meaningful variable names related to football concepts
- Add docstrings explaining football-specific logic
- Validate data integrity for player statistics
