import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRarityTier } from '../constants/participants';
import { sweepstakeApi } from '../services/sweepstakeApi';
import { FlagImage } from '../components/FlagImage';

interface AssignmentResult {
  sweepstakeId: string;
  sweepstakeName: string;
  sweepstakeType: 'worldcup' | 'eurovision' | 'custom';
  availableTeams: string[];
  assignedTeam?: string; // Set after animation completes
  customOptions?: string[];
}

export const JoinWithCode: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'spinning' | 'revealing'>('spinning');
  const [rotation, setRotation] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  // CS Case opening animation with team assignment on completion
  useEffect(() => {
    if (assignmentResult && animationPhase === 'spinning') {
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
          // Animation complete - calculate landing team and assign it
          const finalRotation = spins * 360;
          const landedIndex = Math.floor(finalRotation / 37.5) % assignmentResult.availableTeams.length;
          const assignedTeam = assignmentResult.availableTeams[landedIndex];

          // Assign team to player
          sweepstakeApi.assignTeamToPlayer(assignmentResult.sweepstakeId, user!.uid, assignedTeam)
            .then(() => {
              // Update assignment result with assigned team for final display
              setAssignmentResult(prev => prev ? { ...prev, assignedTeam } : null);
              setAnimationPhase('revealing');
            })
            .catch((err) => {
              setError(err.message || 'Failed to assign team');
              setAnimationPhase('revealing');
            });
        }
      };

      requestAnimationFrame(animate);
    }
  }, [assignmentResult, animationPhase, user]);

  useEffect(() => {
    const joinSweepstake = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        setError('No league code provided');
        setLoading(false);
        return;
      }

      try {
        if (!user) {
          throw new Error('User not authenticated');
        }

        const sweepstake = await sweepstakeApi.getSweepstakeByCode(code.toUpperCase());
        if (!sweepstake) {
          throw new Error('Sweepstake not found. Invalid code.');
        }

        if (new Date() > sweepstake.enrollmentDeadline) {
          throw new Error('Enrollment period has closed for this sweepstake');
        }

        const availableTeams = await sweepstakeApi.getAvailableTeams(sweepstake.id);
        if (availableTeams.length === 0) {
          throw new Error('All teams have been assigned');
        }

        setAssignmentResult({
          sweepstakeId: sweepstake.id,
          sweepstakeName: sweepstake.name,
          sweepstakeType: sweepstake.type,
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

    joinSweepstake();
  }, [user, searchParams]);

  // Show CS-style case opening animation
  if (assignmentResult) {
    const isRevealing = animationPhase === 'revealing';
    // During spinning: use availableTeams, During revealing: use assignedTeam
    const teamsForAnimation = isRevealing && assignmentResult.assignedTeam 
      ? [assignmentResult.assignedTeam]
      : assignmentResult.availableTeams;
    
    const spinningIndex = Math.floor(rotation / 37.5) % teamsForAnimation.length;
    const visibleTeam = teamsForAnimation[spinningIndex];
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
            <div
              className={`case-card ${rarityClass} rounded-lg shadow-2xl p-8 w-full flex flex-col items-center justify-center transform transition-all duration-500`}
              style={{
                '--rotation': `${rotation}deg`,
              } as React.CSSProperties}
            >
              <div className="text-center">
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <FlagImage country={visibleTeam} size="lg" />
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
              onClick={() => navigate(`/sweepstake/${assignmentResult.sweepstakeId}`)}
              className="w-full btn-secondary py-3 px-4 text-lg font-bold"
            >
              View Your Sweepstake
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-bg flex items-center justify-center px-4 h-screen">
        <div className="text-center">
          <p className="pill pill-gold mb-4">Joining...</p>
          <p className="section-subtitle">Setting up your assignment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-bg flex items-center justify-center px-4 h-screen">
        <div className="glass-card p-8 max-w-md text-center">
          <p className="text-red-400 text-lg font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate('/join')}
            className="btn-secondary py-2 px-4"
          >
            Back to Join Page
          </button>
        </div>
      </div>
    );
  }

  return null;
};
