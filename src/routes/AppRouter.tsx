// ============================================================
// KOMPONEN : AppRouter
// PERAN   : Navigasi Antarhalaman Aplikasi dengan React Router
//           dan Proteksi Route per Role (Pelanggan, Kasir, Dapur, Manajer)
// ============================================================

import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Outlet,
} from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Role } from '../types/index';

// ===================== AUTH PAGES =====================
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// ===================== PELANGGAN PAGES =====================
import HomePage from '../pages/pelanggan/HomePage';
import ProductsPage from '../pages/pelanggan/ProductsPage';
import DetailPage from '../pages/pelanggan/DetailPage';
import CartPage from '../pages/pelanggan/CartPage';
import CheckoutPage from '../pages/pelanggan/CheckoutPage';
import SuccessPage from '../pages/pelanggan/SuccessPage';

import RiwayatPage from '../pages/pelanggan/RiwayatPage';
import RiwayatDetailPage from '../pages/pelanggan/RiwayatDetailPage';

// ===================== KASIR PAGES =====================
import KasirDashboardPage from '../pages/kasir/DashboardPage';
import KasirDaftarPesananPage from '../pages/kasir/DaftarPesananPage';
import KasirDetailPesananPage from '../pages/kasir/DetailPesananPage';
import KasirStrukPage from '../pages/kasir/StrukPage';
import KasirPesananBaruPage from '../pages/kasir/PesananBaruPage';
import KasirPembayaranPage from '../pages/kasir/PembayaranPage';

// ===================== DAPUR PAGES =====================
import DapurAntrianPage from '../pages/dapur/AntrianPage';
import DapurAntrianPesananPage from '../pages/dapur/AntrianPesananPage';
import DapurDetailPesananPage from '../pages/dapur/DetailPesananPage';

// ===================== MANAJER PAGES =====================
import ManajerDashboardPage from '../pages/manajer/DashboardPage';
import ManajerKelolaMenuPage from '../pages/manajer/KelolaMenuPage';
import ManajerKelolaKategoriPage from '../pages/manajer/KelolaKategoriPage';
import ManajerKelolaPromoPage from '../pages/manajer/KelolaPromoPage';
import ManajerKelolaPenggunaPage from '../pages/manajer/KelolaPenggunaPage';
import ManajerLaporanPage from '../pages/manajer/LaporanPage';

// ===================== LAYOUTS =====================
import PelangganLayout from '../components/layout/PelangganLayout';
import KasirLayout from '../components/layout/KasirLayout';
import DapurLayout from '../components/layout/DapurLayout';
import ManajerLayout from '../components/layout/ManajerLayout';

// ===================== PROTECTED ROUTE =====================
import ProtectedRoute from './ProtectedRoute';

// Halaman sederhana untuk unauthorized
function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Akses Ditolak</h2>
      <p>Anda tidak memiliki hak akses ke halaman ini.</p>
      <button onClick={() => navigate('/login')}>Kembali ke Login</button>
    </div>
  );
}

// Wrapper layout untuk Pelanggan
function PelangganRoute() {
  const { user } = useAuth();
  return (
    <PelangganLayout userName={user?.name ?? 'Pelanggan'}>
      <Outlet />
    </PelangganLayout>
  );
}

// Wrapper layout untuk Kasir
function KasirRoute() {
  const { user, logout: onLogout } = useAuth();
  return (
    <KasirLayout userName={user?.name ?? 'Kasir'} onLogout={onLogout}>
      <Outlet />
    </KasirLayout>
  );
}

// Wrapper layout untuk Dapur
function DapurRoute() {
  return (
    <DapurLayout>
      <Outlet />
    </DapurLayout>
  );
}

// Wrapper layout untuk Manajer
function ManajerRoute() {
  return (
    <ManajerLayout>
      <Outlet />
    </ManajerLayout>
  );
}

export default function AppRouter() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="auth-loading">Memuat sesi...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Redirect root */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/pelanggan/home" replace /> : <Navigate to="/login" replace />
          }
        />

        {/* ================= PELANGGAN ROUTES ================= */}
        <Route
          path="/pelanggan/*"
          element={
            <ProtectedRoute allowedRoles={['pelanggan']}>
              <PelangganRoute />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:category" element={<ProductsPage />} />
          <Route path="detail/:id" element={<DetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="success" element={<SuccessPage />} />
          <Route path="riwayat" element={<RiwayatPage />} />
          <Route path="riwayat/:id" element={<RiwayatDetailPage />} />
        </Route>

        {/* ================= KASIR ROUTES ================= */}
        <Route
          path="/kasir/*"
          element={
            <ProtectedRoute allowedRoles={['kasir']}>
              <KasirRoute />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<KasirDashboardPage />} />
          <Route path="orders" element={<KasirDaftarPesananPage />} />
          <Route path="orders/:id" element={<KasirDetailPesananPage />} />
          <Route path="struk/:id" element={<KasirStrukPage />} />
          <Route path="pesanan-baru" element={<KasirPesananBaruPage />} />
          <Route path="pembayaran/:id" element={<KasirPembayaranPage />} />
          {/* Aliases for convenience */}
          <Route path="pesanan" element={<KasirDaftarPesananPage />} />
          <Route path="pesanan/:id" element={<KasirDetailPesananPage />} />
          <Route path="pesanan/:id/struk" element={<KasirStrukPage />} />
          <Route path="pesanan/:id/pembayaran" element={<KasirPembayaranPage />} />
        </Route>

        {/* ================= DAPUR ROUTES ================= */}
        <Route
          path="/dapur/*"
          element={
            <ProtectedRoute allowedRoles={['dapur']}>
              <DapurRoute />
            </ProtectedRoute>
          }
        >
          <Route path="antrian" element={<DapurAntrianPage />} />
          <Route path="antrian-pesanan" element={<DapurAntrianPesananPage />} />
          <Route path="detail/:id" element={<DapurDetailPesananPage />} />
        </Route>

        {/* ================= MANAJER ROUTES ================= */}
        <Route
          path="/manajer/*"
          element={
            <ProtectedRoute allowedRoles={['manajer']}>
              <ManajerRoute />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ManajerDashboardPage />} />
          <Route path="menu" element={<ManajerKelolaMenuPage />} />
          <Route path="kategori" element={<ManajerKelolaKategoriPage />} />
          <Route path="promo" element={<ManajerKelolaPromoPage />} />
          <Route path="pengguna" element={<ManajerKelolaPenggunaPage />} />
          <Route path="laporan" element={<ManajerLaporanPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
