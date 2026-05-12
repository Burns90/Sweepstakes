import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSweepstake } from '../contexts/SweepstakeContext';
import { sweepstakeApi } from '../services/sweepstakeApi';

export const CreateSweepstake: React.FC = () => {
  const [name, setName] = useState('');
  const [enrollmentDeadlineDate, setEnrollmentDeadlineDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { setCurrentSweepstake } = useSweepstake();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const deadline = new Date(enrollmentDeadlineDate);
      if (deadline <= new Date()) {
        throw new Error('Enrollment deadline must be in the future');
      }

      const sweepstake = await sweepstakeApi.createSweepstake(user.uid, name, deadline);
      setCurrentSweepstake(sweepstake);
      navigate(`/sweepstake/${sweepstake.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create sweepstake');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-bg py-12 px-4">
      <div className="max-w-2xl mx-auto glass-card p-8">
        <p className="pill pill-gold mb-4">Owner Setup</p>
        <h1 className="text-5xl section-title mb-2">Create Sweepstake</h1>
        <p className="section-subtitle mb-6">Set up the pool details and enrollment window for your players.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block section-subtitle font-semibold mb-2">Sweepstake Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My World Cup Pool"
              required
              className="input-dark"
            />
          </div>
          <div>
            <label className="block section-subtitle font-semibold mb-2">Enrollment Deadline</label>
            <input
              type="datetime-local"
              value={enrollmentDeadlineDate}
              onChange={(e) => setEnrollmentDeadlineDate(e.target.value)}
              required
              className="input-dark"
            />
            <small className="section-subtitle">Players can join until this date</small>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-secondary disabled:bg-gray-500 py-3 px-4 mt-6"
          >
            {loading ? 'Creating...' : 'Create Sweepstake'}
          </button>
        </form>
      </div>
    </div>
  );
};
