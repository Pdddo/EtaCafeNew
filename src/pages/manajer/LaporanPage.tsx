// ============================================================
// HALAMAN : LaporanPage
// PERAN   : manajer
// ROUTE   : /manajer/laporan
// DESAIN  : Sesuai Figma Laporan Keuangan.png
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  getSalesSummary,
  downloadSalesCsv,
  SalesReportSummary,
} from '../../api/manajer';

export default function LaporanPage() {
  const [period, setPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [summary, setSummary] = useState<SalesReportSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchSummary = async (selectedPeriod: 'harian' | 'mingguan' | 'bulanan') => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSalesSummary(selectedPeriod);
      setSummary(data);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat laporan penjualan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(period);
  }, [period]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await downloadSalesCsv();
    } catch (err: any) {
      alert(`Gagal mengunduh CSV: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setExporting(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Validasi dan normalisasi item menu terlaris secara akurat
  const validTopItems = useMemo(() => {
    if (!summary?.top_selling_items || !Array.isArray(summary.top_selling_items)) {
      return [];
    }

    return summary.top_selling_items
      .map((item) => {
        const name = (item.item_name || item.name || '').trim();
        const sold = Number(item.total_quantity_sold ?? item.sold ?? 0);
        const sales = Number(item.total_sales_amount ?? item.sales ?? 0);
        return { name, sold, sales };
      })
      .filter((item) => item.name !== '' && item.sold > 0);
  }, [summary]);

  // Hitung angka porsi tertinggi sebagai basis perbandingan bar
  const maxSold = useMemo(() => {
    if (validTopItems.length === 0) return 1;
    return Math.max(...validTopItems.map((i) => i.sold), 1);
  }, [validTopItems]);

  return (
    <div>
      {/* Header Halaman & Tombol Export Sesuai Figma */}
      <div className="manajer-page-header">
        <div>
          <h1 className="manajer-page-title">Laporan Penjualan (Analytics)</h1>
          <p className="manajer-page-subtitle">
            Pantau omzet, volume transaksi sukses, dan performa menu EtaCafe
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="manajer-btn"
            onClick={handlePrintPdf}
          >
            🖨️ Cetak / PDF
          </button>
          <button
            type="button"
            className="manajer-btn manajer-btn-primary"
            onClick={handleExportCsv}
            disabled={exporting}
          >
            📥 {exporting ? 'Mengunduh...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Filter Periode Pills (Harian | Mingguan | Bulanan) Sesuai Figma */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          margin: '0 auto 32px',
        }}
      >
        <button
          type="button"
          className={`manajer-subnav-pill ${period === 'harian' ? 'active' : ''}`}
          onClick={() => setPeriod('harian')}
        >
          Harian
        </button>
        <button
          type="button"
          className={`manajer-subnav-pill ${period === 'mingguan' ? 'active' : ''}`}
          onClick={() => setPeriod('mingguan')}
        >
          Mingguan
        </button>
        <button
          type="button"
          className={`manajer-subnav-pill ${period === 'bulanan' ? 'active' : ''}`}
          onClick={() => setPeriod('bulanan')}
        >
          Bulanan
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '12px 18px',
            borderRadius: '12px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#665c54' }}>
          Menghitung analitik penjualan periode {period}...
        </div>
      ) : summary ? (
        <div>
          {/* Grid 2 Kartu Metrik Utama */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            {/* Kartu 1: Total Transaksi Selesai */}
            <div className="manajer-analytics-card">
              <h3 className="manajer-analytics-title">Total Transaksi</h3>
              <div className="manajer-analytics-number">
                {summary.total_orders_completed}
              </div>
              <div style={{ fontSize: '14px', color: '#665c54', marginTop: '6px' }}>
                Pesanan berhasil diselesaikan ({period})
              </div>
            </div>

            {/* Kartu 2: Total Pendapatan */}
            <div className="manajer-analytics-card">
              <h3 className="manajer-analytics-title">Total Pendapatan</h3>
              <div className="manajer-analytics-number">
                Rp. {Number(summary.total_revenue || 0).toLocaleString('id-ID')},-
              </div>
              <div style={{ fontSize: '14px', color: '#665c54', marginTop: '6px' }}>
                Rata-rata: Rp. {Number(summary.average_order_value || 0).toLocaleString('id-ID')},- / order
              </div>
            </div>
          </div>

          {/* Kartu 3: Top Selling Item Sesuai Permintaan (Hanya dimunculkan jika data valid & tersedia) */}
          {validTopItems.length > 0 && (
            <div className="manajer-analytics-card">
              <h3 className="manajer-analytics-title" style={{ textAlign: 'left', marginBottom: '8px' }}>
                Top Selling Item
              </h3>
              <p style={{ textAlign: 'left', color: '#665c54', fontSize: '13px', margin: '0 0 24px' }}>
                Menu paling banyak dipesan dan diselesaikan oleh dapur pada periode {period}
              </p>

              <div className="manajer-top-items-list" style={{ maxWidth: '100%' }}>
                {validTopItems.map((item, index) => {
                  const percent = Math.min(100, Math.round((item.sold / maxSold) * 100));

                  return (
                    <div key={`${item.name}-${index}`} className="manajer-top-item-row">
                      {/* Ranking badge */}
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor:
                            index === 0 ? '#844c1c' : index === 1 ? '#a66835' : '#ebdccb',
                          color: index < 2 ? '#ffffff' : '#2c1810',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '14px',
                          flexShrink: 0,
                        }}
                      >
                        #{index + 1}
                      </div>

                      {/* Progress Bar & Name */}
                      <div className="manajer-top-item-bar-wrapper">
                        <div className="manajer-top-item-label">
                          <span>{item.name}</span>
                          <span style={{ color: '#844c1c' }}>
                            {item.sold} porsi
                            {item.sales > 0 && ` (Rp. ${Number(item.sales).toLocaleString('id-ID')})`}
                          </span>
                        </div>
                        <div className="manajer-top-item-progress-track">
                          <div
                            className="manajer-top-item-progress-fill"
                            style={{ width: `${Math.max(percent, 8)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
