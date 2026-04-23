import { useState } from 'react';
import { AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import { signIn, extractUserRole } from '../lib/authService';

export default function FieldOfficerLoginPage({ onLoginSuccess }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sign in using Supabase Auth
      const user = await signIn(credentials);
      
      // Verify the user is a field officer
      const userRole = extractUserRole(user);
      
      if (userRole !== 'field_officer') {
        throw new Error(`Akun ini memiliki role "${userRole}". Anda harus login sebagai petugas (field_officer).`);
      }

      // Call success callback
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-800">Login Petugas</h1>
          <p className="mt-2 text-sm text-slate-600">
            Masuk dengan akun petugas lapangan untuk melihat penugasan Anda
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-panel rounded-3xl p-6">
          {error && (
            <div className="mb-4 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle size={18} className="flex-shrink-0 text-rose-700 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Email Petugas
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                placeholder="ahmad.sutrisno@example.com"
                required
                disabled={isLoading}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Password
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-cyan-100 bg-white px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-cyan-400"
                  placeholder="Ahmad123!@#"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-70"
            >
              <LogIn size={16} />
              {isLoading ? 'Memproses...' : 'Masuk sebagai Petugas'}
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-blue-700">📧 Test Credentials:</p>
          <div className="mt-2 space-y-1 text-xs text-blue-600 font-mono">
            <p>ahmad.sutrisno@example.com / Ahmad123!@#</p>
            <p>budi.santoso@example.com / Budi123!@#</p>
            <p>citra.dewi@example.com / Citra123!@#</p>
          </div>
        </div>
      </div>
    </main>
  );
}
