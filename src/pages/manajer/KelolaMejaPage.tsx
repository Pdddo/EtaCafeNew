// ============================================================
// HALAMAN : KelolaMejaPage
// PERAN   : manajer
// ROUTE   : /manajer/meja
// FITUR   : Tambah dan Hapus Meja Kafe (Dinamis untuk Pelanggan & Kasir)
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  getTables,
  createTable,
  deleteTable,
  ManajerTable,
} from '../../api/manajer';

export default function KelolaMejaPage() {
  const [tables, setTables] = useState<ManajerTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<ManajerTable | null>(null);

  // Form State
  const [tableName, setTableName] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchTablesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTables();
      setTables(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar meja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesData();
  }, []);

  const openCreateModal = () => {
    setTableName('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = tableName.trim();
    if (!cleanName) {
      setFormError('Nama atau nomor meja wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      await createTable({ name: cleanName });
      setSuccessMsg(`Meja "${cleanName}" berhasil ditambahkan.`);

      setIsModalOpen(false);
      fetchTablesData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menambahkan meja');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteTable(deleteTarget.id);
      setSuccessMsg(`Meja "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchTablesData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Gagal menghapus meja: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  return (
    <div>
      {/* Header Halaman */}
      <div className="manajer-page-header">
        <div>
          <h1 className="manajer-page-title">Kelola Meja Kafe</h1>
          <p className="manajer-page-subtitle">
            Atur meja yang tersedia untuk pemesanan Dine In (Pesan di Meja) pelanggan dan kasir
          </p>
        </div>
        <button
          type="button"
          className="manajer-btn manajer-btn-primary"
          onClick={openCreateModal}
        >
          <span>＋</span> Tambah Meja Baru
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
          Memuat daftar meja...
        </div>
      ) : tables.length === 0 ? (
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
            Belum ada meja terdaftar
          </p>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Tambahkan meja pertama Anda agar pelanggan atau kasir dapat memilih meja saat memesan.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {tables.map((t) => (
            <div
              key={t.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #ebdccb',
                boxShadow: '0 2px 8px rgba(44, 24, 16, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#f5efe6',
                    color: '#844c1c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '18px',
                  }}
                >
                  🪑
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#2c1810' }}>
                    {t.name}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                    ● Tersedia untuk Pesanan
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDeleteTarget(t)}
                title="Hapus Meja"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TAMBAH MEJA */}
      {isModalOpen && (
        <div className="manajer-modal-overlay">
          <div className="manajer-modal" style={{ maxWidth: '420px' }}>
            <div className="manajer-modal-header">
              <h2 className="manajer-modal-title">Tambah Meja Baru</h2>
              <button
                type="button"
                className="manajer-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="manajer-modal-body">
                {formError && (
                  <div
                    style={{
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '13px',
                      fontWeight: 500,
                    }}
                  >
                    ⚠ {formError}
                  </div>
                )}

                <div className="manajer-form-group">
                  <label className="manajer-form-label">
                    Nama / Nomor Meja <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="manajer-form-input"
                    placeholder="Contoh: Meja 11, Meja VIP 1, Meja Outdoor 3"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    autoFocus
                    required
                  />
                  <small style={{ color: '#888', marginTop: '6px', display: 'block', fontSize: '12px' }}>
                    Nama ini akan langsung muncul di pilihan dropdown kasir & pelanggan saat memesan.
                  </small>
                </div>
              </div>

              <div className="manajer-modal-footer">
                <button
                  type="button"
                  className="manajer-btn manajer-btn-secondary"
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
                  {submitting ? 'Menyimpan...' : 'Simpan Meja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteTarget && (
        <div className="manajer-modal-overlay">
          <div className="manajer-modal" style={{ maxWidth: '400px' }}>
            <div className="manajer-modal-header">
              <h2 className="manajer-modal-title" style={{ color: '#dc2626' }}>
                Hapus Meja
              </h2>
              <button
                type="button"
                className="manajer-modal-close"
                onClick={() => setDeleteTarget(null)}
              >
                ✕
              </button>
            </div>
            <div className="manajer-modal-body">
              <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus <strong>"{deleteTarget.name}"</strong>?
                Meja ini tidak akan dapat dipilih lagi oleh pelanggan atau kasir.
              </p>
            </div>
            <div className="manajer-modal-footer">
              <button
                type="button"
                className="manajer-btn manajer-btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="manajer-btn"
                style={{ backgroundColor: '#dc2626', color: '#fff' }}
                onClick={confirmDelete}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
