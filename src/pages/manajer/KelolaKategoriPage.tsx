// ============================================================
// HALAMAN : KelolaKategoriPage
// PERAN   : manajer
// ROUTE   : /manajer/kategori
// FITUR   : Tambah, Edit, Hapus Kategori dengan proteksi BR-13
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenus,
  ManajerCategory,
  ManajerMenuItem,
} from '../../api/manajer';

export default function KelolaKategoriPage() {
  const [categories, setCategories] = useState<ManajerCategory[]>([]);
  const [menus, setMenus] = useState<ManajerMenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<ManajerCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManajerCategory | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [catData, menuData] = await Promise.all([
        getCategories(),
        getMenus(),
      ]);
      setCategories(catData);
      setMenus(menuData);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: ManajerCategory) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, slug: cat.slug });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setFormData({ name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setFormError('Nama dan slug kategori wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        setSuccessMsg(`Kategori "${formData.name}" berhasil diperbarui.`);
      } else {
        await createCategory(formData);
        setSuccessMsg(`Kategori "${formData.name}" berhasil dibuat.`);
      }

      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan kategori');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteCategory(deleteTarget.id);
      setSuccessMsg(`Kategori "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Gagal menghapus kategori: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  // Hitung jumlah item menu per kategori
  const getMenuItemCount = (catId: number | string) => {
    return menus.filter(
      (m) => String(m.category_id || m.category_rel?.id) === String(catId)
    ).length;
  };

  return (
    <div>
      {/* Header Halaman */}
      <div className="manajer-page-header">
        <div>
          <h1 className="manajer-page-title">Kelola Kategori Menu</h1>
          <p className="manajer-page-subtitle">
            Klasifikasikan hidangan kafe ke dalam kategori (Kopi, Makanan Berat, Snack, Minuman)
          </p>
        </div>
        <button
          type="button"
          className="manajer-btn manajer-btn-primary"
          onClick={openCreateModal}
        >
          <span>＋</span> Tambah Kategori
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#665c54' }}>
          Memuat daftar kategori...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {categories.map((cat) => {
            const count = getMenuItemCount(cat.id);
            const canDelete = count === 0;

            return (
              <div
                key={cat.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid #ebdccb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(44, 24, 16, 0.04)',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      margin: '0 0 4px',
                      color: '#2c1810',
                    }}
                  >
                    {cat.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#8c7e75', marginBottom: '8px' }}>
                    Slug: <code>{cat.slug}</code>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      backgroundColor: count > 0 ? '#f0e6d9' : '#f3f4f6',
                      color: count > 0 ? '#844c1c' : '#6b7280',
                    }}
                  >
                    {count} Menu Terdaftar
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <button
                    type="button"
                    className="manajer-btn"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                    onClick={() => openEditModal(cat)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="manajer-btn manajer-btn-danger"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                    title={
                      canDelete
                        ? 'Hapus kategori'
                        : 'Kategori tidak dapat dihapus karena masih memiliki menu (BR-13)'
                    }
                    onClick={() => setDeleteTarget(cat)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT KATEGORI */}
      {isModalOpen && (
        <div className="manajer-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="manajer-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <h2 className="manajer-modal-title">
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h2>

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

            <form onSubmit={handleSubmit}>
              <div className="manajer-form-group">
                <label className="manajer-form-label">Nama Kategori *</label>
                <input
                  type="text"
                  className="manajer-form-input"
                  placeholder="Contoh: Kopi Spesialti"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Slug URL *</label>
                <input
                  type="text"
                  className="manajer-form-input"
                  placeholder="kopi-spesialti"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
                <span style={{ fontSize: '12px', color: '#665c54' }}>
                  Digunakan untuk identifikasi internal & API
                </span>
              </div>

              <div className="manajer-modal-actions">
                <button
                  type="button"
                  className="manajer-btn"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="manajer-btn manajer-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS KATEGORI */}
      {deleteTarget && (
        <div className="manajer-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div
            className="manajer-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <h2 className="manajer-modal-title" style={{ color: '#dc2626', borderColor: '#dc2626' }}>
              Hapus Kategori
            </h2>

            {getMenuItemCount(deleteTarget.id) > 0 ? (
              <div>
                <p style={{ fontSize: '14px', color: '#2c1810', lineHeight: 1.5 }}>
                  Kategori <strong>"{deleteTarget.name}"</strong> masih memiliki{' '}
                  <strong>{getMenuItemCount(deleteTarget.id)} menu</strong> terdaftar di dalamnya.
                </p>
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    color: '#991b1b',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: 1.4,
                    marginBottom: '20px',
                  }}
                >
                  ⚠ <strong>Aturan Keamanan (BR-13):</strong> Anda tidak dapat menghapus kategori yang masih berisi menu aktif. Silakan hapus atau pindahkan menu terkait ke kategori lain terlebih dahulu.
                </div>
                <div className="manajer-modal-actions">
                  <button
                    type="button"
                    className="manajer-btn manajer-btn-primary"
                    onClick={() => setDeleteTarget(null)}
                  >
                    Mengerti
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '14px', color: '#2c1810', lineHeight: 1.5 }}>
                  Apakah Anda yakin ingin menghapus kategori <strong>"{deleteTarget.name}"</strong>?
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
                    Ya, Hapus Kategori
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
