import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import chalk from 'chalk';

import { PlayerDatabase, CSVDataLoader, formatCurrency } from './database.js';
import { Player, Position, SearchCriteria, DatabaseStats } from './types.js';

const Loading: React.FC<{ message: string }> = ({ message }) => (
  <Box flexDirection="column" alignItems="center">
    <Box marginBottom={1}>
      <Text color="cyan">⠋ {message}</Text>
    </Box>
  </Box>
);

const MainMenu: React.FC<{ onSelect: (action: string) => void }> = ({ onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const options = [
    { key: 'search', label: '🔍 Advanced Player Search' },
    { key: 'quickSearch', label: '⚡ Quick Search (Top Players)' },
    { key: 'youngTalents', label: '🌟 Young Talents (U21)' },
    { key: 'valuePlayers', label: '💎 Best Value Players' },
    { key: 'strikers', label: '⚽ Best Strikers' },
    { key: 'goalkeepers', label: '🥅 Top Goalkeepers' },
    { key: 'stats', label: '📊 Database Statistics' },
    { key: 'positionStats', label: '📍 Position Analysis' },
    { key: 'update', label: '🔄 Update Database' },
    { key: 'exit', label: '❌ Exit' }
  ];

  useInput((input, key) => {
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (key.downArrow && selectedIndex < options.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else if (key.return) {
      onSelect(options[selectedIndex].key);
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">⚽ EA FC 25 Career Mode Player Manager</Text>
      </Box>
      <Box borderStyle="round" padding={1}>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color="white" bold>Select an option (↑↓ to navigate, Enter to select):</Text>
          </Box>
          {options.map((option, index) => (
            <Box key={option.key}>
              <Text color={index === selectedIndex ? 'black' : 'white'} 
                    backgroundColor={index === selectedIndex ? 'cyan' : undefined}>
                {index === selectedIndex ? '► ' : '  '}{option.label}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const AdvancedSearchForm: React.FC<{ onSearch: (criteria: SearchCriteria) => void; onBack: () => void }> = ({ onSearch, onBack }) => {
  const [step, setStep] = useState('position');
  const [criteria, setCriteria] = useState<SearchCriteria>({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');

  const positions = [
    { label: 'Any Position', value: undefined },
    ...Object.values(Position).map(pos => ({ label: pos, value: pos }))
  ];

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    } else if (step === 'position') {
      if (key.upArrow && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      } else if (key.downArrow && selectedIndex < positions.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      } else if (key.return) {
        const selectedPosition = positions[selectedIndex];
        setCriteria({ ...criteria, position: selectedPosition.value });
        setStep('minRating');
        setSelectedIndex(0);
      }
    } else if (key.return) {
      handleInputSubmit();
    } else if (step !== 'position') {
      if (key.backspace) {
        setInputValue(inputValue.slice(0, -1));
      } else if (input && input.length === 1 && /[0-9]/.test(input)) {
        setInputValue(inputValue + input);
      } else if (input && ['M', 'K', 'm', 'k'].includes(input)) {
        setInputValue(inputValue + input.toUpperCase());
      }
    }
  });

  const handleInputSubmit = () => {
    if (step === 'minRating') {
      const rating = parseInt(inputValue) || undefined;
      setCriteria({ ...criteria, minOverall: rating });
      setStep('maxAge');
      setInputValue('');
    } else if (step === 'maxAge') {
      const age = parseInt(inputValue) || undefined;
      setCriteria({ ...criteria, maxAge: age });
      setStep('maxPrice');
      setInputValue('');
    } else if (step === 'maxPrice') {
      let price: number | undefined;
      if (inputValue) {
        const cleanValue = inputValue.toUpperCase().replace('€', '').replace(',', '');
        if (cleanValue.includes('M')) {
          price = parseFloat(cleanValue.replace('M', '')) * 1_000_000;
        } else if (cleanValue.includes('K')) {
          price = parseFloat(cleanValue.replace('K', '')) * 1_000;
        } else {
          price = parseFloat(cleanValue);
        }
      }
      const finalCriteria = { ...criteria, maxPrice: price };
      onSearch(finalCriteria);
    }
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">🔍 Advanced Player Search</Text>
      </Box>
      
      <Box borderStyle="round" padding={1}>
        <Box flexDirection="column">
          {step === 'position' && (
            <>
              <Box marginBottom={1}>
                <Text color="white">Select position (↑↓ to navigate, Enter to select):</Text>
              </Box>
              {positions.map((position, index) => (
                <Box key={position.label}>
                  <Text color={index === selectedIndex ? 'black' : 'white'} 
                        backgroundColor={index === selectedIndex ? 'cyan' : undefined}>
                    {index === selectedIndex ? '► ' : '  '}{position.label}
                  </Text>
                </Box>
              ))}
            </>
          )}
          
          {step === 'minRating' && (
            <>
              <Box marginBottom={1}>
                <Text color="white">Minimum overall rating (type number, Enter to confirm):</Text>
              </Box>
              <Text>
                <Text color="cyan">Rating: </Text>
                <Text bold>{inputValue || '(any)'}</Text>
              </Text>
              <Box marginTop={1}>
                <Text color="gray">Examples: 85, 90 (leave empty for any)</Text>
              </Box>
            </>
          )}
          
          {step === 'maxAge' && (
            <>
              <Box marginBottom={1}>
                <Text color="white">Maximum age (type number, Enter to confirm):</Text>
              </Box>
              <Text>
                <Text color="cyan">Max Age: </Text>
                <Text bold>{inputValue || '(any)'}</Text>
              </Text>
              <Box marginTop={1}>
                <Text color="gray">Examples: 25, 30 (leave empty for any)</Text>
              </Box>
            </>
          )}
          
          {step === 'maxPrice' && (
            <>
              <Box marginBottom={1}>
                <Text color="white">Maximum price (type amount, Enter to search):</Text>
              </Box>
              <Text>
                <Text color="cyan">Max Price: </Text>
                <Text bold>{inputValue || '(any)'}</Text>
              </Text>
              <Box marginTop={1}>
                <Text color="gray">Examples: 100M, 50K, 25000000 (leave empty for any)</Text>
              </Box>
            </>
          )}
        </Box>
      </Box>
      
      <Box marginTop={1}>
        <Text color="gray">Press ESC to go back</Text>
      </Box>
    </Box>
  );
};

const PlayerList: React.FC<{ players: Player[]; onBack: () => void; title?: string }> = ({ players, onBack, title = "Search Results" }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onBack();
    } else if (input === 'd' && players.length > 0) {
      setViewMode(viewMode === 'list' ? 'details' : 'list');
    } else if (viewMode === 'list') {
      if (key.upArrow && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1);
      } else if (key.downArrow && selectedIndex < Math.min(players.length - 1, 14)) {
        setSelectedIndex(selectedIndex + 1);
      }
    }
  });

  const totalValue = players.reduce((sum, p) => sum + p.marketValue, 0);
  const avgRating = players.length > 0 
    ? players.reduce((sum, p) => sum + p.overallRating, 0) / players.length 
    : 0;
  const avgAge = players.length > 0 
    ? players.reduce((sum, p) => sum + p.age, 0) / players.length 
    : 0;

  const displayedPlayers = players.slice(0, 15);
  const selectedPlayer = displayedPlayers[selectedIndex];

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">🏆 {title} ({players.length} players)</Text>
      </Box>
      
      {players.length === 0 ? (
        <Box borderStyle="round" padding={1}>
          <Text color="red">No players found matching your criteria.</Text>
        </Box>
      ) : (
        <>
          {viewMode === 'list' ? (
            <Box borderStyle="round" padding={1} marginBottom={1}>
              <Box flexDirection="column">
                {displayedPlayers.map((player, index) => (
                  <Box key={player.id}>
                    <Text color={index === selectedIndex ? 'white' : 'white'} 
                          backgroundColor={index === selectedIndex ? 'blue' : undefined}>
                      <Text color="gray">{index + 1}. </Text>
                      <Text bold>{player.name.slice(0, 25)} </Text>
                      <Text color="cyan">({player.age}y {player.position}) </Text>
                      <Text color="green">{player.overallRating} OVR </Text>
                      <Text color="cyan">{player.potential} POT </Text>
                      <Text color="magenta">{formatCurrency(player.marketValue)} </Text>
                      <Text color="gray">{player.club || 'Free Agent'}</Text>
                    </Text>
                  </Box>
                ))}
                {players.length > 15 && (
                  <Box marginTop={1}>
                    <Text color="gray">... and {players.length - 15} more players</Text>
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            selectedPlayer && (
              <Box borderStyle="round" padding={1} marginBottom={1}>
                <Box flexDirection="column">
                  <Box marginBottom={1}>
                    <Text bold color="cyan">📋 Player Details</Text>
                  </Box>
                  <Text><Text color="cyan">Name:</Text> {selectedPlayer.name}</Text>
                  <Text><Text color="cyan">Position:</Text> {selectedPlayer.position} | <Text color="cyan">Age:</Text> {selectedPlayer.age}</Text>
                  <Text><Text color="cyan">Club:</Text> {selectedPlayer.club || 'Free Agent'}</Text>
                  <Text><Text color="cyan">League:</Text> {selectedPlayer.league || 'Unknown'}</Text>
                  <Text><Text color="cyan">Nationality:</Text> {selectedPlayer.nationality}</Text>
                  <Text><Text color="cyan">Preferred Foot:</Text> {selectedPlayer.preferredFoot}</Text>
                  <Box marginTop={1} marginBottom={1}>
                    <Text bold color="green">📊 Ratings</Text>
                  </Box>
                  <Text><Text color="cyan">Overall:</Text> {selectedPlayer.overallRating} | <Text color="cyan">Potential:</Text> {selectedPlayer.potential}</Text>
                  <Box marginTop={1} marginBottom={1}>
                    <Text bold color="magenta">💰 Market Info</Text>
                  </Box>
                  <Text><Text color="cyan">Market Value:</Text> {formatCurrency(selectedPlayer.marketValue)}</Text>
                  {selectedPlayer.wage && <Text><Text color="cyan">Wage:</Text> {formatCurrency(selectedPlayer.wage)}</Text>}
                  {selectedPlayer.releaseClause && <Text><Text color="cyan">Release Clause:</Text> {formatCurrency(selectedPlayer.releaseClause)}</Text>}
                  {/* Only show attributes if they have meaningful data (not all zeros or all same values) */}
                  {(() => {
                    const attrs = selectedPlayer.attributes;
                    const values = [attrs.pace, attrs.shooting, attrs.passing, attrs.dribbling, attrs.defending, attrs.physical];
                    const hasZeros = values.every(v => v === 0);
                    const allSame = values.every(v => v === values[0]);
                    const hasRealData = !hasZeros && !allSame && values.some(v => v > 0 && v < 99);
                    
                    return hasRealData ? (
                      <>
                        <Box marginTop={1} marginBottom={1}>
                          <Text bold color="cyan">⚽ Attributes</Text>
                        </Box>
                        <Text><Text color="cyan">Pace:</Text> {attrs.pace} | <Text color="cyan">Shooting:</Text> {attrs.shooting} | <Text color="cyan">Passing:</Text> {attrs.passing}</Text>
                        <Text><Text color="cyan">Dribbling:</Text> {attrs.dribbling} | <Text color="cyan">Defending:</Text> {attrs.defending} | <Text color="cyan">Physical:</Text> {attrs.physical}</Text>
                      </>
                    ) : (
                      <>
                        <Box marginTop={1} marginBottom={1}>
                          <Text bold color="gray">⚽ Attributes</Text>
                        </Box>
                        <Text color="gray">Detailed attribute data not available in dataset</Text>
                      </>
                    );
                  })()}
                </Box>
              </Box>
            )
          )}
          
          <Box borderStyle="round" padding={1}>
            <Box flexDirection="column">
              <Text bold color="cyan">📊 Summary:</Text>
              <Text>💰 Total value: <Text color="magenta">{formatCurrency(totalValue)}</Text></Text>
              <Text>⭐ Average rating: <Text color="green">{avgRating.toFixed(1)}</Text></Text>
              <Text>👶 Average age: <Text color="cyan">{avgAge.toFixed(1)}</Text></Text>
            </Box>
          </Box>
        </>
      )}
      
      <Box marginTop={1}>
        <Text color="gray">
          {viewMode === 'list' ? '↑↓ to navigate | ' : ''}Press 'd' for {viewMode === 'list' ? 'details' : 'list'} | ESC or 'q' to go back
        </Text>
      </Box>
    </Box>
  );
};

const StatsView: React.FC<{ stats: DatabaseStats; onBack: () => void }> = ({ stats, onBack }) => {
  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">📊 Database Statistics</Text>
      </Box>
      
      <Box borderStyle="round" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color="white">🌍 General Statistics:</Text>
          </Box>
          <Text>👥 Total players: <Text color="cyan" bold>{stats.totalPlayers.toLocaleString()}</Text></Text>
          <Text>⭐ Average rating: <Text color="green" bold>{stats.averageRating}</Text></Text>
          <Text>💰 Average value: <Text color="magenta" bold>{formatCurrency(stats.averageValue)}</Text></Text>
          <Text>👶 Average age: <Text color="cyan" bold>{stats.averageAge}</Text></Text>
        </Box>
      </Box>
      
      <Box borderStyle="round" padding={1}>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color="white">📍 Players by Position:</Text>
          </Box>
          {Object.entries(stats.positionCounts).map(([position, count]) => (
            <Text key={position}>
              <Text color="cyan">{position}:</Text> {count}
            </Text>
          ))}
        </Box>
      </Box>
      
      <Box marginTop={1}>
        <Text color="gray">Press ESC or 'q' to go back</Text>
      </Box>
    </Box>
  );
};

const PositionStatsView: React.FC<{ stats: DatabaseStats; onBack: () => void }> = ({ stats, onBack }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const positions = Object.entries(stats.positionCounts);

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onBack();
    } else if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (key.downArrow && selectedIndex < positions.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">📍 Position Analysis</Text>
      </Box>
      
      <Box borderStyle="round" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color="white">📊 Position Distribution (↑↓ to navigate):</Text>
          </Box>
          {positions.map(([position, count], index) => {
            const percentage = ((count / stats.totalPlayers) * 100).toFixed(1);
            return (
              <Box key={position}>
                <Text color={index === selectedIndex ? 'black' : 'white'} 
                      backgroundColor={index === selectedIndex ? 'cyan' : undefined}>
                  <Text color="cyan">{position}:</Text> {count} players ({percentage}%)
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
      
      <Box borderStyle="round" padding={1}>
        <Box flexDirection="column">
          <Text bold color="green">🏆 Most Common Positions:</Text>
          {positions
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([position, count], index) => (
              <Text key={position}>
                {index + 1}. <Text color="cyan">{position}</Text>: {count} players
              </Text>
            ))}
        </Box>
      </Box>
      
      <Box marginTop={1}>
        <Text color="gray">Press ESC or 'q' to go back</Text>
      </Box>
    </Box>
  );
};

type AppState = 'menu' | 'search' | 'advancedSearch' | 'stats' | 'positionStats' | 'loading';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('loading');
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [currentTitle, setCurrentTitle] = useState('Search Results');
  const { exit } = useApp();

  const db = new PlayerDatabase();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoadingMessage('Checking database...');
        const initialStats = await db.getStats();
        
        if (initialStats.totalPlayers === 0) {
          setLoadingMessage('No data found. Loading from CSV...');
          const loader = new CSVDataLoader();
          const csvPlayers = await loader.loadPlayersFromCSV();
          
          setLoadingMessage(`Adding ${csvPlayers.length} players to database...`);
          let successCount = 0;
          for (const player of csvPlayers) {
            const success = await db.addPlayer(player);
            if (success) successCount++;
            
            if (successCount % 1000 === 0) {
              setLoadingMessage(`Added ${successCount}/${csvPlayers.length} players...`);
            }
          }
          
          setLoadingMessage('Finalizing...');
          const finalStats = await db.getStats();
          setStats(finalStats);
        } else {
          setStats(initialStats);
        }
        
        setState('menu');
      } catch (error) {
        console.error('Initialization error:', error);
        setLoadingMessage('Error initializing app. Please try again.');
        setTimeout(() => exit(), 3000);
      }
    };

    initializeApp();
  }, []);

  const handleMenuSelect = async (action: string) => {
    setState('loading');
    
    try {
      switch (action) {
        case 'search':
          setState('advancedSearch');
          break;
        case 'quickSearch':
          setLoadingMessage('Loading top players (85+ rating)...');
          const topPlayers = await db.searchPlayers({ minOverall: 85 }, 50);
          setPlayers(topPlayers);
          setCurrentTitle('Top Players (85+ Rating)');
          setState('search');
          break;
        case 'youngTalents':
          setLoadingMessage('Finding young talents (U21 with 85+ potential)...');
          const youngTalents = await db.searchPlayers({ maxAge: 21, minPotential: 85 }, 50);
          setPlayers(youngTalents);
          setCurrentTitle('Young Talents (U21, 85+ Potential)');
          setState('search');
          break;
        case 'valuePlayers':
          setLoadingMessage('Finding best value players (under €50M, 80+ rating)...');
          const valuePlayers = await db.searchPlayers({ maxPrice: 50_000_000, minOverall: 80 }, 50);
          setPlayers(valuePlayers);
          setCurrentTitle('Best Value Players (Under €50M, 80+ Rating)');
          setState('search');
          break;
        case 'strikers':
          setLoadingMessage('Loading best strikers (85+ rating)...');
          const strikers = await db.searchPlayers({ position: Position.ST, minOverall: 85 }, 30);
          setPlayers(strikers);
          setCurrentTitle('Best Strikers (85+ Rating)');
          setState('search');
          break;
        case 'goalkeepers':
          setLoadingMessage('Loading top goalkeepers (82+ rating)...');
          const goalkeepers = await db.searchPlayers({ position: Position.GK, minOverall: 82 }, 30);
          setPlayers(goalkeepers);
          setCurrentTitle('Top Goalkeepers (82+ Rating)');
          setState('search');
          break;
        case 'stats':
          setState('stats');
          break;
        case 'positionStats':
          setState('positionStats');
          break;
        case 'update':
          setLoadingMessage('Updating database...');
          const loader = new CSVDataLoader();
          const csvPlayers = await loader.loadPlayersFromCSV();
          
          let successCount = 0;
          for (const player of csvPlayers) {
            const success = await db.addPlayer(player);
            if (success) successCount++;
          }
          
          const updatedStats = await db.getStats();
          setStats(updatedStats);
          setState('menu');
          break;
        case 'exit':
          db.close();
          exit();
          break;
        default:
          setState('menu');
      }
    } catch (error) {
      console.error('Action error:', error);
      setState('menu');
    }
  };

  const handleSearch = async (criteria: SearchCriteria) => {
    setState('loading');
    setLoadingMessage('Searching players...');
    
    try {
      const searchResults = await db.searchPlayers(criteria, 50);
      setPlayers(searchResults);
      setCurrentTitle('Advanced Search Results');
      setState('search');
    } catch (error) {
      console.error('Search error:', error);
      setState('menu');
    }
  };

  const handleBack = () => {
    setState('menu');
  };

  if (state === 'loading') {
    return <Loading message={loadingMessage} />;
  }

  if (state === 'menu') {
    return <MainMenu onSelect={handleMenuSelect} />;
  }

  if (state === 'advancedSearch') {
    return <AdvancedSearchForm onSearch={handleSearch} onBack={handleBack} />;
  }

  if (state === 'search') {
    return <PlayerList players={players} onBack={handleBack} title={currentTitle} />;
  }

  if (state === 'stats' && stats) {
    return <StatsView stats={stats} onBack={handleBack} />;
  }

  if (state === 'positionStats' && stats) {
    return <PositionStatsView stats={stats} onBack={handleBack} />;
  }

  return <Loading message="Loading..." />;
};

export default App;
