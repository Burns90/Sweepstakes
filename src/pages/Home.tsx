import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sweepstakeApi, Sweepstake } from '../services/sweepstakeApi';

export const Home: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [ownedSweepstakes, setOwnedSweepstakes] = useState<Sweepstake[]>([]);
  const [playerSweepstakes, setPlayerSweepstakes] = useState<(Sweepstake & { assignedTeam: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSweepstakes = async () => {
      if (!userProfile) return;
      try {
        const owned = await sweepstakeApi.getOwnedSweepstakes(userProfile.uid);
        const player = await sweepstakeApi.getPlayerSweepstakes(userProfile.uid);
        setOwnedSweepstakes(owned);
        setPlayerSweepstakes(player);
      } catch {
        // Keep page stable and show empty state if fetch fails.
      } finally {
        setLoading(false);
      }
    };

    fetchSweepstakes();
  }, [userProfile]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-bg">
      {/* Header */}
      <div className="glass-card mx-4 mt-4">
        <div className="app-shell py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl section-title">World Cup Sweepstake</h1>
              <p className="section-subtitle mt-1">Welcome, {userProfile?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-danger py-2 px-4"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="app-shell py-8">
        {/* Action Buttons */}
        <div className="mb-8 flex gap-4">
          {userProfile?.role === 'owner' && (
            <button
              onClick={() => navigate('/create-sweepstake')}
              className="btn-secondary py-3 px-6"
            >
              ➕ Create Sweepstake
            </button>
          )}
          <button
            onClick={() => navigate('/join')}
            className="btn-primary py-3 px-6"
          >
            🔗 Join Sweepstake
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading sweepstakes...</p>
          </div>
        ) : (
          <>
            {/* Owned Sweepstakes */}
            {ownedSweepstakes.length > 0 && (
              <section className="mb-12">
                <h2 className="text-4xl section-title mb-6">My Sweepstakes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ownedSweepstakes.map((sweepstake) => (
                    <div
                      key={sweepstake.id}
                      className="glass-card p-6 hover:shadow-lg transition"
                    >
                      <h3 className="text-3xl section-title mb-2">{sweepstake.name}</h3>
                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="text-sm section-subtitle">League Code</p>
                          <p className="text-lg font-mono font-bold text-cyan-300">{sweepstake.leagueCode}</p>
                        </div>
                        <div>
                          <p className="text-sm section-subtitle">Competition</p>
                          <span className="pill pill-gold">
                            {sweepstake.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/sweepstake/${sweepstake.id}`)}
                        className="w-full btn-secondary py-2 px-4"
                      >
                        Manage →
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Player Sweepstakes */}
            {playerSweepstakes.length > 0 && (
              <section>
                <h2 className="text-4xl section-title mb-6">Sweepstakes You're In</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playerSweepstakes.map((sweepstake) => (
                    <div
                      key={sweepstake.id}
                      className="glass-card p-6 hover:shadow-lg transition"
                    >
                      <h3 className="text-3xl section-title mb-2">{sweepstake.name}</h3>
                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="text-sm section-subtitle">Your Team</p>
                          <p className="text-lg font-bold text-emerald-300">{sweepstake.assignedTeam}</p>
                        </div>
                        <div>
                          <p className="text-sm section-subtitle">Competition</p>
                          <span className="pill pill-gold">
                            {sweepstake.status}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/sweepstake/${sweepstake.id}/player`)}
                        className="w-full btn-primary py-2 px-4"
                      >
                        View Dashboard →
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {ownedSweepstakes.length === 0 && playerSweepstakes.length === 0 && (
              <div className="glass-card p-12 text-center">
                <p className="section-title text-4xl mb-3">No sweepstakes yet</p>
                <p className="section-subtitle mb-6">
                  {userProfile?.role === 'owner'
                    ? 'Create a new sweepstake to get started'
                    : 'Join a sweepstake with a league code'}
                </p>
                <div className="flex gap-4 justify-center">
                  {userProfile?.role === 'owner' && (
                    <button
                      onClick={() => navigate('/create-sweepstake')}
                      className="btn-secondary py-3 px-6"
                    >
                      Create Sweepstake
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/join')}
                    className="btn-primary py-3 px-6"
                  >
                    Join Sweepstake
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
