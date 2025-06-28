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
    { key: 'freeAgents', label: '🆓 Free Agents' },
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
            <Text color="yellow" bold>Select an option (↑↓ to navigate, Enter to select):</Text>
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
                    <Text color={index === selectedIndex ? 'black' : 'white'} 
                          backgroundColor={index === selectedIndex ? 'yellow' : undefined}>
                      <Text color="gray">{index + 1}. </Text>
                      <Text bold>{player.name.slice(0, 25)} </Text>
                      <Text color="cyan">({player.age}y {player.position}) </Text>
                      <Text color="green">{player.overallRating} OVR </Text>
                      <Text color="yellow">{player.potential} POT </Text>
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
                  <Text><Text color="yellow">Name:</Text> {selectedPlayer.name}</Text>
                  <Text><Text color="yellow">Position:</Text> {selectedPlayer.position} | <Text color="yellow">Age:</Text> {selectedPlayer.age}</Text>
                  <Text><Text color="yellow">Club:</Text> {selectedPlayer.club || 'Free Agent'}</Text>
                  <Text><Text color="yellow">League:</Text> {selectedPlayer.league || 'Unknown'}</Text>
                  <Text><Text color="yellow">Nationality:</Text> {selectedPlayer.nationality}</Text>
                  <Text><Text color="yellow">Preferred Foot:</Text> {selectedPlayer.preferredFoot}</Text>
                  <Box marginTop={1} marginBottom={1}>
                    <Text bold color="green">📊 Ratings</Text>
                  </Box>
                  <Text><Text color="yellow">Overall:</Text> {selectedPlayer.overallRating} | <Text color="yellow">Potential:</Text> {selectedPlayer.potential}</Text>
                  <Box marginTop={1} marginBottom={1}>
                    <Text bold color="magenta">💰 Market Info</Text>
                  </Box>
                  <Text><Text color="yellow">Market Value:</Text> {formatCurrency(selectedPlayer.marketValue)}</Text>
                  {selectedPlayer.wage && <Text><Text color="yellow">Wage:</Text> {formatCurrency(selectedPlayer.wage)}</Text>}
                  {selectedPlayer.releaseClause && <Text><Text color="yellow">Release Clause:</Text> {formatCurrency(selectedPlayer.releaseClause)}</Text>}
                  <Box marginTop={1} marginBottom={1}>
                    <Text bold color="cyan">⚽ Attributes</Text>
                  </Box>
                  <Text><Text color="yellow">Pace:</Text> {selectedPlayer.attributes.pace} | <Text color="yellow">Shooting:</Text> {selectedPlayer.attributes.shooting} | <Text color="yellow">Passing:</Text> {selectedPlayer.attributes.passing}</Text>
                  <Text><Text color="yellow">Dribbling:</Text> {selectedPlayer.attributes.dribbling} | <Text color="yellow">Defending:</Text> {selectedPlayer.attributes.defending} | <Text color="yellow">Physical:</Text> {selectedPlayer.attributes.physical}</Text>
                </Box>
              </Box>
            )
          )}
          
          <Box borderStyle="round" padding={1}>
            <Box flexDirection="column">
              <Text bold color="cyan">📊 Summary:</Text>
              <Text>💰 Total value: <Text color="magenta">{formatCurrency(totalValue)}</Text></Text>
              <Text>⭐ Average rating: <Text color="green">{avgRating.toFixed(1)}</Text></Text>
              <Text>👶 Average age: <Text color="yellow">{avgAge.toFixed(1)}</Text></Text>
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
            <Text bold color="yellow">🌍 General Statistics:</Text>
          </Box>
          <Text>👥 Total players: <Text color="cyan" bold>{stats.totalPlayers.toLocaleString()}</Text></Text>
          <Text>⭐ Average rating: <Text color="green" bold>{stats.averageRating}</Text></Text>
          <Text>💰 Average value: <Text color="magenta" bold>{formatCurrency(stats.averageValue)}</Text></Text>
          <Text>👶 Average age: <Text color="yellow" bold>{stats.averageAge}</Text></Text>
        </Box>
      </Box>
      
      <Box borderStyle="round" padding={1}>
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color="yellow">📍 Players by Position:</Text>
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

const AdvancedSearchForm: React.FC<{ onSearch: (criteria: SearchCriteria) => void; onBack: () => void }> = ({ onSearch, onBack }) => {
  const [step, setStep] = useState('position');
  const [criteria, setCriteria] = useState<SearchCriteria>({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');

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
      // Handle text input
      if (key.backspace) {
        setInputValue(inputValue.slice(0, -1));
      } else if (input && input.length === 1) {
        setInputValue(inputValue + input);
      }
    }
  });

  const positions = [
    { label: 'Any Position', value: undefined },
    ...Object.values(Position).map(pos => ({ label: pos, value: pos }))
  ];

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
                <Text color="yellow">Select position (↑↓ to navigate, Enter to select):</Text>
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
                <Text color="yellow">Minimum overall rating (type number, Enter to confirm):</Text>
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
                <Text color="yellow">Maximum age (type number, Enter to confirm):</Text>
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
                <Text color="yellow">Maximum price (type amount, Enter to search):</Text>
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

type AppState = 'menu' | 'search' | 'stats' | 'loading';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('loading');
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
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
          }
          
          setLoadingMessage('Finalizing...');
        }
        setState('menu');
      } catch (error) {
        console.error('Error initializing app:', error);
        setLoadingMessage('Error initializing app. Please try again.');
      }
    };

    initializeApp();
  }, []);

  // ... rest of component logic would go here

  return (
    <Box>
      <Text>SimpleApp component incomplete</Text>
    </Box>
  );
};

export default App;