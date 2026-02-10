import { useState } from 'react';
import { FileText, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-brand-950/20 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-elevation-md shadow-brand-500/20 mb-5">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-zinc-100">
            GateHouse <span className="text-brand-600 dark:text-brand-400">Studio</span>
          </h1>
          <p className="text-sm text-surface-500 dark:text-zinc-400 mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl border border-surface-200 dark:border-zinc-800 shadow-elevation-xl p-6 space-y-4">
          {error && (
            <div className="text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 rounded-xl px-3.5 py-2.5 animate-shake">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
            icon={<Mail className="w-4 h-4" />}
            placeholder="admin@gatehouse.local"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            icon={<Lock className="w-4 h-4" />}
          />

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Sign in
          </Button>
        </form>

        <p className="text-xs text-surface-400 dark:text-zinc-500 text-center mt-4">
          Default dev credentials: admin@gatehouse.local / password
        </p>
      </div>
    </div>
  );
}
