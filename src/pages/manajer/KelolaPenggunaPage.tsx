// ============================================================
// HALAMAN : KelolaPenggunaPage
// PERAN   : manajer
// ROUTE   : /manajer/pengguna
// DESAIN  : Sesuai Figma User Management.png, Edit User.png, Hapus User.png
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  getUsers,
  createUser,
  deleteUser,
  ManajerUser,
} from '../../api/manajer';

export default function KelolaPenggunaPage() {
  const [users, setUsers] = useState<ManajerUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Current logged in user from localStorage
  const currentLoggedUser = (() => {
    try {
      const stored = localStorage.getItem('etacafe_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<ManajerUser | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email_or_phone: string;
    password: string;
    role: 'pelanggan' | 'kasir' | 'dapur' | 'manajer';
  }>({
    name: '',
    email_or_phone: '',
    password: '',
    role: 'kasir',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Submit Tambah Pengguna Baru
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email_or_phone.trim()) {
      setFormError('Nama dan Email/Nomor HP wajib diisi.');
      return;
    }
    if (formData.password.length < 6) {
      setFormError('Password minimal harus 6 karakter.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      await createUser(formData);
      setSuccessMsg(`Pengguna "${formData.name}" (${formData.role}) berhasil ditambahkan.`);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email_or_phone: '',
        password: '',
        role: 'kasir',
      });
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menambahkan staf baru');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Hapus Pengguna
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    // BR-11: Cek apakah user menghapus dirinya sendiri
    if (
      currentLoggedUser &&
      (String(currentLoggedUser.id) === String(deleteTarget.id) ||
        currentLoggedUser.email_or_phone === deleteTarget.email_or_phone)
    ) {
      alert('Tidak diperbolehkan menghapus akun sendiri yang sedang aktif (BR-11).');
      setDeleteTarget(null);
      return;
    }

    try {
      await deleteUser(deleteTarget.id);
      setSuccessMsg(`Akun "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Gagal menghapus akun: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  // Group users by role
  const rolesOrder: Array<{ key: string; label: string; desc: string }> = [
    { key: 'manajer', label: 'Admin / Manajer', desc: 'Akses penuh ke laporan, menu, pengguna, dan promo' },
    { key: 'kasir', label: 'Kasir', desc: 'Mengelola pesanan masuk, pembayaran, dan cetak struk' },
    { key: 'dapur', label: 'Dapur', desc: 'Memproses antrean pesanan makanan & minuman' },
    { key: 'pelanggan', label: 'Pelanggan', desc: 'Akun pelanggan yang terdaftar pada sistem' },
  ];

  return (
    <div>
      {/* Header Halaman */}
      <div className="manajer-page-header">
        <div>
          <h1 className="manajer-page-title">User Management</h1>
          <p className="manajer-page-subtitle">
            Kelola staf operasional (Kasir, Dapur, Manajer) dan akun pelanggan EtaCafe
          </p>
        </div>
        <button
          type="button"
          className="manajer-btn manajer-btn-primary"
          onClick={() => {
            setFormData({
              name: '',
              email_or_phone: '',
              password: '',
              role: 'kasir',
            });
            setFormError(null);
            setIsAddModalOpen(true);
          }}
        >
          <span>＋</span> Tambah Pengguna Baru
        </button>
      </div>

      {/* Alert Notifikasi */}
      {successMsg && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            color: '#166534',
            padding: '12px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontWeight: 600,
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '12px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Daftar Pengguna Dikelompokkan Berdasarkan Role Sesuai Figma User Management.png */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#665c54' }}>
          Memuat daftar seluruh pengguna...
        </div>
      ) : (
        <div>
          {rolesOrder.map(({ key, label, desc }) => {
            const roleUsers = users.filter(
              (u) => u.role?.toLowerCase() === key.toLowerCase()
            );

            return (
              <section key={key} className="manajer-user-role-section">
                <div className="manajer-user-role-title">
                  <div>
                    <span>{label}</span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#665c54',
                        marginLeft: '12px',
                      }}
                    >
                      ({roleUsers.length} pengguna)
                    </span>
                  </div>
                </div>

                {roleUsers.length === 0 ? (
                  <div
                    style={{
                      padding: '16px 20px',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px dashed #ebdccb',
                      color: '#8c7e75',
                      fontSize: '13px',
                    }}
                  >
                    Belum ada pengguna untuk role {label}.
                  </div>
                ) : (
                  <div>
                    {roleUsers.map((u) => {
                      const isMe =
                        currentLoggedUser &&
                        (String(currentLoggedUser.id) === String(u.id) ||
                          currentLoggedUser.email_or_phone === u.email_or_phone);

                      return (
                        <div key={u.id} className="manajer-user-card">
                          <div>
                            <div className="manajer-user-info-field">
                              <strong>Nama</strong> : {u.name}
                              {isMe && (
                                <span
                                  style={{
                                    backgroundColor: '#844c1c',
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    marginLeft: '8px',
                                    fontWeight: 700,
                                  }}
                                >
                                  Akun Anda
                                </span>
                              )}
                            </div>
                            <div className="manajer-user-info-field">
                              <strong>Kontak</strong> : {u.email_or_phone || u.emailOrPhone}
                            </div>
                            <div className="manajer-user-info-field" style={{ color: '#665c54', fontSize: '12px' }}>
                              <strong>Role</strong> : <span style={{ textTransform: 'uppercase' }}>{u.role}</span>
                            </div>
                          </div>

                          <div className="manajer-user-action-btns">
                            <button
                              type="button"
                              className="manajer-btn manajer-btn-danger"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                              title={isMe ? 'Tidak bisa menghapus akun sendiri (BR-11)' : 'Hapus pengguna'}
                              disabled={Boolean(isMe)}
                              onClick={() => setDeleteTarget(u)}
                            >
                              🗑️ Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH PENGGUNA BARU */}
      {isAddModalOpen && (
        <div className="manajer-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="manajer-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="manajer-modal-title">Tambah Pengguna Baru</h2>

            {formError && (
              <div
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}
              >
                ⚠ {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div className="manajer-form-group">
                <label className="manajer-form-label">Nama Lengkap *</label>
                <input
                  type="text"
                  className="manajer-form-input"
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Email atau No. Handphone *</label>
                <input
                  type="text"
                  className="manajer-form-input"
                  placeholder="Contoh: kasir@etacafe.com atau 08123456789"
                  value={formData.email_or_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, email_or_phone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Password *</label>
                <input
                  type="password"
                  className="manajer-form-input"
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Role Akses *</label>
                <select
                  className="manajer-form-select"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as 'pelanggan' | 'kasir' | 'dapur' | 'manajer',
                    })
                  }
                >
                  <option value="kasir">Kasir (Kelola POS & Pembayaran)</option>
                  <option value="dapur">Dapur (Kelola Antrean Memasak)</option>
                  <option value="manajer">Manajer / Admin (Akses Penuh)</option>
                  <option value="pelanggan">Pelanggan</option>
                </select>
              </div>

              <div className="manajer-modal-actions">
                <button
                  type="button"
                  className="manajer-btn"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="manajer-btn manajer-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Tambah Staf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PENGGUNA (FIGMA: Hapus User.png) */}
      {deleteTarget && (
        <div className="manajer-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div
            className="manajer-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <h2 className="manajer-modal-title" style={{ color: '#dc2626', borderColor: '#dc2626' }}>
              Hapus Pengguna
            </h2>
            <p style={{ fontSize: '15px', color: '#2c1810', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus akun staf <strong>"{deleteTarget.name}"</strong> ({deleteTarget.role})?
            </p>
            <p style={{ fontSize: '13px', color: '#665c54' }}>
              Tindakan ini tidak dapat dibatalkan. Pengguna ini tidak akan bisa login kembali.
            </p>

            <div className="manajer-modal-actions">
              <button
                type="button"
                className="manajer-btn"
                onClick={() => setDeleteTarget(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="manajer-btn manajer-btn-danger"
                onClick={confirmDelete}
              >
                Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
