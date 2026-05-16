import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllParticipantsByType, getRarityTier, getParticipantsByType } from '../constants/participants';
import { sweepstakeApi } from '../services/sweepstakeApi';
import { FlagImage } from '../components/FlagImage';

interface AssignmentResult {
  sweepstakeId: string;
  sweepstakeName: string;
  assignedTeam: string;
  sweepstakeType: 'worldcup' | 'eurovision' | 'custom';
  customOptions?: string[];
}

export const JoinSweepstake: React.FC = () => {
  const [leagueCode, setLeagueCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'spinning' | 'revealing'>('spinning');
  const [rotation, setRotation] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  // CS Case opening animation
  useEffect(() => {
    if (assignmentResult && animationPhase === 'spinning') {
      let frame = 0;
      const maxFrames = 144; // 2.4 seconds at 60fps (20% slower)

      const animate = () => {
        frame++;
        // Deceleration: fast spin that slows down
        const progress = frame / maxFrames;
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const spins = 8; // Number of full rotations
        setRotation(spins * 360 * easeOut);

        if (frame < maxFrames) {
          requestAnimationFrame(animate);
        } else {
          setAnimationPhase('revealing');
        }
      };

      requestAnimationFrame(animate);
    }
  }, [assignmentResult, animationPhase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const sweepstake = await sweepstakeApi.getSweepstakeByCode(leagueCode.toUpperCase());
      if (!sweepstake) {
        throw new Error('Sweepstake not found. Check the league code.');
      }

      if (new Date() > sweepstake.enrollmentDeadline) {
        throw new Error('Enrollment period has closed for this sweepstake');
      }

      const availableTeams = await sweepstakeApi.getAvailableTeams(sweepstake.id);
      if (availableTeams.length === 0) {
        throw new Error('All teams have been assigned');
      }

      const randomTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
      await sweepstakeApi.assignTeamToPlayer(sweepstake.id, user.uid, randomTeam);

      // Show assignment result with animation
      setAssignmentResult({
        sweepstakeId: sweepstake.id,
        sweepstakeName: sweepstake.name,
        assignedTeam: randomTeam,
        sweepstakeType: sweepstake.type,
        customOptions: sweepstake.customOptions,
      });
      setAnimationPhase('spinning');
      setRotation(0);
    } catch (err: any) {
      setError(err.message || 'Failed to join sweepstake');
    } finally {
      setLoading(false);
    }
  };

  // Show CS-style case opening animation
  if (assignmentResult) {
    const isRevealing = animationPhase === 'revealing';
    const allParticipants = getAllParticipantsByType(assignmentResult.sweepstakeType, assignmentResult.customOptions);
    const participantFlags = getParticipantsByType(assignmentResult.sweepstakeType, assignmentResult.customOptions);
    const spinningTeam = allParticipants[Math.floor(rotation / 37.5) % allParticipants.length];
    const visibleTeam = isRevealing ? assignmentResult.assignedTeam : spinningTeam;
    const rarityClass = getRarityTier(visibleTeam, assignmentResult.sweepstakeType);

    return (
      <div className="app-bg flex items-center justify-center px-4">
        <style>{`
          @keyframes cardFlip {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(var(--rotation)); }
          }
          @keyframes rarityPulse {
            0% { transform: scale(1); filter: brightness(1); }
            100% { transform: scale(1.02); filter: brightness(1.08); }
          }
          .case-card {
            perspective: 1000px;
            animation: cardFlip 2s ease-out forwards;
          }
          .case-card.common {
            background: linear-gradient(135deg, #d97706 0%, #f59e0b 55%, #fcd34d 100%);
            border: 2px solid #f59e0b;
            box-shadow: 0 0 22px rgba(245, 158, 11, 0.45);
          }
          .case-card.rare {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 55%, #22d3ee 100%);
            border: 2px solid #67e8f9;
            box-shadow: 0 0 24px rgba(34, 211, 238, 0.5), 0 0 56px rgba(14, 165, 233, 0.35);
            animation: cardFlip 2s ease-out forwards, rarityPulse 1.1s ease-in-out infinite alternate;
          }
          .case-card.ultra-rare {
            background: linear-gradient(135deg, #ec4899 0%, #f59e0b 50%, #06b6d4 100%);
            border: 2px solid #f472b6;
            box-shadow: 0 0 28px rgba(236, 72, 153, 0.6), 0 0 60px rgba(245, 158, 11, 0.45), 0 0 90px rgba(6, 182, 212, 0.35);
            animation: cardFlip 2s ease-out forwards, rarityPulse 0.9s ease-in-out infinite alternate;
          }
        `}</style>

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <p className="section-subtitle">{assignmentResult.sweepstakeName}</p>
          </div>

          {/* CS-Style Case Card */}
          <div className="relative h-96 flex items-center justify-center mb-8">
            {/* Spinning card effect */}
            <div
              className={`case-card ${rarityClass} rounded-lg shadow-2xl p-8 w-full flex flex-col items-center justify-center transform transition-all duration-500`}
              style={{
                transform: `rotateY(${rotation}deg)`,
                backfaceVisibility: 'hidden',
              }}
            >
              {/* Show random teams while spinning */}
              {!isRevealing ? (
                <div className="text-center animate-bounce">
                  <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                    <FlagImage country={spinningTeam} size="lg" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{spinningTeam}</div>
                </div>
              ) : null}

              {/* Reveal the actual team */}
              {isRevealing && (
                <div className="animate-in fade-in zoom-in duration-500 text-center">
                  <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <FlagImage country={assignmentResult.assignedTeam} size="lg" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900">{assignmentResult.assignedTeam}</div>
                </div>
              )}
            </div>
          </div>

          {/* Reveal Screen (Shows after animation) */}
          {isRevealing && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card p-8 text-center">
                <div className="mb-6">
                  <h2 className="text-4xl section-title mb-2">🎉 CONGRATULATIONS!</h2>
                  <p className="section-subtitle mb-4">You've been assigned:</p>
                </div>

                <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg p-6 mb-6">
                  <p className="text-5xl font-bold text-blue-600 mb-2">
                    {participantFlags[assignmentResult.assignedTeam]}
                  </p>
                  <p className="text-3xl font-bold text-blue-600">{assignmentResult.assignedTeam}</p>
                </div>

                <div className="bg-slate-900/60 rounded-lg p-4 mb-6 border border-slate-600">
                  <p className="text-sm section-subtitle">
                    <strong>Good luck!</strong> Your team needs to win the World Cup to claim the sweepstake! 🏆
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/sweepstake/${assignmentResult.sweepstakeId}/player`)}
                  className="w-full btn-primary py-3 px-4"
                >
                  View Your Dashboard →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular join form
  return (
    <div className="app-bg py-12 px-4">
      <div className="max-w-md mx-auto glass-card p-8">
        <p className="pill pill-gold mb-3">League Entry</p>
        <h1 className="text-5xl section-title mb-6">Join Sweepstake</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block section-subtitle font-semibold mb-2">League Code</label>
            <input
              type="text"
              value={leagueCode}
              onChange={(e) => setLeagueCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABC123"
              maxLength={6}
              required
              className="input-dark text-center text-2xl font-mono tracking-widest"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:bg-gray-500 py-3 px-4 mt-6"
          >
            {loading ? 'Joining...' : 'Join Sweepstake'}
          </button>
        </form>
      </div>
    </div>
  );
};
