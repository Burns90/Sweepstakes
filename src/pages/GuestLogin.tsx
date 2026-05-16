import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sweepstakeApi } from '../services/sweepstakeApi';
import { getRarityTier } from '../constants/participants';
import { FlagImage } from '../components/FlagImage';

interface GuestJoinResult {
  sweepstakeId: string;
  sweepstakeName: string;
  sweepstakeType: 'worldcup' | 'eurovision' | 'custom';
  guestId: string;
  playerName: string;
  availableTeams: string[];
  assignedTeam?: string; // Set after animation completes
  customOptions?: string[];
}

export const GuestLogin: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [sweepstakeCode, setSweepstakeCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinResult, setJoinResult] = useState<GuestJoinResult | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'spinning' | 'revealing'>('spinning');
  const [rotation, setRotation] = useState(0);
  const navigate = useNavigate();

  // CS Case opening animation with team assignment on completion
  useEffect(() => {
    console.log('Animation effect running - joinResult:', joinResult, 'animationPhase:', animationPhase); // DEBUG
    
    if (joinResult && animationPhase === 'spinning') {
      console.log('Starting animation...'); // DEBUG
      let frame = 0;
      const maxFrames = 300; // 5 seconds at 60fps

      const animate = () => {
        frame++;
        const progress = frame / maxFrames;
        const easeOut = 1 - Math.pow(1 - progress, 4); // Stronger deceleration
        const spins = 8;
        setRotation(spins * 360 * easeOut);

        if (frame < maxFrames) {
          requestAnimationFrame(animate);
        } else {
          console.log('Animation complete! Landing team calculation...'); // DEBUG
          // Animation complete - calculate landing team and assign it
          const finalRotation = spins * 360;
          const landedIndex = Math.floor(finalRotation / 37.5) % joinResult.availableTeams.length;
          const assignedTeam = joinResult.availableTeams[landedIndex];
          
          console.log('Assigned team:', assignedTeam, 'Player name:', joinResult.playerName); // DEBUG

          // Assign team to player with player name
          sweepstakeApi.assignTeamToPlayer(joinResult.sweepstakeId, joinResult.guestId, assignedTeam, joinResult.playerName)
            .then(() => {
              console.log('Team assignment successful!'); // DEBUG
              // Store guest data in localStorage
              const guestData = {
                guestId: joinResult.guestId,
                playerName: joinResult.playerName,
                sweepstakeId: joinResult.sweepstakeId,
                assignedTeam,
              };
              localStorage.setItem(`guest_${joinResult.sweepstakeId}`, JSON.stringify(guestData));

              // Update join result with assigned team for final display
              setJoinResult(prev => prev ? { ...prev, assignedTeam } : null);
              setAnimationPhase('revealing');
            })
            .catch((err) => {
              console.error('Team assignment failed:', err); // DEBUG
              setError(err.message || 'Failed to assign team');
              setAnimationPhase('revealing');
            });
        }
      };

      requestAnimationFrame(animate);
    }
  }, [joinResult, animationPhase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!playerName.trim()) {
        throw new Error('Please enter your name');
      }

      if (!sweepstakeCode.trim()) {
        throw new Error('Please enter a sweepstake code');
      }

      // Fetch sweepstake by code
      const sweepstake = await sweepstakeApi.getSweepstakeByCode(sweepstakeCode.toUpperCase());
      if (!sweepstake) {
        throw new Error('Sweepstake not found. Invalid code.');
      }

      if (new Date() > sweepstake.enrollmentDeadline) {
        throw new Error('Enrollment period has closed for this sweepstake');
      }

      // Get available teams
      const availableTeams = await sweepstakeApi.getAvailableTeams(sweepstake.id);
      if (availableTeams.length === 0) {
        throw new Error('All teams have been assigned');
      }

      // Generate guest ID
      const guestId = `guest_${Math.random().toString(36).substring(2, 11)}`;

      // Pass available teams to animation - don't assign yet
      console.log('Setting joinResult with playerName:', playerName, 'availableTeams count:', availableTeams.length); // DEBUG
      setJoinResult({
        sweepstakeId: sweepstake.id,
        sweepstakeName: sweepstake.name,
        sweepstakeType: sweepstake.type,
        guestId,
        playerName,
        availableTeams,
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

  if (joinResult) {
    const isRevealing = animationPhase === 'revealing';
    // During spinning: use availableTeams, During revealing: use assignedTeam
    const teamsForAnimation = isRevealing && joinResult.assignedTeam 
      ? [joinResult.assignedTeam]
      : joinResult.availableTeams;
    
    const spinningIndex = Math.floor(rotation / 37.5) % teamsForAnimation.length;
    const visibleTeam = teamsForAnimation[spinningIndex];
    const rarityClass = getRarityTier(visibleTeam, joinResult.sweepstakeType);

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
            <p className="section-subtitle mb-2">Welcome, {joinResult.playerName}!</p>
            <p className="section-subtitle">{joinResult.sweepstakeName}</p>
          </div>

          {/* CS-Style Case Card */}
          <div className="relative h-96 flex items-center justify-center mb-8">
            <div
              className={`case-card ${rarityClass} rounded-lg shadow-2xl p-8 w-full flex flex-col items-center justify-center transform transition-all duration-500`}
              style={{
                '--rotation': `${rotation}deg`,
              } as React.CSSProperties}
            >
              <div className="text-center">
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  {joinResult.sweepstakeType !== 'custom' && <FlagImage country={visibleTeam} size="lg" />}
                </div>
                <p className="text-white text-2xl font-bold">{visibleTeam}</p>
                <p className="text-white text-sm font-semibold uppercase tracking-widest mt-2">
                  {isRevealing ? '✓ Assigned' : 'Spinning...'}
                </p>
              </div>
            </div>
          </div>

          {isRevealing && (
            <button
              onClick={() => navigate(`/guest/sweepstake/${joinResult.sweepstakeId}/${joinResult.guestId}`)}
              className="w-full btn-secondary py-3 px-4 text-lg font-bold"
            >
              View Your Sweepstake
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg">
      <div className="app-shell grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="glass-card p-8">
          <h1 className="text-5xl leading-tight mb-3">Join as Guest</h1>
          <p className="section-subtitle text-lg">
            Enter your name and sweepstake code to join a tournament without creating an account.
          </p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-4xl mb-6 section-title text-center">Guest Entry</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block section-subtitle font-semibold mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                required
                className="input-dark"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block section-subtitle font-semibold mb-2">Sweepstake Code</label>
              <input
                type="text"
                value={sweepstakeCode}
                onChange={(e) => setSweepstakeCode(e.target.value.toUpperCase())}
                required
                className="input-dark"
                placeholder="Enter code (e.g., ABC123)"
                maxLength={6}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-emerald-400 text-sm">{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:bg-gray-500 py-3 px-4 mt-6"
            >
              {loading ? 'Joining...' : 'Join Sweepstake'}
            </button>
          </form>

          <p className="text-center section-subtitle mt-4">
            Want to create an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-cyan-300 hover:underline font-semibold bg-none border-none p-0 cursor-pointer"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
