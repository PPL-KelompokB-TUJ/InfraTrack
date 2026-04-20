import { useState } from 'react';
import { AlertCircle, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hash password for verification
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function FieldOfficerLoginPage({ onLoginSuccess }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      // Validate credentials against public.users table
      const { data: user, error: queryError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('email', credentials.email)
        .eq('role', 'field_officer')
        .single();

      if (queryError || !user) {
        throw new Error('Email atau password salah');
      }

      // Get password hash from officer_passwords table
      const { data: passwordRecord, error: passwordError } = await supabase
        .from('officer_passwords')
        .select('password_hash')
        .eq('user_id', user.id)
        .single();

      if (passwordError || !passwordRecord) {
        throw new Error('Password belum dikonfigurasi, hubungi admin');
      }

      // Verify password hash
      const passwordHash = await hashPassword(credentials.password);
      if (passwordHash !== passwordRecord.password_hash) {
        throw new Error('Email atau password salah');
      }

      // Store user data in localStorage
      localStorage.setItem('fieldOfficer', JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        loginTime: new Date().toISOString(),
      }));

      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Login gagal');
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
                placeholder="nama@example.com"
                required
                disabled={isLoading}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Password
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-cyan-100 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
                placeholder="Masukkan password"
                required
                disabled={isLoading}
              />
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
          <p className="text-xs font-semibold text-blue-700">💡 Informasi:</p>
          <p className="mt-1 text-xs text-blue-600">
            Hubungi admin jika Anda belum memiliki akun atau lupa password
          </p>
        </div>
      </div>
    </main>
  );
}
