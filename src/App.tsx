import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import chalk from 'chalk';

import { PlayerDatabase, CSVDataLoader, formatCurrency } from './database.js';
import { Player, Position, SearchCriteria, DatabaseStats } from './types.js';

const MainMenu: React.FC<{ onSelect: (action: string) => void }> = ({ onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const options = [
    { key: 'search', label: '🔍 Search Players' },
    { key: 'stats', label: '📊 Database Statistics' },
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

interface SearchFormProps {
  onSearch: (criteria: SearchCriteria) => void;
  onBack: () => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, onBack }) => {
  const [step, setStep] = useState<string>('position');
  const [criteria, setCriteria] = useState<SearchCriteria>({});
  const [inputValue, setInputValue] = useState('');

  useInput((input: string, key: any) => {
    if (key.escape) {
      onBack();
    }
  });

  const positions = Object.values(Position).map(pos => ({
    label: pos,
    value: pos
  }));
  positions.unshift({ label: 'Any Position', value: 'ANY' } as any);

  const handlePositionSelect = (item: { value: string }) => {
    setCriteria({ ...criteria, position: item.value === 'ANY' ? undefined : item.value as Position });
    setStep('minRating');
  };

  const handleSubmit = (value: string) => {
    if (step === 'minRating') {
      const rating = parseInt(value) || undefined;
      setCriteria({ ...criteria, minOverall: rating });
      setStep('maxAge');
      setInputValue('');
    } else if (step === 'maxAge') {
      const age = parseInt(value) || undefined;
      setCriteria({ ...criteria, maxAge: age });
      setStep('maxPrice');
      setInputValue('');
    } else if (step === 'maxPrice') {
      let price: number | undefined;
      if (value) {
        const cleanValue = value.toUpperCase().replace('€', '').replace(',', '');
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
        <Text bold color="cyan">🔍 Player Search</Text>
      </Box>
      
      <Box borderStyle="round" padding={1}>
        <Box flexDirection="column">
          {step === 'position' && (
            <>
              <Box marginBottom={1}>
                <Text color="white">Select position (or Any):</Text>
              </Box>
              <SelectInput items={positions} onSelect={handlePositionSelect} />
            </>
          )}
          
          {step === 'minRating' && (
            <>
              <Box marginBottom={1}>
                <Text color="white">Minimum overall rating (leave empty for any):</Text>
              </Box>
              <TextInput
                value={inputValue}
                placeholder="e.g., 85"
                onChange={setInputValue}
                onSubmit={handleSubmit}
              />
            </>
          )}
          
          {step === 'maxAge' && (
            <>
              <Box marginBottom={1}>
                <Text color="white">Maximum age (leave empty for any):</Text>
              </Box>
              <TextInput
                value={inputValue}
                placeholder="e.g., 25"
                onChange={setInputValue}
                onSubmit={handleSubmit}
              />
            </>
          )}
          
          {step === 'maxPrice' && (
            <>
              <Box marginBottom={1}>
                <Text color="white">Maximum price (leave empty for any, use M/K: 50M, 500K):</Text>
              </Box>
              <TextInput
                value={inputValue}
                placeholder="e.g., 100M or 50000000"
                onChange={setInputValue}
                onSubmit={handleSubmit}
              />
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

interface PlayerListProps {
  players: Player[];
  onBack: () => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, onBack }) => {
  useInput((input: string, key: any) => {
    if (key.escape) {
      onBack();
    }
  });

  const totalValue = players.reduce((sum, p) => sum + p.marketValue, 0);
  const avgRating = players.length > 0 
    ? players.reduce((sum, p) => sum + p.overallRating, 0) / players.length 
    : 0;
  const avgAge = players.length > 0 
    ? players.reduce((sum, p) => sum + p.age, 0) / players.length 
    : 0;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">🏆 Search Results ({players.length} players)</Text>
      </Box>
      
      {players.length === 0 ? (
        <Box borderStyle="round" padding={1}>
          <Text color="red">No players found matching your criteria.</Text>
        </Box>
      ) : (
        <>
          <Box borderStyle="round" padding={1} marginBottom={1}>
            <Box flexDirection="column">
              {players.slice(0, 15).map((player, index) => (
                <Box key={player.id} flexDirection="row">
                  <Box width={3}>
                    <Text color="gray">{index + 1}.</Text>
                  </Box>
                  <Box width={25}>
                    <Text bold color="white">{player.name.slice(0, 22)}</Text>
                  </Box>
                  <Box width={8}>
                    <Text color="cyan">{player.age}y {player.position}</Text>
                  </Box>
                  <Box width={6}>
                    <Text color="green">{player.overallRating} OVR</Text>
                  </Box>
                  <Box width={6}>
                    <Text color="cyan">{player.potential} POT</Text>
                  </Box>
                  <Box width={12}>
                    <Text color="magenta">{formatCurrency(player.marketValue)}</Text>
                  </Box>
                  <Box>
                    <Text color="gray">{player.club || 'Free Agent'}</Text>
                  </Box>
                </Box>
              ))}
              {players.length > 15 && (
                <Box marginTop={1}>
                  <Text color="gray">... and {players.length - 15} more players</Text>
                </Box>
              )}
            </Box>
          </Box>
          
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
        <Text color="gray">Press ESC to go back</Text>
      </Box>
    </Box>
  );
};

interface StatsViewProps {
  stats: DatabaseStats;
  onBack: () => void;
}

const StatsView: React.FC<StatsViewProps> = ({ stats, onBack }) => {
  useInput((input: string, key: any) => {
    if (key.escape) {
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
          <Box flexDirection="row">
            {Object.entries(stats.positionCounts).map(([position, count]) => (
              <Box key={position} width={12} marginRight={1}>
                <Text>
                  <Text color="cyan">{position}:</Text> {count}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      
      <Box marginTop={1}>
        <Text color="gray">Press ESC to go back</Text>
      </Box>
    </Box>
  );
};

interface LoadingProps {
  message: string;
}

const Loading: React.FC<LoadingProps> = ({ message }) => (
  <Box flexDirection="column" alignItems="center">
    <Box marginBottom={1}>
      <Text color="cyan">
        ⠋ {message}
      </Text>
    </Box>
  </Box>
);

type AppState = 'menu' | 'search' | 'searchForm' | 'stats' | 'update' | 'loading';

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

  const handleMenuSelect = (action: string) => {
    switch (action) {
      case 'search':
        setState('searchForm');
        break;
      case 'stats':
        setState('stats');
        break;
      case 'update':
        setState('update');
        handleUpdate();
        break;
      case 'exit':
        db.close();
        exit();
        break;
    }
  };

  const handleSearch = async (criteria: SearchCriteria) => {
    setState('loading');
    setLoadingMessage('Searching players...');
    
    try {
      const searchResults = await db.searchPlayers(criteria, 50);
      setPlayers(searchResults);
      setState('search');
    } catch (error) {
      console.error('Search error:', error);
      setState('menu');
    }
  };

  const handleUpdate = async () => {
    setState('loading');
    setLoadingMessage('Loading player data from CSV...');
    
    try {
      const loader = new CSVDataLoader();
      const csvPlayers = await loader.loadPlayersFromCSV();
      
      setLoadingMessage(`Updating ${csvPlayers.length} players...`);
      let successCount = 0;
      for (const player of csvPlayers) {
        const success = await db.addPlayer(player);
        if (success) successCount++;
        
        if (successCount % 1000 === 0) {
          setLoadingMessage(`Updated ${successCount}/${csvPlayers.length} players...`);
        }
      }
      
      const updatedStats = await db.getStats();
      setStats(updatedStats);
      setState('menu');
    } catch (error) {
      console.error('Update error:', error);
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

  if (state === 'searchForm') {
    return <SearchForm onSearch={handleSearch} onBack={handleBack} />;
  }

  if (state === 'search') {
    return <PlayerList players={players} onBack={handleBack} />;
  }

  if (state === 'stats' && stats) {
    return <StatsView stats={stats} onBack={handleBack} />;
  }

  return <Loading message="Loading..." />;
};

export default App;
