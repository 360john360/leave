
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { APP_NAME } from '../constants';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = await login(email, password);
    if (user) {
      navigate('/dashboard');
    } else {
      setError('Login failed. Please verify your email and password.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg-light p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            {/* You could place a logo here */}
            {/* <img src="/logo.svg" alt="Company Logo" className="mx-auto h-12 w-auto" /> */}
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-primary">
                {APP_NAME}
            </h1>
            <p className="mt-2 text-sm text-brand-text-secondary">
                Access your workforce management portal.
            </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl border border-brand-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<EnvelopeIcon />}
              wrapperClassName="mb-4"
            />
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<LockClosedIcon />}
              wrapperClassName="mb-4"
            />

            {error && <p className="text-xs text-brand-error text-center bg-red-50 p-2 rounded-md">{error}</p>}

            <div>
              <Button type="submit" fullWidth isLoading={loading} disabled={loading} size="lg">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 pt-6 border-t border-brand-border">
              <p className="text-center text-xs text-brand-text-secondary mb-2">
                  For demonstration purposes, use one of the mock user emails:
              </p>
              <ul className="text-xs text-brand-text-secondary list-disc list-inside bg-slate-50 p-3 rounded-md space-y-1">
                  <li>admin@example.com (Admin)</li>
                  <li>manager@example.com (Manager)</li>
                  <li>pas@example.com (PAS Coordinator)</li>
                  <li>alice@example.com (Shift Engineer A)</li>
                  <li>bob@example.com (Shift Engineer B)</li>
                  <li>eve@example.com (BAU Engineer)</li>
              </ul>
              <p className="text-center text-xs text-brand-text-secondary mt-2">Any password will work for mock users.</p>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-brand-text-secondary">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
