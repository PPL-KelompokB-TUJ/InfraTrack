import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../lib/utils';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
} from '../lib/profileService';

// ── helpers ──────────────────────────────────────────────────────────────────

function validate({ name, phone, email }) {
  const errors = {};
  if (!name || !name.trim()) {
    errors.name = 'Nama tidak boleh kosong.';
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Format email tidak valid.';
  }
  if (phone && !/^\d+$/.test(phone.trim())) {
    errors.phone = 'Nomor telepon hanya boleh berisi angka.';
  }
  return errors;
}

function validatePassword({ currentPassword, newPassword, confirmPassword }) {
  const errors = {};
  if (!currentPassword) errors.currentPassword = 'Kata sandi lama wajib diisi.';
  if (!newPassword || newPassword.length < 8) {
    errors.newPassword = 'Kata sandi baru minimal 8 karakter.';
  }
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok.';
  }
  return errors;
}

/** Center-crop an image blob/file to a square, returning a new Blob */
async function centerCropSquare(file, outputSize = 400) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const size = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - size) / 2;
      const sy = (img.naturalHeight - size) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, size, size, 0, 0, outputSize, outputSize);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Gagal memproses gambar.'));
        },
        'image/jpeg',
        0.9,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal membaca file gambar.'));
    };

    img.src = url;
  });
}

// ── sub-components ────────────────────────────────────────────────────────────

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-xs text-error flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px]">error</span>
      {msg}
    </p>
  );
}

function Alert({ type, message, onClose }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium',
        isSuccess
          ? 'bg-secondary-container text-on-secondary-container'
          : 'bg-error-container text-on-error-container',
      )}
    >
      <span className="material-symbols-outlined text-[20px] mt-0.5 shrink-0">
        {isSuccess ? 'check_circle' : 'cancel'}
      </span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function ProfileSettingsPage() {
  // ── profile state
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState('');

  // ── profile form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileAlert, setProfileAlert] = useState(null); // { type, message }

  // ── avatar state
  const [avatarPreview, setAvatarPreview] = useState('');
  const [pendingAvatarBlob, setPendingAvatarBlob] = useState(null);
  const [pendingAvatarExt, setPendingAvatarExt] = useState('jpg');
  const fileInputRef = useRef(null);

  // ── password form state
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdErrors, setPwdErrors] = useState({});
  const [isSavingPwd, setIsSavingPwd] = useState(false);
  const [pwdAlert, setPwdAlert] = useState(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // ── load profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoadingProfile(true);
        const data = await getProfile();
        if (!mounted) return;
        setProfile(data);
        setName(data.name);
        setPhone(data.phone);
        setAvatarPreview(data.profile_photo || '');
      } catch (err) {
        if (mounted) setLoadError(err.message);
      } finally {
        if (mounted) setIsLoadingProfile(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── avatar selection & auto-crop ──────────────────────────────────────────
  const handleAvatarChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validate type
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setProfileAlert({ type: 'error', message: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.' });
      return;
    }
    // validate size (2 MB)
    if (file.size > 2 * 1024 * 1024) {
      setProfileAlert({ type: 'error', message: 'Ukuran file maksimal 2 MB.' });
      return;
    }

    try {
      const cropped = await centerCropSquare(file, 400);
      const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
      setPendingAvatarBlob(cropped);
      setPendingAvatarExt(ext);
      setAvatarPreview(URL.createObjectURL(cropped));
      setProfileAlert(null);
    } catch (err) {
      setProfileAlert({ type: 'error', message: err.message });
    }

    // reset input so the same file can be selected again
    e.target.value = '';
  }, []);

  // ── save profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = useCallback(async () => {
    const errors = validate({ name, phone, email: profile?.email });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSavingProfile(true);
    setProfileAlert(null);

    try {
      let photoUrl = undefined;

      if (pendingAvatarBlob) {
        // create a File from the cropped Blob for the upload function
        const avatarFile = new File(
          [pendingAvatarBlob],
          `avatar.${pendingAvatarExt}`,
          { type: pendingAvatarBlob.type || 'image/jpeg' },
        );
        photoUrl = await uploadAvatar(avatarFile);
        setPendingAvatarBlob(null);
      }

      await updateProfile({ name, phone, profile_photo: photoUrl });

      setProfile((prev) => ({
        ...prev,
        name,
        phone,
        ...(photoUrl ? { profile_photo: photoUrl } : {}),
      }));

      setProfileAlert({ type: 'success', message: 'Profil berhasil diperbarui.' });
    } catch (err) {
      setProfileAlert({ type: 'error', message: err.message });
    } finally {
      setIsSavingProfile(false);
    }
  }, [name, phone, profile, pendingAvatarBlob, pendingAvatarExt]);

  // ── change password ───────────────────────────────────────────────────────
  const handleChangePassword = useCallback(async () => {
    const errors = validatePassword(pwdForm);
    if (Object.keys(errors).length > 0) {
      setPwdErrors(errors);
      return;
    }
    setPwdErrors({});
    setIsSavingPwd(true);
    setPwdAlert(null);

    try {
      await changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwdAlert({ type: 'success', message: 'Kata sandi berhasil diubah.' });
    } catch (err) {
      setPwdAlert({ type: 'error', message: err.message });
    } finally {
      setIsSavingPwd(false);
    }
  }, [pwdForm]);

  const toggleShow = (field) =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  // ── loading / error states ────────────────────────────────────────────────
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">
            progress_activity
          </span>
          <p className="text-on-surface-variant text-sm">Memuat profil…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-3 max-w-sm">
          <span className="material-symbols-outlined text-4xl text-error">error_outline</span>
          <p className="text-on-surface font-medium">Gagal memuat profil</p>
          <p className="text-on-surface-variant text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  const roleLabel =
    profile?.role === 'admin'
      ? 'Administrator'
      : profile?.role === 'field_officer'
      ? 'Petugas Lapangan'
      : 'Pengguna';

  const avatarSrc =
    avatarPreview ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email || 'user'}`;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* ── header */}
      <div>
        <h1 className="text-2xl font-black text-on-surface">Pengaturan Profil</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Kelola informasi akun dan keamanan Anda
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CARD 1 — Photo & Info
      ══════════════════════════════════════════════════════════ */}
      <div className="bg-surface-container-low rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8 space-y-6">
        <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">person</span>
          Informasi Profil
        </h2>

        {profileAlert && (
          <Alert
            type={profileAlert.type}
            message={profileAlert.message}
            onClose={() => setProfileAlert(null)}
          />
        )}

        {/* ── avatar section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* avatar preview */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary/20 shadow-md bg-surface-variant">
              <img
                src={avatarSrc}
                alt="Foto profil"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email || 'user'}`;
                }}
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors active:scale-95"
              title="Ganti foto"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <p className="font-bold text-on-surface text-lg">{profile?.name || '—'}</p>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary-container">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              {roleLabel}
            </span>
            <p className="text-xs text-on-surface-variant">{profile?.email}</p>

            <div className="pt-2 space-y-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Ganti foto profil
              </button>
              {pendingAvatarBlob && (
                <p className="text-xs text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">info</span>
                  Foto baru dipilih — simpan profil untuk menerapkan.
                </p>
              )}
              <p className="text-xs text-on-surface-variant">
                JPG, PNG, atau WebP. Maks. 2 MB. Otomatis di-crop ke rasio 1:1.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* ── divider */}
        <div className="border-t border-outline-variant/30" />

        {/* ── form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Name */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              Nama Lengkap <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: '' })); }}
              placeholder="Masukkan nama lengkap"
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border bg-surface text-on-surface text-sm outline-none transition-all',
                fieldErrors.name
                  ? 'border-error focus:ring-2 focus:ring-error/30'
                  : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20',
              )}
            />
            <FieldError msg={fieldErrors.name} />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={profile?.email || ''}
                readOnly
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant text-sm cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-on-surface-variant/60">
                lock
              </span>
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">
              Email tidak dapat diubah melalui halaman ini.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              Nomor Telepon
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                // only allow digits
                const val = e.target.value.replace(/[^\d]/g, '');
                setPhone(val);
                setFieldErrors((p) => ({ ...p, phone: '' }));
              }}
              placeholder="Contoh: 08123456789"
              inputMode="numeric"
              className={cn(
                'w-full px-4 py-2.5 rounded-xl border bg-surface text-on-surface text-sm outline-none transition-all',
                fieldErrors.phone
                  ? 'border-error focus:ring-2 focus:ring-error/30'
                  : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20',
              )}
            />
            <FieldError msg={fieldErrors.phone} />
          </div>
        </div>

        {/* ── save button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {isSavingProfile ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Menyimpan…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                Simpan Profil
              </>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          CARD 2 — Change Password
      ══════════════════════════════════════════════════════════ */}
      <div className="bg-surface-container-low rounded-2xl shadow-sm border border-outline-variant/30 p-6 md:p-8 space-y-6">
        <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">lock</span>
          Ubah Kata Sandi
        </h2>

        {pwdAlert && (
          <Alert
            type={pwdAlert.type}
            message={pwdAlert.message}
            onClose={() => setPwdAlert(null)}
          />
        )}

        <div className="space-y-4">
          {/* Current password */}
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">
              Kata Sandi Lama <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={pwdForm.currentPassword}
                onChange={(e) => {
                  setPwdForm((p) => ({ ...p, currentPassword: e.target.value }));
                  setPwdErrors((p) => ({ ...p, currentPassword: '' }));
                }}
                placeholder="Masukkan kata sandi lama"
                className={cn(
                  'w-full px-4 py-2.5 pr-11 rounded-xl border bg-surface text-on-surface text-sm outline-none transition-all',
                  pwdErrors.currentPassword
                    ? 'border-error focus:ring-2 focus:ring-error/30'
                    : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20',
                )}
              />
              <button
                type="button"
                onClick={() => toggleShow('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPasswords.current ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <FieldError msg={pwdErrors.currentPassword} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New password */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">
                Kata Sandi Baru <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={pwdForm.newPassword}
                  onChange={(e) => {
                    setPwdForm((p) => ({ ...p, newPassword: e.target.value }));
                    setPwdErrors((p) => ({ ...p, newPassword: '', confirmPassword: '' }));
                  }}
                  placeholder="Min. 8 karakter"
                  className={cn(
                    'w-full px-4 py-2.5 pr-11 rounded-xl border bg-surface text-on-surface text-sm outline-none transition-all',
                    pwdErrors.newPassword
                      ? 'border-error focus:ring-2 focus:ring-error/30'
                      : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20',
                  )}
                />
                <button
                  type="button"
                  onClick={() => toggleShow('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPasswords.new ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <FieldError msg={pwdErrors.newPassword} />
              {/* strength bar */}
              {pwdForm.newPassword && (
                <PasswordStrength password={pwdForm.newPassword} />
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">
                Konfirmasi Kata Sandi Baru <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={pwdForm.confirmPassword}
                  onChange={(e) => {
                    setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }));
                    setPwdErrors((p) => ({ ...p, confirmPassword: '' }));
                  }}
                  placeholder="Ulangi kata sandi baru"
                  className={cn(
                    'w-full px-4 py-2.5 pr-11 rounded-xl border bg-surface text-on-surface text-sm outline-none transition-all',
                    pwdErrors.confirmPassword
                      ? 'border-error focus:ring-2 focus:ring-error/30'
                      : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20',
                  )}
                />
                <button
                  type="button"
                  onClick={() => toggleShow('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPasswords.confirm ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <FieldError msg={pwdErrors.confirmPassword} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleChangePassword}
            disabled={isSavingPwd}
            className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-on-secondary font-bold rounded-xl shadow-sm hover:bg-secondary/90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {isSavingPwd ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Memproses…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">key</span>
                Ubah Kata Sandi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── password strength indicator ───────────────────────────────────────────────

function PasswordStrength({ password }) {
  const score = getPasswordScore(password);
  const bars = [
    score >= 1 ? 'bg-error' : 'bg-outline-variant',
    score >= 2 ? (score <= 2 ? 'bg-tertiary' : 'bg-secondary') : 'bg-outline-variant',
    score >= 3 ? 'bg-secondary' : 'bg-outline-variant',
    score >= 4 ? 'bg-primary' : 'bg-outline-variant',
  ];
  const labels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {bars.map((cls, i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', cls)} />
        ))}
      </div>
      {score > 0 && (
        <p className="text-[11px] text-on-surface-variant">{labels[score]}</p>
      )}
    </div>
  );
}

function getPasswordScore(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}
