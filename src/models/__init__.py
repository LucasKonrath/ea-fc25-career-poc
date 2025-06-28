"""
Data models for EA FC 25 player management system.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, validator


class Position(str, Enum):
    """Standard football positions"""
    GK = "GK"
    CB = "CB" 
    LB = "LB"
    RB = "RB"
    LWB = "LWB"
    RWB = "RWB"
    CDM = "CDM"
    CM = "CM"
    CAM = "CAM"
    LM = "LM"
    RM = "RM"
    LW = "LW"
    RW = "RW"
    CF = "CF"
    ST = "ST"


class PlayerAttributes(BaseModel):
    """Player attribute ratings (0-99)"""
    pace: int = Field(ge=0, le=99)
    shooting: int = Field(ge=0, le=99) 
    passing: int = Field(ge=0, le=99)
    dribbling: int = Field(ge=0, le=99)
    defending: int = Field(ge=0, le=99)
    physical: int = Field(ge=0, le=99)
    
    @validator('*')
    def validate_rating(cls, v):
        if not 0 <= v <= 99:
            raise ValueError('Attribute must be between 0 and 99')
        return v


class Player(BaseModel):
    """EA FC 25 Player model"""
    id: int
    name: str
    age: int = Field(ge=16, le=45)
    nationality: str
    club: Optional[str] = None
    league: Optional[str] = None
    position: Position
    preferred_foot: str = Field(default="Right")
    
    # Ratings
    overall_rating: int = Field(ge=40, le=99)
    potential: int = Field(ge=40, le=99)
    
    # Market data
    market_value: int = Field(ge=0, description="Market value in euros")
    wage: Optional[int] = Field(ge=0, description="Weekly wage in euros")
    release_clause: Optional[int] = Field(ge=0, description="Release clause in euros")
    
    # Attributes
    attributes: PlayerAttributes
    
    # Contract info
    contract_expiry: Optional[datetime] = None
    
    # Meta
    last_updated: datetime = Field(default_factory=datetime.now)
    
    @validator('potential')
    def potential_must_be_ge_overall(cls, v, values):
        if 'overall_rating' in values and v < values['overall_rating']:
            raise ValueError('Potential must be greater than or equal to overall rating')
        return v
    
    def growth_potential(self) -> int:
        """Calculate growth potential"""
        return self.potential - self.overall_rating
    
    def is_young_talent(self) -> bool:
        """Check if player is a young talent (under 23 with high potential)"""
        return self.age < 23 and self.potential >= 80
    
    def value_per_rating(self) -> float:
        """Calculate market value per overall rating point"""
        return self.market_value / self.overall_rating if self.overall_rating > 0 else 0
    
    def contract_status(self) -> str:
        """Get contract status"""
        if not self.contract_expiry:
            return "Unknown"
        
        months_left = (self.contract_expiry - datetime.now()).days / 30
        
        if months_left <= 6:
            return "Expiring Soon"
        elif months_left <= 12:
            return "Last Year"
        else:
            return "Under Contract"


class Team(BaseModel):
    """Football team/club model"""
    id: int
    name: str
    league: str
    country: str
    overall_rating: Optional[int] = Field(ge=0, le=99)
    budget: Optional[int] = Field(ge=0, description="Transfer budget in euros")
    
    
class SearchCriteria(BaseModel):
    """Search criteria for finding players"""
    position: Optional[Position] = None
    min_overall: int = Field(default=75, ge=40, le=99)
    max_overall: Optional[int] = Field(default=None, ge=40, le=99)
    min_potential: Optional[int] = Field(default=None, ge=40, le=99)
    max_age: Optional[int] = Field(default=None, ge=16, le=45)
    min_age: Optional[int] = Field(default=None, ge=16, le=45)
    max_price: Optional[int] = Field(default=None, ge=0)
    min_price: Optional[int] = Field(default=None, ge=0)
    nationality: Optional[str] = None
    league: Optional[str] = None
    preferred_foot: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=100)
    
    @validator('max_overall')
    def max_overall_must_be_ge_min(cls, v, values):
        if v is not None and 'min_overall' in values and v < values['min_overall']:
            raise ValueError('Max overall must be greater than or equal to min overall')
        return v
