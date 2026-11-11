import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './PelangganLayout.css';

interface PelangganLayoutProps {
  children: React.ReactNode;
  userName?: string;
  activeNav?: 'home' | 'products' | 'checkout' | 'riwayat' | 'none';
  activeFooterPill?: 'company' | 'coffee' | 'pastry';
  fullHeightContent?: boolean;
}

export default function PelangganLayout({
  children,
  userName = 'Pelanggan',
  activeNav = 'none',
  activeFooterPill,
  fullHeightContent = false,
}: PelangganLayoutProps) {
  const { cartCount } = useCart();
  const { logout: onLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="pelanggan-wrapper">
      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav className="pelanggan-navbar">
        <button
          type="button"
          className="pelanggan-navbar-logo"
          onClick={() => navigate('/pelanggan/home')}
        >
          EtaCafe
        </button>

        <div className="pelanggan-navbar-links">
          <button
            type="button"
            className={`pelanggan-nav-link ${activeNav === 'products' ? 'active' : ''}`}
            onClick={() => navigate('/pelanggan/products')}
          >
            Products
          </button>

          <button
            type="button"
            className={`pelanggan-nav-link pelanggan-cart-badge ${
              activeNav === 'checkout' ? 'active' : ''
            }`}
            onClick={() => navigate('/pelanggan/cart')}
          >
            Checkout
            {cartCount > 0 && <span className="pelanggan-badge">{cartCount}</span>}
          </button>

          <button
            type="button"
            className={`pelanggan-nav-link ${activeNav === 'riwayat' ? 'active' : ''}`}
            onClick={() => navigate('/pelanggan/riwayat')}
          >
            Riwayat
          </button>

          <button
            type="button"
            className="pelanggan-nav-link"
            style={{ opacity: 0.6, fontSize: '13px' }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>
      <div className="pelanggan-nav-divider"></div>

      {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
      <main
        className="pelanggan-main"
        style={fullHeightContent ? { overflow: 'hidden', padding: 0 } : undefined}
      >
        {children}
      </main>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="pelanggan-footer">
        <div className="pelanggan-footer-brand">
          <span className="pelanggan-footer-brand-logo">EtaCafe</span>
          <span className="pelanggan-footer-brand-tagline">
            Etalase Cafe &bull; one Stop | one Heart | one Cup
          </span>
        </div>

        <div className="pelanggan-footer-copy">@ 2026 EtaCafe. All Rights Reserved</div>
      </footer>
    </div>
  );
}
