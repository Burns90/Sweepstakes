import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess('Password reset email sent! Check your inbox.');
      setEmail('');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-bg">
      <div className="app-shell grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="glass-card p-8">
          <h1 className="text-5xl leading-tight mb-3">Reset Your Password</h1>
          <p className="section-subtitle text-lg">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-4xl mb-6 section-title text-center">Forgot Password</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block section-subtitle font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-dark"
                placeholder="Enter your email"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-emerald-400 text-sm">{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:bg-gray-500 py-3 px-4 mt-6"
            >
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </form>

          <p className="text-center section-subtitle mt-4">
            Remember your password?{' '}
            <Link to="/login" className="text-cyan-300 hover:underline font-semibold">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
