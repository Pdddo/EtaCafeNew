// KOMPONEN : Navbar
// PERAN    : Navigasi utama terpadu bertema EtaCafe (Etalase Cafe)

import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/index';
import './Navbar.css';

interface NavbarProps {
  role?: Role;
  className?: string;
}

export default function Navbar({ role: roleProp, className }: NavbarProps) {
  const { user, logout: onLogout, hasAnyRole } = useAuth();
  const navigate = useNavigate();

  const role = (roleProp ?? user?.role ?? 'pelanggan') as Role;
  const isPelanggan = hasAnyRole(['pelanggan']);
  const isKasir = hasAnyRole(['kasir']);
  const isDapur = hasAnyRole(['dapur']);
  const isManajer = hasAnyRole(['manajer']);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className={`etacafe-navbar ${className ?? ''}`}>
      <Link to="/" className="etacafe-navbar-brand">
        <span className="etacafe-navbar-logo-script">EtaCafe</span>
        <span className="etacafe-navbar-tagline">Etalase Cafe</span>
      </Link>

      <div className="etacafe-navbar-right">
        {user && (
          <div className="etacafe-navbar-user-info">
            <span className="etacafe-navbar-user-name">{user.name}</span>
            <span className={`etacafe-navbar-role-pill etacafe-navbar-role-pill--${role}`}>
              {role}
            </span>
          </div>
        )}

        <div className="etacafe-navbar-links">
          {isPelanggan && (
            <>
              <NavLink
                to="/pelanggan/home"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Home
              </NavLink>
              <NavLink
                to="/pelanggan/products"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Menu
              </NavLink>
              <NavLink
                to="/pelanggan/cart"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Keranjang
              </NavLink>
            </>
          )}
          {isKasir && (
            <>
              <NavLink
                to="/kasir/dashboard"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/kasir/orders"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Daftar Pesanan
              </NavLink>
              <NavLink
                to="/kasir/pesanan-baru"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Pesanan Baru
              </NavLink>
            </>
          )}
          {isDapur && (
            <NavLink
              to="/dapur/antrian"
              className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
            >
              Antrean Dapur
            </NavLink>
          )}
          {isManajer && (
            <>
              <NavLink
                to="/manajer/dashboard"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/manajer/laporan"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Laporan
              </NavLink>
              <NavLink
                to="/manajer/menu"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Kelola Menu
              </NavLink>
              <NavLink
                to="/manajer/kategori"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Kategori
              </NavLink>
              <NavLink
                to="/manajer/pengguna"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Pengguna
              </NavLink>
              <NavLink
                to="/manajer/promo"
                className={({ isActive }) => `etacafe-navbar-link ${isActive ? 'active' : ''}`}
              >
                Promo
              </NavLink>
            </>
          )}

          {user ? (
            <button
              type="button"
              className="etacafe-navbar-logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <Link to="/login" className="etacafe-navbar-link">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
