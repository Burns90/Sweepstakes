import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sweepstakeApi, Player, Sweepstake } from '../services/sweepstakeApi';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getParticipantsByType } from '../constants/participants';
import { FlagImage } from '../components/FlagImage';

export const GuestPlayerDashboard: React.FC = () => {
  const { sweepstakeId, guestId } = useParams<{ sweepstakeId: string; guestId: string }>();
  const navigate = useNavigate();
  const [sweepstake, setSweepstake] = useState<Sweepstake | null>(null);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sweepstakeId || !guestId) return;

    const loadSweepstake = async () => {
      try {
        const sweep = await sweepstakeApi.getSweepstakeById(sweepstakeId);
        if (!sweep) {
          setError('Sweepstake not found');
          return;
        }
        setSweepstake(sweep);
      } catch (err: any) {
        setError(err.message || 'Failed to load sweepstake');
      }
    };

    loadSweepstake();
  }, [sweepstakeId]);

  useEffect(() => {
    if (!sweepstakeId || !guestId) return;

    const playersRef = collection(db, `sweepstakes/${sweepstakeId}/players`);
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const playersList: Player[] = [];
      let currentGuestPlayer: Player | null = null;

      snapshot.forEach((doc) => {
        const playerData = {
          id: doc.id,
          ...doc.data(),
        } as Player;

        playersList.push(playerData);

        if (playerData.userId === guestId) {
          currentGuestPlayer = playerData;
        }
      });

      setAllPlayers(playersList);
      setMyPlayer(currentGuestPlayer);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sweepstakeId, guestId]);

  if (loading) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="pill pill-gold mb-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md text-center">
          <p className="text-red-400 text-lg font-semibold mb-4">{error}</p>
          <button onClick={() => navigate('/guest-login')} className="btn-secondary py-2 px-4">
            Back to Guest Login
          </button>
        </div>
      </div>
    );
  }

  if (!sweepstake || !myPlayer) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md text-center">
          <p className="text-yellow-400 text-lg font-semibold mb-4">Player not found in this sweepstake</p>
          <button onClick={() => navigate('/guest-login')} className="btn-secondary py-2 px-4">
            Back to Guest Login
          </button>
        </div>
      </div>
    );
  }

  const participants = getParticipantsByType(sweepstake.type, sweepstake.customOptions);
  const myRank = allPlayers.findIndex((p) => p.userId === guestId) + 1;

  return (
    <div className="app-bg min-h-screen">
      <div className="app-shell py-8">
        <div className="mb-8">
          <h1 className="text-4xl section-title mb-2">{sweepstake.name}</h1>
          <p className="section-subtitle">Guest Player Dashboard</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* My Assignment */}
          <div className="glass-card p-6">
            <h2 className="text-xl section-title mb-4">My Assignment</h2>
            {sweepstake.type !== 'custom' && (
              <div className="mb-4 flex justify-center">
                <FlagImage country={myPlayer.assignedTeam} size="md" />
              </div>
            )}
            <p className="text-3xl font-bold text-cyan-300 text-center mb-2">{myPlayer.assignedTeam}</p>
            <p className="section-subtitle text-sm text-center">
              Rank: <span className="text-gold">{myRank}</span> of {allPlayers.length}
            </p>
          </div>

          {/* Sweepstake Info */}
          <div className="glass-card p-6">
            <h2 className="text-xl section-title mb-4">Info</h2>
            <div className="space-y-3 section-subtitle text-sm">
              <div>
                <p className="text-slate-400">Type</p>
                <p className="capitalize text-white font-semibold">{sweepstake.type}</p>
              </div>
              <div>
                <p className="text-slate-400">Total Players</p>
                <p className="text-white font-semibold">{allPlayers.length}</p>
              </div>
              <div>
                <p className="text-slate-400">Enrollment Deadline</p>
                <p className="text-white font-semibold">
                  {new Date(sweepstake.enrollmentDeadline).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h2 className="text-xl section-title mb-4">Actions</h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/guest-login')} className="w-full btn-secondary py-2 px-4 text-sm">
                Join Another
              </button>
              <button onClick={() => navigate('/')} className="w-full btn-secondary py-2 px-4 text-sm">
                Home
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="glass-card p-8">
          <h2 className="text-2xl section-title mb-6">Leaderboard</h2>
          <div className="space-y-3">
            {allPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  player.userId === guestId
                    ? 'bg-slate-700 border-cyan-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-lg font-bold text-gold w-8">{index + 1}</span>
                  {sweepstake.type !== 'custom' && (
                    <FlagImage country={player.assignedTeam} size="sm" />
                  )}
                  <div>
                    <p className="font-semibold text-white">{player.assignedTeam}</p>
                    <p className="text-sm section-subtitle">Guest</p>
                  </div>
                </div>
                {player.userId === guestId && (
                  <span className="pill pill-cyan text-xs">You</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
