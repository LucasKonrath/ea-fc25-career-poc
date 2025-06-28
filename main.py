#!/usr/bin/env python3
"""
EA FC 25 Career Mode Player Manager

Main entry point for the player management system.
"""

import click
import logging
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Add the project root to the Python path
sys.path.append(os.path.dirname(__file__))

from src.cli import search_players, update_data, show_stats


# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


@click.group()
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')
def cli(verbose):
    """EA FC 25 Career Mode Player Manager"""
    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)


@cli.command()
@click.option('--position', '-p', help='Filter by position (e.g., ST, CM, CB)')
@click.option('--max-price', type=int, help='Maximum price in euros')
@click.option('--min-rating', type=int, default=75, help='Minimum overall rating')
@click.option('--max-age', type=int, help='Maximum age')
@click.option('--min-potential', type=int, help='Minimum potential rating')
@click.option('--limit', type=int, default=20, help='Number of results to show')
def search(position, max_price, min_rating, max_age, min_potential, limit):
    """Search for the best players based on criteria"""
    search_players(position, max_price, min_rating, max_age, min_potential, limit)


@cli.command()
def update():
    """Update player database with latest data"""
    update_data()


@cli.command()
@click.option('--position', '-p', help='Show stats for specific position')
def stats(position):
    """Show player statistics and market analysis"""
    show_stats(position)


if __name__ == '__main__':
    cli()
