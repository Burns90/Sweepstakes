import React, { useState, useEffect } from 'react';
import { useSweepstake } from '../contexts/SweepstakeContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sweepstakeApi, Player, Sweepstake } from '../services/sweepstakeApi';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { getAllParticipantsByType } from '../constants/participants';
import { FlagImage } from '../components/FlagImage';

interface PlayerWithName extends Player {
  playerName: string;
}

export const OwnerDashboard: React.FC = () => {
  const { sweepstakeId } = useParams<{ sweepstakeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sweepstake, setSweepstake] = useState<Sweepstake | null>(null);
  const [players, setPlayers] = useState<PlayerWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { availableTeams, setAvailableTeams, winningTeam, setWinningTeam } = useSweepstake();

  useEffect(() => {
    if (!sweepstakeId) return;

    const loadSweepstake = async () => {
      try {
        const sweep = await sweepstakeApi.getSweepstakeById(sweepstakeId);
        if (!sweep) {
          setError('Sweepstake not found');
          return;
        }

        if (sweep.ownerId !== user?.uid) {
          setError('You do not have permission to view this sweepstake');
          return;
        }

        setSweepstake(sweep);
      } catch (err: any) {
        setError(err.message || 'Failed to load sweepstake');
      }
    };

    loadSweepstake();
  }, [sweepstakeId, user?.uid]);

  useEffect(() => {
    if (!sweepstakeId) return;

    const playersRef = collection(db, `sweepstakes/${sweepstakeId}/players`);
    const unsubscribe = onSnapshot(playersRef, async (snapshot) => {
      const playersList: PlayerWithName[] = [];
      const assignedTeams = new Set<string>();

      // Process all players
      for (const playerDoc of snapshot.docs) {
        const playerData = playerDoc.data();
        let playerName = 'Unknown Player';
        assignedTeams.add(playerData.assignedTeam);

        console.log('Processing player - userId:', playerData.userId, 'playerData.playerName:', playerData.playerName); // DEBUG

        // First check if playerName is stored in player document (for guests)
        if (playerData.playerName) {
          playerName = playerData.playerName;
          console.log('✓ Using guest playerName from document:', playerName); // DEBUG
        } else {
          // Otherwise try to fetch from users collection (for authenticated users)
          try {
            const userDocRef = doc(db, 'users', playerData.userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              playerName = userData.name || 'Unknown Player';
              console.log('✓ Using name from users collection:', playerName); // DEBUG
            } else {
              console.log('⚠ User document not found for:', playerData.userId); // DEBUG
            }
          } catch (err) {
            console.log('⚠ Error fetching user document:', err); // DEBUG
          }
        }

        playersList.push({
          id: playerDoc.id,
          sweepstakeId: playerData.sweepstakeId,
          userId: playerData.userId,
          assignedTeam: playerData.assignedTeam,
          paid: playerData.paid,
          isEliminated: playerData.isEliminated,
          joinedAt: playerData.joinedAt?.toDate?.() || new Date(playerData.joinedAt),
          playerName,
        });
      }
      
      console.log('Final players list with names:', playersList); // DEBUG
      setPlayers(playersList);
      
      // Update available teams based on sweepstake type
      if (sweepstake) {
        const allParticipants = getAllParticipantsByType(sweepstake.type, sweepstake.customOptions);
        const available = allParticipants.filter(team => !assignedTeams.has(team));
        setAvailableTeams(available);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [sweepstakeId, sweepstake, setAvailableTeams]);

  const handleTogglePaid = async (playerId: string, currentStatus: boolean) => {
    if (!sweepstakeId) return;
    try {
      await sweepstakeApi.togglePlayerPaidStatus(sweepstakeId, playerId, currentStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to update paid status');
    }
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!sweepstakeId) return;
    const confirmed = window.confirm(`Are you sure you want to delete ${playerName}? They can rejoin and be assigned a new team.`);
    if (!confirmed) return;

    try {
      await sweepstakeApi.deletePlayer(sweepstakeId, playerId);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      setError(err.message || 'Failed to delete player');
    }
  };

  const handleDeleteSweepstake = async () => {
    if (!sweepstake || !sweepstakeId) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete the sweepstake "${sweepstake.name}"? This action cannot be undone and all player data will be removed.`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await sweepstakeApi.deleteSweepstake(sweepstakeId);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to delete sweepstake');
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!sweepstake) return;

    const csvContent = [
      ['Name', sweepstake.type === 'eurovision' ? 'Country' : 'Team', 'Paid'],
      ...players.map((p) => [
        p.playerName,
        p.assignedTeam,
        p.paid ? 'Yes' : 'No',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute('download', `${sweepstake.name}_players.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return <div className="app-bg p-6 section-subtitle">Loading...</div>;
  }

  if (error) {
    return <div className="app-bg p-6 text-red-400">{error}</div>;
  }

  if (!sweepstake) {
    return <div className="app-bg p-6 section-subtitle">Sweepstake not found</div>;
  }

  const totalPlayers = players.length;
  const paidPlayers = players.filter((p) => p.paid).length;

  return (
    <div className="app-bg py-8 px-4">
      <div className="app-shell">
        {/* Header */}
        <div className="glass-card p-6 mb-8">
          <h1 className="text-5xl section-title mb-2">{sweepstake.name}</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="kpi-card">
              <p className="kpi-label">League Code</p>
              <p className="kpi-value text-cyan-300">{sweepstake.leagueCode}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Total Players</p>
              <p className="kpi-value">{totalPlayers}</p>
            </div>
            <div className="kpi-card">
              <p className="kpi-label">Paid</p>
              <p className="kpi-value text-emerald-300">{paidPlayers}</p>
            </div>
          </div>
          {/* Winner Selection Dropdown */}
          <div className="mt-6">
            <label htmlFor="winner-select" className="block section-subtitle font-semibold mb-2">
              Select Winning {sweepstake.type === 'eurovision' ? 'Country' : sweepstake.type === 'custom' ? 'Option' : 'Team'}:
            </label>
            <select
              id="winner-select"
              className="input-dark max-w-sm"
              value={winningTeam || ''}
              onChange={e => setWinningTeam(e.target.value || null)}
            >
              <option value="">-- Select {sweepstake.type === 'eurovision' ? 'Country' : sweepstake.type === 'custom' ? 'Option' : 'Team'} --</option>
              {availableTeams.map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            {winningTeam && (
              <div className="mt-2 text-emerald-300 font-bold">
                Winner: {winningTeam}
              </div>
            )}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mb-8">
          <QRCodeDisplay leagueCode={sweepstake.leagueCode} sweepstakeName={sweepstake.name} />
        </div>

        {/* Export Button */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleExport}
            className="btn-primary py-2 px-4"
          >
            📥 Export Players (CSV)
          </button>
          <button
            onClick={handleDeleteSweepstake}
            disabled={loading}
            className="btn-primary py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-500"
          >
            🗑️ Delete Sweepstake
          </button>
        </div>

        {/* Players Table */}
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700">
                <th className="text-left px-6 py-3 font-semibold text-slate-100">Player Name</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-100">{sweepstake.type === 'eurovision' ? 'Country' : sweepstake.type === 'custom' ? 'Option' : 'Team'}</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-100">Paid</th>
                <th className="text-left px-6 py-3 font-semibold text-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition">
                  <td className="px-6 py-3 text-slate-100 font-medium">{player.playerName}</td>
                  <td className="px-6 py-3 text-slate-300" style={{ display: 'flex', alignItems: 'center' }}>
                    {sweepstake.type !== 'custom' && <FlagImage country={player.assignedTeam} size="sm" />}
                    {player.assignedTeam}
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="checkbox"
                      checked={player.paid}
                      onChange={() => handleTogglePaid(player.id, player.paid)}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleDeletePlayer(player.id, player.playerName)}
                      className="text-red-400 hover:text-red-300 hover:underline text-sm font-semibold transition"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/home')}
          className="mt-6 btn-secondary py-2 px-4"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};
