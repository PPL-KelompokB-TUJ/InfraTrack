import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
} from '../lib/profileService';

// ── helpers ───────────────────────────────────────────────────────────────────

function validate({ name, phone, email }) {
  const errors = {};
  if (!name || !name.trim()) errors.name = 'Nama tidak boleh kosong.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Format email tidak valid.';
  if (phone && !/^\d+$/.test(phone.trim()))
    errors.phone = 'Nomor telepon hanya boleh berisi angka.';
  return errors;
}

function validatePassword({ currentPassword, newPassword, confirmPassword }) {
  const errors = {};
  if (!currentPassword) errors.currentPassword = 'Kata sandi lama wajib diisi.';
  if (!newPassword || newPassword.length < 8)
    errors.newPassword = 'Kata sandi baru minimal 8 karakter.';
  if (newPassword && confirmPassword && newPassword !== confirmPassword)
    errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok.';
  return errors;
}

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
      canvas.getContext('2d').drawImage(img, sx, sy, size, size, 0, 0, outputSize, outputSize);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Gagal memproses gambar.'))),
        'image/jpeg',
        0.9,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gagal membaca file.')); };
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
  const ok = type === 'success';
  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium',
      ok ? 'bg-secondary-container text-on-secondary-container'
         : 'bg-error-container text-on-error-container',
    )}>
      <span className="material-symbols-outlined text-[20px] mt-0.5 shrink-0">
        {ok ? 'check_circle' : 'cancel'}
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

function SectionHeader({ icon, title, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
        {title}
      </h2>
      {children && <div className="flex items-center gap-4 shrink-0">{children}</div>}
    </div>
  );
}

function ActionLink({ onClick, danger, children }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-sm font-semibold transition-colors',
        danger ? 'text-error hover:text-error/80' : 'text-primary hover:text-primary/80',
      )}
    >
      {children}
    </button>
  );
}

function getPasswordScore(pwd) {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

function PasswordStrength({ password }) {
  const score = getPasswordScore(password);
  const colors = [
    score >= 1 ? 'bg-error' : 'bg-outline-variant',
    score >= 2 ? (score <= 2 ? 'bg-tertiary' : 'bg-secondary') : 'bg-outline-variant',
    score >= 3 ? 'bg-secondary' : 'bg-outline-variant',
    score >= 4 ? 'bg-primary' : 'bg-outline-variant',
  ];
  const labels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {colors.map((c, i) => <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', c)} />)}
      </div>
      {score > 0 && <p className="text-[11px] text-on-surface-variant">{labels[score]}</p>}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function ProfileSettingsPage() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [avatarPreview, setAvatarPreview] = useState('');
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [avatarAlert, setAvatarAlert] = useState(null);
  const fileInputRef = useRef(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileAlert, setProfileAlert] = useState(null);

  const [editingPassword, setEditingPassword] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [isSavingPwd, setIsSavingPwd] = useState(false);
  const [pwdAlert, setPwdAlert] = useState(null);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoadingProfile(true);
        const data = await getProfile();
        if (!mounted) return;
        setProfile(data);
        setName(data.name);
        setPhone(data.phone || '');
        setAvatarPreview(data.profile_photo || '');
      } catch (err) {
        if (mounted) setLoadError(err.message);
      } finally {
        if (mounted) setIsLoadingProfile(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAvatarChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setAvatarAlert({ type: 'error', message: 'Format tidak didukung. Gunakan JPG, PNG, atau WebP.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarAlert({ type: 'error', message: 'Ukuran file maksimal 2 MB.' });
      return;
    }
    try {
      const cropped = await centerCropSquare(file, 400);
      const ext = file.name.split('.').pop().toLowerCase() || 'jpg';
      setAvatarPreview(URL.createObjectURL(cropped));
      setAvatarAlert(null);
      const avatarFile = new File([cropped], `avatar.${ext}`, { type: cropped.type || 'image/jpeg' });
      const photoUrl = await uploadAvatar(avatarFile);
      await updateProfile({ profile_photo: photoUrl });
      setProfile((p) => ({ ...p, profile_photo: photoUrl }));
      setAvatarAlert({ type: 'success', message: 'Foto profil berhasil diperbarui.' });
    } catch (err) {
      setAvatarAlert({ type: 'error', message: err.message });
    }
    e.target.value = '';
  }, []);

  const handleRemoveAvatar = useCallback(async () => {
    setIsRemovingAvatar(true);
    setAvatarAlert(null);
    try {
      await updateProfile({ profile_photo: null });
      setProfile((p) => ({ ...p, profile_photo: null }));
      setAvatarPreview('');
      setAvatarAlert({ type: 'success', message: 'Foto profil berhasil dihapus.' });
    } catch (err) {
      setAvatarAlert({ type: 'error', message: err.message });
    } finally {
      setIsRemovingAvatar(false);
    }
  }, []);

  const cancelProfileEdit = () => {
    setName(profile?.name || '');
    setPhone(profile?.phone || '');
    setFieldErrors({});
    setProfileAlert(null);
    setEditingProfile(false);
  };

  const handleSaveProfile = useCallback(async () => {
    const errors = validate({ name, phone, email: profile?.email });
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setIsSavingProfile(true);
    setProfileAlert(null);
    try {
      await updateProfile({ name, phone });
      setProfile((p) => ({ ...p, name, phone }));
      setProfileAlert({ type: 'success', message: 'Profil berhasil diperbarui.' });
      setEditingProfile(false);
    } catch (err) {
      setProfileAlert({ type: 'error', message: err.message });
    } finally {
      setIsSavingProfile(false);
    }
  }, [name, phone, profile]);

  const cancelPasswordEdit = () => {
    setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPwdErrors({});
    setPwdAlert(null);
    setEditingPassword(false);
  };

  const handleChangePassword = useCallback(async () => {
    const errors = validatePassword(pwdForm);
    if (Object.keys(errors).length > 0) { setPwdErrors(errors); return; }
    setPwdErrors({});
    setIsSavingPwd(true);
    setPwdAlert(null);
    try {
      await changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwdAlert({ type: 'success', message: 'Kata sandi berhasil diubah.' });
      setEditingPassword(false);
    } catch (err) {
      setPwdAlert({ type: 'error', message: err.message });
    } finally {
      setIsSavingPwd(false);
    }
  }, [pwdForm]);

  const toggleShow = (field) => setShowPasswords((p) => ({ ...p, [field]: !p[field] }));

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
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
    profile?.role === 'admin' ? 'Administrator' :
    profile?.role === 'field_officer' ? 'Petugas Lapangan' : 'Pengguna';

  const avatarSrc =
    avatarPreview ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email || 'user'}`;

  const hasCustomAvatar = !!(avatarPreview || profile?.profile_photo);

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-black text-on-surface">Pengaturan</h1>
        <p className="text-sm text-on-surface-variant mt-1">Kelola informasi akun dan keamanan Anda</p>
      </div>

      <div className="bg-surface-container-low rounded-2xl shadow-sm border border-outline-variant/30 divide-y divide-outline-variant/30">

        {/* ── Avatar ── */}
        <div className="p-6 md:p-7 space-y-4">
          <SectionHeader icon="account_circle" title="Avatar">
            {hasCustomAvatar && (
              <ActionLink danger onClick={handleRemoveAvatar}>
                {isRemovingAvatar ? 'Menghapus…' : 'Hapus Avatar'}
              </ActionLink>
            )}
            <ActionLink onClick={() => fileInputRef.current?.click()}>
              Ganti Avatar
            </ActionLink>
          </SectionHeader>

          {avatarAlert && (
            <Alert type={avatarAlert.type} message={avatarAlert.message} onClose={() => setAvatarAlert(null)} />
          )}

          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-outline-variant bg-surface-variant shrink-0">
              <img
                src={avatarSrc}
                alt="Foto profil"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email || 'user'}`;
                }}
              />
            </div>
            <div className="text-sm text-on-surface-variant space-y-1">
              <p className="font-semibold text-on-surface">{profile?.name || '—'}</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-primary-container text-on-primary-container">
                <span className="material-symbols-outlined text-[12px]">verified</span>
                {roleLabel}
              </span>
              <p className="text-xs pt-0.5">JPG, PNG, atau WebP. Maks. 2 MB.</p>
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

        {/* ── Pengaturan Profil ── */}
        <div className="p-6 md:p-7 space-y-4">
          <SectionHeader icon="person" title="Pengaturan Profil">
            {editingProfile ? (
              <ActionLink onClick={cancelProfileEdit}>Batal</ActionLink>
            ) : (
              <ActionLink onClick={() => setEditingProfile(true)}>Edit Profil</ActionLink>
            )}
          </SectionHeader>

          {profileAlert && (
            <Alert type={profileAlert.type} message={profileAlert.message} onClose={() => setProfileAlert(null)} />
          )}

          {editingProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profile?.email || ''}
                      readOnly
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant text-sm cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-on-surface-variant/60">lock</span>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">Email tidak dapat diubah.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">Nomor Telepon</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/[^\d]/g, '')); setFieldErrors((p) => ({ ...p, phone: '' })); }}
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
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={cancelProfileEdit} className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-variant transition-colors">
                  Batal
                </button>
                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-sm">
                  {isSavingProfile
                    ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Menyimpan…</>
                    : <><span className="material-symbols-outlined text-[18px]">save</span>Simpan Profil</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="text-on-surface-variant">
                <span className="font-semibold text-on-surface">Nama: </span>{profile?.name || '—'}
              </p>
              <p className="text-on-surface-variant">
                <span className="font-semibold text-on-surface">Email: </span>{profile?.email || '—'}
              </p>
              {profile?.phone && (
                <p className="text-on-surface-variant">
                  <span className="font-semibold text-on-surface">Telepon: </span>{profile.phone}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Keamanan & Kata Sandi ── */}
        <div className="p-6 md:p-7 space-y-4">
          <SectionHeader icon="lock" title="Keamanan & Kata Sandi">
            {editingPassword ? (
              <ActionLink onClick={cancelPasswordEdit}>Batal</ActionLink>
            ) : (
              <ActionLink onClick={() => setEditingPassword(true)}>Edit Kata Sandi</ActionLink>
            )}
          </SectionHeader>

          {pwdAlert && (
            <Alert type={pwdAlert.type} message={pwdAlert.message} onClose={() => setPwdAlert(null)} />
          )}

          {editingPassword ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  Kata Sandi Lama <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={pwdForm.currentPassword}
                    onChange={(e) => { setPwdForm((p) => ({ ...p, currentPassword: e.target.value })); setPwdErrors((p) => ({ ...p, currentPassword: '' })); }}
                    placeholder="Masukkan kata sandi lama"
                    className={cn(
                      'w-full px-4 py-2.5 pr-11 rounded-xl border bg-surface text-on-surface text-sm outline-none transition-all',
                      pwdErrors.currentPassword
                        ? 'border-error focus:ring-2 focus:ring-error/30'
                        : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20',
                    )}
                  />
                  <button type="button" onClick={() => toggleShow('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined text-[20px]">{showPasswords.current ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <FieldError msg={pwdErrors.currentPassword} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    Kata Sandi Baru <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={pwdForm.newPassword}
                      onChange={(e) => { setPwdForm((p) => ({ ...p, newPassword: e.target.value })); setPwdErrors((p) => ({ ...p, newPassword: '', confirmPassword: '' })); }}
                      placeholder="Min. 8 karakter"
                      className={cn(
                        'w-full px-4 py-2.5 pr-11 rounded-xl border bg-surface text-on-surface text-sm outline-none transition-all',
                        pwdErrors.newPassword
                          ? 'border-error focus:ring-2 focus:ring-error/30'
                          : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20',
                      )}
                    />
                    <button type="button" onClick={() => toggleShow('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined text-[20px]">{showPasswords.new ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  <FieldError msg={pwdErrors.newPassword} />
                  {pwdForm.newPassword && <PasswordStrength password={pwdForm.newPassword} />}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    Konfirmasi Kata Sandi Baru <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={pwdForm.confirmPassword}
                      onChange={(e) => { setPwdForm((p) => ({ ...p, confirmPassword: e.target.value })); setPwdErrors((p) => ({ ...p, confirmPassword: '' })); }}
                      placeholder="Ulangi kata sandi baru"
                      className={cn(
                        'w-full px-4 py-2.5 pr-11 rounded-xl border bg-surface text-on-surface text-sm outline-none transition-all',
                        pwdErrors.confirmPassword
                          ? 'border-error focus:ring-2 focus:ring-error/30'
                          : 'border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20',
                      )}
                    />
                    <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined text-[20px]">{showPasswords.confirm ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  <FieldError msg={pwdErrors.confirmPassword} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={cancelPasswordEdit} className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-variant transition-colors">
                  Batal
                </button>
                <button onClick={handleChangePassword} disabled={isSavingPwd} className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-on-secondary font-bold rounded-xl shadow-sm hover:bg-secondary/90 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-sm">
                  {isSavingPwd
                    ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Memproses…</>
                    : <><span className="material-symbols-outlined text-[18px]">key</span>Ubah Kata Sandi</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="text-on-surface-variant">
                <span className="font-semibold text-on-surface">Kata Sandi Anda: </span>
                <span className="tracking-widest">••••••••</span>
              </p>
              <p className="text-on-surface-variant">
                <span className="font-semibold text-on-surface">Terakhir Diubah: </span>
                {profile?.password_changed_at
                  ? new Date(profile.password_changed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          )}
        </div>

        {/* ── Preferensi Tampilan (PBI-19: Dark Mode) ── */}
        <div className="p-6 md:p-7 space-y-4">
          <SectionHeader icon="palette" title="Preferensi Tampilan" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
                {isDarkMode ? 'dark_mode' : 'light_mode'}
              </span>
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  {isDarkMode ? 'Mode Gelap' : 'Mode Terang'}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isDarkMode
                    ? 'Tampilan saat ini menggunakan tema gelap'
                    : 'Tampilan saat ini menggunakan tema terang'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              id="dark-mode-toggle"
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className={cn(
                'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2',
                isDarkMode ? 'bg-primary' : 'bg-outline-variant',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-200',
                  isDarkMode ? 'translate-x-5' : 'translate-x-0',
                )}
              >
                <span
                  className={cn(
                    'material-symbols-outlined text-[12px] transition-colors',
                    isDarkMode ? 'text-primary' : 'text-outline-variant',
                  )}
                >
                  {isDarkMode ? 'dark_mode' : 'light_mode'}
                </span>
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
