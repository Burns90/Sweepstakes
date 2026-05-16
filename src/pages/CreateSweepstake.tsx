import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSweepstake } from '../contexts/SweepstakeContext';
import { sweepstakeApi } from '../services/sweepstakeApi';

export const CreateSweepstake: React.FC = () => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'worldcup' | 'eurovision' | 'custom'>('worldcup');
  const [enrollmentDeadlineDate, setEnrollmentDeadlineDate] = useState('');
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { setCurrentSweepstake } = useSweepstake();
  const navigate = useNavigate();

  const handleAddOption = () => {
    const trimmed = customInput.trim();
    if (trimmed && !customOptions.includes(trimmed)) {
      setCustomOptions([...customOptions, trimmed]);
      setCustomInput('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setCustomOptions(customOptions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (type === 'custom' && customOptions.length === 0) {
        throw new Error('Please add at least one custom option');
      }

      const deadline = new Date(enrollmentDeadlineDate);
      if (deadline <= new Date()) {
        throw new Error('Enrollment deadline must be in the future');
      }

      const sweepstake = await sweepstakeApi.createSweepstake(
        user.uid,
        name,
        deadline,
        type,
        type === 'custom' ? customOptions : undefined
      );
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
            <label className="block section-subtitle font-semibold mb-2">Sweepstake Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'worldcup' | 'eurovision' | 'custom')}
              className="input-dark"
            >
              <option value="worldcup">World Cup</option>
              <option value="eurovision">Eurovision</option>
              <option value="custom">Custom Options</option>
            </select>
          </div>

          {type === 'custom' && (
            <div className="p-4 rounded-lg border border-slate-600 bg-slate-800">
              <label className="block section-subtitle font-semibold mb-2">Add Custom Options</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder="Enter option (e.g., Red Team)"
                  className="input-dark flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="btn-secondary py-2 px-4"
                >
                  Add
                </button>
              </div>

              {customOptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm section-subtitle">Added options ({customOptions.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {customOptions.map((option, index) => (
                      <div
                        key={index}
                        className="bg-slate-700 px-3 py-1 rounded flex items-center gap-2 text-sm"
                      >
                        {option}
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="text-red-400 hover:text-red-300 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
