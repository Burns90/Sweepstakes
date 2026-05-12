import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Sweepstake, Player } from '../services/sweepstakeApi';

interface SweepstakeContextType {
  currentSweepstake: Sweepstake | null;
  setCurrentSweepstake: (sweepstake: Sweepstake | null) => void;
  players: Player[];
  setPlayers: (players: Player[]) => void;
  availableTeams: string[];
  setAvailableTeams: (teams: string[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  winningTeam: string | null;
  setWinningTeam: (team: string | null) => void;
}

const SweepstakeContext = createContext<SweepstakeContextType | undefined>(undefined);

export const SweepstakeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSweepstake, setCurrentSweepstake] = useState<Sweepstake | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [winningTeam, setWinningTeam] = useState<string | null>(null);

  return (
    <SweepstakeContext.Provider
      value={{
        currentSweepstake,
        setCurrentSweepstake,
        players,
        setPlayers,
        availableTeams,
        setAvailableTeams,
        loading,
        setLoading,
        error,
        setError,
        winningTeam,
        setWinningTeam,
      }}
    >
      {children}
    </SweepstakeContext.Provider>
  );
};

export const useSweepstake = () => {
  const context = useContext(SweepstakeContext);
  if (context === undefined) {
    throw new Error('useSweepstake must be used within SweepstakeProvider');
  }
  return context;
};
