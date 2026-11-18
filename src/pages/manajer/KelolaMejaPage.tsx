// ============================================================
// HALAMAN : KelolaMejaPage
// PERAN   : manajer
// ROUTE   : /manajer/meja
// FITUR   : CRUD Lengkap, Status Meja (Aktif / Maintenance),
//           dan Drag & Drop Urutan Meja (Reordering)
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  getTables,
  createTable,
  updateTable,
  toggleTableStatus,
  reorderTables,
  deleteTable,
  ManajerTable,
} from '../../api/manajer';

export default function KelolaMejaPage() {
  const [tables, setTables] = useState<ManajerTable[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'maintenance'>('all');

  // Modal State - Create & Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<ManajerTable | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [tableIsActive, setTableIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal State - Delete
  const [deleteTarget, setDeleteTarget] = useState<ManajerTable | null>(null);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Open modal for Create
  const openCreateModal = () => {
    setEditingTable(null);
    setTableName('');
    setTableIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const openEditModal = (table: ManajerTable) => {
    setEditingTable(table);
    setTableName(table.name);
    setTableIsActive(table.is_active ?? true);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Handler for Create or Edit
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

      if (editingTable) {
        // Mode Update
        await updateTable(editingTable.id, {
          name: cleanName,
          is_active: tableIsActive,
        });
        showNotification(`Meja "${cleanName}" berhasil diperbarui.`);
      } else {
        // Mode Create
        await createTable({
          name: cleanName,
          is_active: tableIsActive,
        });
        showNotification(`Meja "${cleanName}" berhasil ditambahkan.`);
      }

      setIsModalOpen(false);
      fetchTablesData();
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan data meja');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Toggle Status (Tersedia vs Maintenance)
  const handleToggleStatus = async (table: ManajerTable) => {
    try {
      const updated = await toggleTableStatus(table.id);
      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, is_active: updated.is_active } : t))
      );
      showNotification(
        `Status ${table.name} diubah menjadi: ${
          updated.is_active ? 'Tersedia' : 'Dalam Pemeliharaan'
        }`
      );
    } catch (err: any) {
      alert(`Gagal mengubah status: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  // Delete Table
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteTable(deleteTarget.id);
      showNotification(`Meja "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchTablesData();
    } catch (err: any) {
      alert(`Gagal menghapus meja: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Susun ulang array lokal
    const updated = [...tables];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    setTables(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Simpan urutan permanen ke backend
    try {
      const ids = updated.map((t) => t.id);
      await reorderTables(ids);
      showNotification('Urutan meja berhasil diperbarui dan disimpan!');
    } catch (err: any) {
      console.error('Gagal menyimpan urutan meja:', err);
      fetchTablesData();
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Accessible Reordering: Move Up & Move Down Buttons
  const moveItem = async (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= tables.length) return;

    const updated = [...tables];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    setTables(updated);

    try {
      const ids = updated.map((t) => t.id);
      await reorderTables(ids);
      showNotification(`Posisi ${moved.name} berhasil digeser.`);
    } catch (err: any) {
      console.error('Gagal menyimpan urutan:', err);
      fetchTablesData();
    }
  };

  // Sort Natural (1, 2, 3... 10)
  const handleAutoSort = async () => {
    const sorted = [...tables].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
    setTables(sorted);
    try {
      const ids = sorted.map((t) => t.id);
      await reorderTables(ids);
      showNotification('Urutan meja berhasil diselaraskan secara numerik!');
    } catch (err: any) {
      console.error('Gagal merapikan urutan:', err);
      fetchTablesData();
    }
  };

  // Filtered & Searched Tables
  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const isActive = t.is_active ?? true;
      if (filterStatus === 'active') return matchesSearch && isActive;
      if (filterStatus === 'maintenance') return matchesSearch && !isActive;
      return matchesSearch;
    });
  }, [tables, searchQuery, filterStatus]);

  // Statistik Meja
  const totalTables = tables.length;
  const activeTablesCount = tables.filter((t) => t.is_active ?? true).length;
  const maintenanceTablesCount = totalTables - activeTablesCount;

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header Halaman */}
      <div className="manajer-page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="manajer-page-title">Kelola Meja Kafe</h1>
          <p className="manajer-page-subtitle">
            Atur meja dinamis, status ketersediaan/pemeliharaan, serta urutan meja secara visual (Drag & Drop)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="manajer-btn"
            style={{ backgroundColor: '#ffffff', borderColor: '#ebdccb', color: '#665c54' }}
            onClick={handleAutoSort}
            title="Urutkan Meja secara Numerik (1, 2, 3..)"
          >
            ⇅ Rapikan Urutan (1..N)
          </button>
          <button
            type="button"
            className="manajer-btn manajer-btn-primary"
            onClick={openCreateModal}
          >
            <span>＋</span> Tambah Meja Baru
          </button>
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid #ebdccb',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#f5efe6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}
          >
            🪑
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>TOTAL MEJA</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#2c1810' }}>{totalTables}</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid #ebdccb',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}
          >
            🟢
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>AKTIF / TERSEDIA</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#166534' }}>{activeTablesCount}</div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid #ebdccb',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}
          >
            🛠️
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600 }}>PEMELIHARAAN</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#92400e' }}>
              {maintenanceTablesCount}
            </div>
          </div>
        </div>
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
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

      {/* Bar Pencarian & Filter Status */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '14px 18px',
          border: '1px solid #ebdccb',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: filterStatus === 'all' ? '#2c1810' : '#f5efe6',
              color: filterStatus === 'all' ? '#ffffff' : '#665c54',
            }}
          >
            Semua ({totalTables})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('active')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: filterStatus === 'active' ? '#166534' : '#f5efe6',
              color: filterStatus === 'active' ? '#ffffff' : '#665c54',
            }}
          >
            ● Tersedia ({activeTablesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('maintenance')}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: filterStatus === 'maintenance' ? '#b45309' : '#f5efe6',
              color: filterStatus === 'maintenance' ? '#ffffff' : '#665c54',
            }}
          >
            🛠 Pemeliharaan ({maintenanceTablesCount})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '240px', flex: '1', maxWidth: '360px' }}>
          <input
            type="text"
            placeholder="Cari nama atau nomor meja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 34px',
              borderRadius: '999px',
              border: '1px solid #ebdccb',
              backgroundColor: '#faf7f2',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999',
              fontSize: '14px',
            }}
          >
            🔍
          </span>
        </div>
      </div>

      {/* Petunjuk Drag & Drop */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
          fontSize: '12px',
          color: '#844c1c',
          fontWeight: 600,
        }}
      >
        <span>💡 Tips:</span>
        <span>
          Anda dapat <strong>menyeret (drag & drop)</strong> kartu meja menggunakan ikon pegangan{' '}
          <code>⠿</code> atau tombol panah <code>▲ / ▼</code> untuk mengubah urutan posisi meja di sistem.
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#665c54' }}>
          Memuat daftar meja...
        </div>
      ) : filteredTables.length === 0 ? (
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
            Tidak ada meja yang cocok dengan kriteria
          </p>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Coba ubah kata kunci pencarian atau tambahkan meja baru.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredTables.map((t, index) => {
            const isActive = t.is_active ?? true;
            const originalIndex = tables.findIndex((item) => item.id === t.id);
            const isDragging = draggedIndex === originalIndex;
            const isDragOver = dragOverIndex === originalIndex;

            return (
              <div
                key={t.id}
                draggable
                onDragStart={() => handleDragStart(originalIndex)}
                onDragOver={(e) => handleDragOver(e, originalIndex)}
                onDrop={(e) => handleDrop(e, originalIndex)}
                onDragEnd={handleDragEnd}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '16px 18px',
                  border: isDragOver
                    ? '2px dashed #844c1c'
                    : isActive
                    ? '1px solid #ebdccb'
                    : '1px solid #fed7aa',
                  boxShadow: isDragging
                    ? '0 12px 24px rgba(44, 24, 16, 0.15)'
                    : '0 2px 8px rgba(44, 24, 16, 0.04)',
                  opacity: isDragging ? 0.45 : 1,
                  transform: isDragging ? 'scale(0.98)' : 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative',
                }}
              >
                {/* Header Kartu Meja: Drag Handle, Nomor Posisi, dan Nama */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Drag Grip Handle */}
                    <div
                      title="Tahan dan geser untuk memindahkan urutan"
                      style={{
                        cursor: 'grab',
                        color: '#a89f91',
                        fontSize: '20px',
                        lineHeight: 1,
                        padding: '2px 4px',
                        userSelect: 'none',
                      }}
                    >
                      ⠿
                    </div>

                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: isActive ? '#f5efe6' : '#fee2e2',
                        color: isActive ? '#844c1c' : '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '18px',
                      }}
                    >
                      {isActive ? '🪑' : '🛠️'}
                    </div>

                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#2c1810',
                        }}
                      >
                        {t.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#8c7d70',
                          fontWeight: 600,
                        }}
                      >
                        Urutan #{originalIndex + 1}
                      </span>
                    </div>
                  </div>

                  {/* Tombol Panah Up / Down untuk Aksesibilitas */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      disabled={originalIndex === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(originalIndex, 'up');
                      }}
                      title="Geser ke atas"
                      style={{
                        border: '1px solid #ebdccb',
                        backgroundColor: originalIndex === 0 ? '#faf7f2' : '#ffffff',
                        color: originalIndex === 0 ? '#ccc' : '#444',
                        borderRadius: '6px',
                        width: '26px',
                        height: '26px',
                        cursor: originalIndex === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={originalIndex === tables.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(originalIndex, 'down');
                      }}
                      title="Geser ke bawah"
                      style={{
                        border: '1px solid #ebdccb',
                        backgroundColor: originalIndex === tables.length - 1 ? '#faf7f2' : '#ffffff',
                        color: originalIndex === tables.length - 1 ? '#ccc' : '#444',
                        borderRadius: '6px',
                        width: '26px',
                        height: '26px',
                        cursor: originalIndex === tables.length - 1 ? 'not-allowed' : 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ▼
                    </button>
                  </div>
                </div>

                {/* Status Badge & Toggle Switch */}
                <div
                  style={{
                    backgroundColor: isActive ? '#f0fdf4' : '#fffbeb',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#16a34a' : '#d97706',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isActive ? '#166534' : '#b45309',
                      }}
                    >
                      {isActive ? 'Tersedia untuk Pesanan' : 'Dalam Pemeliharaan'}
                    </span>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(t);
                    }}
                    style={{
                      border: 'none',
                      backgroundColor: isActive ? '#166534' : '#d97706',
                      color: '#ffffff',
                      borderRadius: '999px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title={
                      isActive
                        ? 'Klik untuk menonaktifkan meja (Maintenance)'
                        : 'Klik untuk mengaktifkan meja kembali'
                    }
                  >
                    {isActive ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                {/* Footer Kartu Meja: Action Buttons (Edit & Delete) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    borderTop: '1px solid #f5efe6',
                    paddingTop: '10px',
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(t);
                    }}
                    title="Ubah Nama atau Status Meja"
                    style={{
                      border: '1px solid #ebdccb',
                      backgroundColor: '#ffffff',
                      color: '#2c1810',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(t);
                    }}
                    title="Hapus Meja"
                    style={{
                      border: '1px solid #fecaca',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🗑 Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT MEJA */}
      {isModalOpen && (
        <div className="manajer-modal-overlay">
          <div className="manajer-modal" style={{ maxWidth: '440px' }}>
            <div className="manajer-modal-header">
              <h2 className="manajer-modal-title">
                {editingTable ? `Edit Data Meja: ${editingTable.name}` : 'Tambah Meja Baru'}
              </h2>
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
                    placeholder="Contoh: Meja 5, Meja VIP 1, Outdoor 3"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    autoFocus
                    required
                  />
                  <small style={{ color: '#888', marginTop: '6px', display: 'block', fontSize: '12px' }}>
                    Nama ini akan menjadi label yang dipilih oleh kasir dan pelanggan pada pesanan Dine In.
                  </small>
                </div>

                <div className="manajer-form-group" style={{ marginTop: '16px' }}>
                  <label className="manajer-form-label">Status Ketersediaan</label>
                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      marginTop: '6px',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: tableIsActive ? '#166534' : '#666',
                      }}
                    >
                      <input
                        type="radio"
                        name="tableStatus"
                        checked={tableIsActive}
                        onChange={() => setTableIsActive(true)}
                      />
                      🟢 Tersedia (Bisa Dipesan)
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: !tableIsActive ? '#b45309' : '#666',
                      }}
                    >
                      <input
                        type="radio"
                        name="tableStatus"
                        checked={!tableIsActive}
                        onChange={() => setTableIsActive(false)}
                      />
                      🛠 Pemeliharaan (Maintenance)
                    </label>
                  </div>
                  <small style={{ color: '#888', marginTop: '6px', display: 'block', fontSize: '12px' }}>
                    Meja yang berstatus pemeliharaan tidak akan dapat dipilih saat pelanggan atau kasir checkout.
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
                  {submitting ? 'Menyimpan...' : editingTable ? 'Simpan Perubahan' : 'Tambah Meja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteTarget && (
        <div className="manajer-modal-overlay">
          <div className="manajer-modal" style={{ maxWidth: '420px' }}>
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
              </p>
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginTop: '12px',
                  fontSize: '12px',
                  lineHeight: 1.4,
                }}
              >
                💡 <strong>Catatan:</strong> Jika meja hanya sedang tidak bisa dipakai sementara karena
                dibersihkan atau rusak, Anda cukup mengubah statusnya menjadi{' '}
                <strong>"Pemeliharaan / Nonaktif"</strong> tanpa perlu menghapusnya.
              </div>
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
