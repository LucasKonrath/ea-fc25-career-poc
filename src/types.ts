export enum Position {
  GK = 'GK',
  CB = 'CB', 
  LB = 'LB',
  RB = 'RB',
  LWB = 'LWB',
  RWB = 'RWB',
  CDM = 'CDM',
  CM = 'CM',
  CAM = 'CAM',
  LM = 'LM',
  RM = 'RM',
  LW = 'LW',
  RW = 'RW',
  CF = 'CF',
  ST = 'ST'
}

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface Player {
  id: number;
  name: string;
  age: number;
  nationality: string;
  club?: string;
  league?: string;
  position: Position;
  preferredFoot: string;
  overallRating: number;
  potential: number;
  marketValue: number;
  wage?: number;
  releaseClause?: number;
  attributes: PlayerAttributes;
  contractExpiry?: Date;
  lastUpdated: Date;
}

export interface SearchCriteria {
  position?: Position;
  minOverall?: number;
  maxAge?: number;
  maxPrice?: number;
  minPotential?: number;
  nationality?: string;
  league?: string;
  club?: string;
}

export interface DatabaseStats {
  totalPlayers: number;
  averageRating: number;
  averageValue: number;
  averageAge: number;
  positionCounts: Record<Position, number>;
}
