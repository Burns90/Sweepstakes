import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sweepstakeApi, Player, Sweepstake } from '../services/sweepstakeApi';
import { useSweepstake } from '../contexts/SweepstakeContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

export const PlayerDashboard: React.FC = () => {
  const { sweepstakeId } = useParams<{ sweepstakeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sweepstake, setSweepstake] = useState<Sweepstake | null>(null);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { winningTeam } = useSweepstake();

  useEffect(() => {
    if (!sweepstakeId) return;

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
    if (!sweepstakeId || !user) return;

    const playersRef = collection(db, `sweepstakes/${sweepstakeId}/players`);
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const playersList: Player[] = [];
      let currentUserPlayer: Player | null = null;

      snapshot.forEach((doc) => {
        const playerData = {
          id: doc.id,
          sweepstakeId: doc.data().sweepstakeId,
          userId: doc.data().userId,
          assignedTeam: doc.data().assignedTeam,
          paid: doc.data().paid,
          isEliminated: doc.data().isEliminated,
          joinedAt: doc.data().joinedAt.toDate(),
        };
        playersList.push(playerData);

        if (doc.data().userId === user.uid) {
          currentUserPlayer = playerData;
        }
      });

      setMyPlayer(currentUserPlayer);
      setAllPlayers(playersList);
      setLoading(false);
    });

    return unsubscribe;
  }, [sweepstakeId, user]);

  if (loading) {
    return <div className="app-bg p-6 section-subtitle">Loading...</div>;
  }

  if (error) {
    return <div className="app-bg p-6 text-red-400">{error}</div>;
  }

  if (!sweepstake || !myPlayer) {
    return <div className="app-bg p-6 section-subtitle">Unable to load your sweepstake</div>;
  }

  const allTeams = allPlayers.map((p) => p.assignedTeam);

  return (
    <div className="app-bg py-8 px-4">
      <div className="app-shell">
        <h1 className="text-5xl section-title">{sweepstake.name}</h1>
        {winningTeam && (
          <div className="glass-card" style={{ margin: '20px 0', padding: '16px', textAlign: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#86efac', fontSize: '1.2em' }}>🏆 Winner: {winningTeam}</span>
          </div>
        )}

        <div className="glass-card" style={{ marginBottom: '30px', padding: '20px' }}>
          <h2 className="text-4xl section-title">Your Team</h2>
          <div className="pill pill-gold" style={{ marginBottom: '10px' }}>Assigned Team</div>
          <div style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '4px', color: '#e2e8f0' }}>
            {myPlayer.assignedTeam}
          </div>
          <div className="section-subtitle">This is your active team in the sweepstake.</div>
        </div>

        <div className="glass-card" style={{ marginBottom: '20px', padding: '20px' }}>
          <h3 className="text-3xl section-title">Assigned Teams</h3>
          <p className="section-subtitle">Total Teams Assigned: {allTeams.length}</p>
          <div style={{ marginTop: '10px' }}>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {allTeams.map((team) => (
                <li key={team} style={{ color: team === myPlayer.assignedTeam ? '#60a5fa' : '#cbd5e1', marginBottom: '4px' }}>
                  {team} {team === myPlayer.assignedTeam && '(Your Team)'}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={() => navigate('/home')}
          className="btn-secondary"
          style={{ padding: '10px 20px' }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};
