// ============================================================
// HALAMAN : KelolaPromoPage
// PERAN   : manajer
// ROUTE   : /manajer/promo
// FITUR   : Kelola kode voucher diskon untuk kasir & pelanggan
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  getPromos,
  createPromo,
  updatePromo,
  togglePromo,
  deletePromo,
  ManajerPromo,
} from '../../api/manajer';

export default function KelolaPromoPage() {
  const [promos, setPromos] = useState<ManajerPromo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPromo, setEditingPromo] = useState<ManajerPromo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManajerPromo | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order: number;
    is_active: boolean;
  }>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_order: 0,
    is_active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPromos();
      setPromos(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat promo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order: 0,
      is_active: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: ManajerPromo) => {
    setEditingPromo(p);
    setFormData({
      code: p.code,
      description: p.description,
      discount_type: (p.discount_type as 'percentage' | 'fixed') || 'percentage',
      discount_value: Number(p.discount_value),
      min_order: Number(p.min_order || 0),
      is_active: Boolean(p.is_active),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggle = async (promo: ManajerPromo) => {
    try {
      await togglePromo(promo.id);
      setPromos((prev) =>
        prev.map((p) =>
          p.id === promo.id ? { ...p, is_active: !p.is_active } : p
        )
      );
      setSuccessMsg(
        `Promo "${promo.code}" sekarang ${!promo.is_active ? 'AKTIF' : 'NONAKTIF'}.`
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Gagal mengubah status promo: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFormError('Kode promo wajib diisi.');
      return;
    }
    if (formData.discount_value <= 0) {
      setFormError('Nilai diskon harus lebih besar dari 0.');
      return;
    }
    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      setFormError('Diskon persentase tidak boleh lebih dari 100%.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingPromo) {
        await updatePromo(editingPromo.id, {
          code: formData.code.toUpperCase().trim(),
          description: formData.description,
          discount_type: formData.discount_type,
          discount_value: Number(formData.discount_value),
          min_order: Number(formData.min_order || 0),
          is_active: formData.is_active,
        });
        setSuccessMsg(`Promo "${formData.code}" berhasil diperbarui.`);
      } else {
        await createPromo({
          code: formData.code.toUpperCase().trim(),
          description: formData.description,
          discount_type: formData.discount_type,
          discount_value: Number(formData.discount_value),
          min_order: Number(formData.min_order || 0),
          is_active: formData.is_active,
        });
        setSuccessMsg(`Promo baru "${formData.code}" berhasil dibuat.`);
      }

      setIsModalOpen(false);
      fetchPromos();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan promo');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deletePromo(deleteTarget.id);
      setSuccessMsg(`Promo "${deleteTarget.code}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchPromos();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Gagal menghapus promo: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  return (
    <div>
      {/* Header Halaman */}
      <div className="manajer-page-header">
        <div>
          <h1 className="manajer-page-title">Kelola Kode Promo & Diskon</h1>
          <p className="manajer-page-subtitle">
            Buat kupon diskon persentase atau nominal rupiah untuk kasir & pelanggan
          </p>
        </div>
        <button
          type="button"
          className="manajer-btn manajer-btn-primary"
          onClick={openCreateModal}
        >
          <span>＋</span> Tambah Promo Baru
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
          Memuat daftar kode promo...
        </div>
      ) : promos.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px solid #ebdccb',
            color: '#665c54',
          }}
        >
          <p style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>
            Belum ada kupon promo
          </p>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Tambahkan kupon promo diskon pertama untuk meningkatkan penjualan.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {promos.map((p) => {
            const isPercent = p.discount_type === 'percentage';
            const valDisplay = isPercent
              ? `${p.discount_value}%`
              : `Rp ${Number(p.discount_value).toLocaleString('id-ID')}`;

            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1px solid #ebdccb',
                  boxShadow: '0 4px 12px rgba(44, 24, 16, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        letterSpacing: '1px',
                        backgroundColor: '#f0e6d9',
                        color: '#844c1c',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        border: '1px dashed #844c1c',
                      }}
                    >
                      {p.code}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggle(p)}
                      style={{
                        padding: '4px 14px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: p.is_active ? '#dcfce7' : '#fee2e2',
                        color: p.is_active ? '#166534' : '#991b1b',
                      }}
                    >
                      {p.is_active ? '● AKTIF' : '○ NONAKTIF'}
                    </button>
                  </div>

                  <p style={{ fontSize: '14px', color: '#555', margin: '0 0 12px', lineHeight: 1.4 }}>
                    {p.description || 'Tidak ada keterangan'}
                  </p>

                  <div style={{ fontSize: '13px', color: '#2c1810', marginBottom: '6px' }}>
                    <strong>Potongan :</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>{valDisplay}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#2c1810', marginBottom: '16px' }}>
                    <strong>Min. Belanja :</strong>{' '}
                    {p.min_order && p.min_order > 0
                      ? `Rp ${Number(p.min_order).toLocaleString('id-ID')}`
                      : 'Tanpa minimum'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #ebdccb', paddingTop: '16px' }}>
                  <button
                    type="button"
                    className="manajer-btn"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => openEditModal(p)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="manajer-btn manajer-btn-danger"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setDeleteTarget(p)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT PROMO */}
      {isModalOpen && (
        <div className="manajer-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="manajer-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="manajer-modal-title">
              {editingPromo ? 'Edit Kode Promo' : 'Tambah Promo Baru'}
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
                <label className="manajer-form-label">Kode Kupon *</label>
                <input
                  type="text"
                  className="manajer-form-input"
                  placeholder="Contoh: DISKON20"
                  style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  required
                />
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Deskripsi Promo *</label>
                <textarea
                  rows={2}
                  className="manajer-form-textarea"
                  placeholder="Contoh: Diskon 20% khusus pesanan kopi sore"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="manajer-form-group">
                  <label className="manajer-form-label">Tipe Diskon *</label>
                  <select
                    className="manajer-form-select"
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Rupiah (Rp)</option>
                  </select>
                </div>

                <div className="manajer-form-group">
                  <label className="manajer-form-label">
                    Nilai Diskon ({formData.discount_type === 'percentage' ? '%' : 'Rp'}) *
                  </label>
                  <input
                    type="number"
                    className="manajer-form-input"
                    min="1"
                    value={formData.discount_value || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: Number(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Minimum Belanja (Rp)</label>
                <input
                  type="number"
                  className="manajer-form-input"
                  min="0"
                  step="5000"
                  placeholder="0 (Jika tanpa minimum)"
                  value={formData.min_order || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, min_order: Number(e.target.value) })
                  }
                />
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Status Kupon</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="is_active"
                      checked={formData.is_active === true}
                      onChange={() => setFormData({ ...formData, is_active: true })}
                    />
                    Aktif (Dapat digunakan)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="is_active"
                      checked={formData.is_active === false}
                      onChange={() => setFormData({ ...formData, is_active: false })}
                    />
                    Nonaktif
                  </label>
                </div>
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
                  {submitting ? 'Menyimpan...' : 'Simpan Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PROMO */}
      {deleteTarget && (
        <div className="manajer-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div
            className="manajer-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <h2 className="manajer-modal-title" style={{ color: '#dc2626', borderColor: '#dc2626' }}>
              Hapus Promo
            </h2>
            <p style={{ fontSize: '15px', color: '#2c1810', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus kode promo <strong>"{deleteTarget.code}"</strong>?
            </p>
            <p style={{ fontSize: '13px', color: '#665c54' }}>
              Kupon ini tidak akan bisa digunakan lagi oleh kasir atau pelanggan saat checkout.
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
                Hapus Kupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
