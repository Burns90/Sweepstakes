import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-bg">
      <div className="app-shell grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <div className="glass-card p-8">
          <h1 className="text-5xl leading-tight mb-3">Welcome to Sweepstakes</h1>
          <p className="section-subtitle text-lg">
            Jump into your leagues, check team assignments, and run the tournament from one place.
          </p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-4xl mb-6 section-title text-center">Login</h2>

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
            <div>
              <label className="block section-subtitle font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-dark"
                placeholder="Enter your password"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:bg-gray-500 py-3 px-4 mt-6"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center section-subtitle mt-4">
            Don't have an account?{' '}
            <Link to="/signup" className="text-cyan-300 hover:underline font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
