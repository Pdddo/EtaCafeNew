// ============================================================
// HALAMAN : KelolaMenuPage
// PERAN   : manajer
// ROUTE   : /manajer/menu
// DESAIN  : Sesuai Figma Product edit.png
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  getMenus,
  createMenu,
  updateMenu,
  toggleMenuAvailability,
  deleteMenu,
  getCategories,
  ManajerMenuItem,
  ManajerCategory,
} from '../../api/manajer';

export default function KelolaMenuPage() {
  const [menus, setMenus] = useState<ManajerMenuItem[]>([]);
  const [categories, setCategories] = useState<ManajerCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ManajerMenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManajerMenuItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category_id: 0,
    price: 0,
    description: '',
    image_url: '',
    is_available: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData((prev) => ({ ...prev, image_url: result }));
    };
    reader.readAsDataURL(file);
  };

  // Load Menus & Categories
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [menuData, categoryData] = await Promise.all([
        getMenus(),
        getCategories(),
      ]);
      setMenus(menuData);
      setCategories(categoryData);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat data menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Menu List
  const filteredMenus = useMemo(() => {
    return menus.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const catId = item.category_id || item.category_rel?.id;
      const matchCategory =
        selectedCategory === 'all' ||
        String(catId) === selectedCategory ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [menus, searchQuery, selectedCategory]);

  // Handle Toggle Availability
  const handleToggle = async (item: ManajerMenuItem) => {
    const currentStatus = item.is_available ?? item.isAvailable ?? true;
    const newStatus = !currentStatus;

    try {
      await toggleMenuAvailability(item.id, newStatus);
      setMenus((prev) =>
        prev.map((m) =>
          m.id === item.id
            ? { ...m, is_available: newStatus, isAvailable: newStatus }
            : m
        )
      );
      setSuccessMsg(
        `Menu "${item.name}" berhasil diubah menjadi ${
          newStatus ? 'TERSEDIA' : 'HABIS'
        }`
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Gagal mengubah ketersediaan menu: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? Number(categories[0].id) : 1,
      price: 0,
      description: '',
      image_url: '',
      is_available: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: ManajerMenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category_id: Number(item.category_id || item.category_rel?.id || 1),
      price: item.price,
      description: item.description || '',
      image_url: item.image_url || item.imageUrl || '',
      is_available: item.is_available ?? item.isAvailable ?? true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Submit Create/Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama menu wajib diisi.');
      return;
    }
    if (formData.price <= 0) {
      setFormError('Harga menu wajib bernilai positif (> 0). (BR-06)');
      return;
    }
    if (!formData.category_id) {
      setFormError('Pilih kategori yang valid.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingItem) {
        await updateMenu(editingItem.id, {
          name: formData.name,
          category_id: formData.category_id,
          price: Number(formData.price),
          description: formData.description,
          image_url: formData.image_url,
          is_available: formData.is_available,
        });
        setSuccessMsg(`Menu "${formData.name}" berhasil diperbarui.`);
      } else {
        await createMenu({
          name: formData.name,
          category_id: formData.category_id,
          price: Number(formData.price),
          description: formData.description,
          image_url: formData.image_url,
          is_available: formData.is_available,
        });
        setSuccessMsg(`Menu baru "${formData.name}" berhasil ditambahkan.`);
      }

      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan menu');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Menu
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMenu(deleteTarget.id);
      setSuccessMsg(
        `Menu "${deleteTarget.name}" berhasil dihapus / dinonaktifkan.`
      );
      setDeleteTarget(null);
      fetchData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(`Gagal menghapus menu: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  // Helper find category name
  const getCategoryName = (item: ManajerMenuItem) => {
    if (item.category_rel?.name) return item.category_rel.name;
    if (item.category) return item.category;
    const cat = categories.find((c) => String(c.id) === String(item.category_id));
    return cat ? cat.name : 'Umum';
  };

  return (
    <div>
      {/* Header Halaman */}
      <div className="manajer-page-header">
        <div>
          <h1 className="manajer-page-title">Kelola Menu</h1>
          <p className="manajer-page-subtitle">
            Atur ketersediaan menu, harga, dan informasi hidangan untuk kasir & pelanggan
          </p>
        </div>
        <button
          type="button"
          className="manajer-btn manajer-btn-primary"
          onClick={openCreateModal}
        >
          <span>＋</span> Tambah Menu Baru
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

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`manajer-subnav-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Semua Menu ({menus.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`manajer-subnav-pill ${
                selectedCategory === String(c.id) ? 'active' : ''
              }`}
              onClick={() => setSelectedCategory(String(c.id))}
            >
              {c.name}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Cari hidangan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '8px 16px',
            borderRadius: '9999px',
            border: '1.5px solid #d4c5b9',
            backgroundColor: '#ffffff',
            outline: 'none',
            fontSize: '14px',
            minWidth: '220px',
          }}
        />
      </div>

      {/* Daftar Menu List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#665c54' }}>
          Memuat daftar menu EtaCafe...
        </div>
      ) : filteredMenus.length === 0 ? (
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
            Tidak ada menu yang sesuai
          </p>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Ubah kata kunci pencarian atau tambahkan menu baru.
          </p>
        </div>
      ) : (
        <div>
          {filteredMenus.map((item) => {
            const isAvail = item.is_available ?? item.isAvailable ?? true;
            const imgSrc =
              item.image_url ||
              item.imageUrl ||
              'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300&auto=format&fit=crop';

            return (
              <div key={item.id} className="manajer-menu-card">
                {/* Foto Menu Kiri (Rounded 16px Sesuai Figma Product edit.png) */}
                <img
                  src={imgSrc}
                  alt={item.name}
                  className="manajer-menu-card-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=300&auto=format&fit=crop';
                  }}
                />

                {/* Info Detail Kanan */}
                <div className="manajer-menu-info">
                  {/* Status Ketersediaan Header + Toggle Switch */}
                  <div className="manajer-menu-status-bar">
                    <h3 className="manajer-menu-status-title">Status Ketersediaan</h3>
                    <div
                      className="manajer-toggle-pill"
                      onClick={() => handleToggle(item)}
                      title="Klik untuk ubah ketersediaan"
                    >
                      <span
                        className={`manajer-toggle-pill-option ${
                          isAvail ? 'active-on' : ''
                        }`}
                      >
                        ON
                      </span>
                      <span
                        className={`manajer-toggle-pill-option ${
                          !isAvail ? 'active-off' : ''
                        }`}
                      >
                        OFF
                      </span>
                    </div>
                  </div>

                  {/* Detail Item */}
                  <div className="manajer-menu-details-row">
                    <strong>Nama</strong> : {item.name}
                  </div>
                  <div className="manajer-menu-details-row">
                    <strong>Kategori</strong> : {getCategoryName(item)}
                  </div>
                  <div className="manajer-menu-details-row">
                    <strong>Harga</strong> : Rp. {Number(item.price).toLocaleString('id-ID')},-
                  </div>
                  {item.description && (
                    <div className="manajer-menu-details-row" style={{ color: '#665c54' }}>
                      <strong>Deskripsi</strong> : {item.description}
                    </div>
                  )}

                  {/* Tombol Aksi Figma (Tambah | Edit | Hapus Menu) */}
                  <div className="manajer-menu-card-actions">
                    <button
                      type="button"
                      className="manajer-btn"
                      onClick={openCreateModal}
                    >
                      Tambah
                    </button>
                    <button
                      type="button"
                      className="manajer-btn"
                      onClick={() => openEditModal(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="manajer-btn manajer-btn-danger"
                      onClick={() => setDeleteTarget(item)}
                    >
                      Hapus Menu
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT MENU */}
      {isModalOpen && (
        <div className="manajer-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="manajer-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="manajer-modal-title">
              {editingItem ? 'Edit Data Menu' : 'Tambah Menu Baru'}
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
                <label className="manajer-form-label">Nama Menu *</label>
                <input
                  type="text"
                  className="manajer-form-input"
                  placeholder="Contoh: Kopi Susu Aren"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Kategori *</label>
                <select
                  className="manajer-form-select"
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: Number(e.target.value) })
                  }
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Harga (Rp) *</label>
                <input
                  type="number"
                  className="manajer-form-input"
                  min="1000"
                  step="500"
                  placeholder="Contoh: 25000"
                  value={formData.price || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  required
                />
                <span style={{ fontSize: '12px', color: '#665c54' }}>
                  Wajib bernilai positif (BR-06)
                </span>
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Foto Menu (Upload atau URL)</label>
                
                {/* Drag and Drop / Buka File Lokal */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleProcessFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? '#2c1810' : '#d4c5b9'}`,
                    borderRadius: '10px',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragging ? '#faf6f0' : '#fff',
                    marginBottom: '10px',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>📁</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#2c1810' }}>
                    Klik untuk pilih foto dari perangkat atau seret (drag &amp; drop) ke sini
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                    Mendukung format JPG, PNG, WebP
                  </div>
                </div>

                {/* Pratinjau Foto */}
                {formData.image_url && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', padding: '8px', backgroundColor: '#faf6f0', borderRadius: '8px', border: '1px solid #ebdccb' }}>
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div style={{ flex: 1, fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Foto siap digunakan
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, image_url: '' });
                      }}
                      style={{ padding: '4px 8px', fontSize: '11px', color: '#c0392b', background: '#fff', border: '1px solid #c0392b', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Hapus
                    </button>
                  </div>
                )}

                {/* URL gambar opsional */}
                <input
                  type="text"
                  className="manajer-form-input"
                  placeholder="Atau tempel URL gambar eksternal di sini..."
                  value={formData.image_url.startsWith('data:') ? '' : formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Deskripsi Menu</label>
                <textarea
                  rows={3}
                  className="manajer-form-textarea"
                  placeholder="Keterangan bahan, rasa, dsb."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="manajer-form-group">
                <label className="manajer-form-label">Status Ketersediaan Awal</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="is_available"
                      checked={formData.is_available === true}
                      onChange={() => setFormData({ ...formData, is_available: true })}
                    />
                    Tersedia (ON)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="is_available"
                      checked={formData.is_available === false}
                      onChange={() => setFormData({ ...formData, is_available: false })}
                    />
                    Habis / Nonaktif (OFF)
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
                  {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambahkan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS MENU */}
      {deleteTarget && (
        <div className="manajer-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div
            className="manajer-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px' }}
          >
            <h2 className="manajer-modal-title" style={{ color: '#dc2626', borderColor: '#dc2626' }}>
              Konfirmasi Hapus Menu
            </h2>
            <p style={{ fontSize: '15px', color: '#2c1810', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus menu <strong>"{deleteTarget.name}"</strong>?
            </p>
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                lineHeight: 1.4,
                marginBottom: '20px',
              }}
            >
              ℹ️ <strong>Mitigasi Keamanan Data:</strong> Jika menu ini pernah dipesan dalam transaksi pelanggan, sistem akan secara otomatis <em>menonaktifkannya</em> (bukan menghapus permanen) agar riwayat pesanan dan pembukuan tetap utuh.
            </div>
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
                Ya, Hapus Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
