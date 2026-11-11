// ============================================================
// HALAMAN : HomePage
// PERAN   : pelanggan
// ROUTE   : /pelanggan/home
// PIC     : (isi nama pengerjanya)
//
// ATURAN (baca sebelum mengerjakan, juga jika memakai AI):
// 1. Panggil backend HANYA lewat fungsi di src/api/*.ts, jangan fetch langsung di sini.
// 2. Gunakan tipe dari src/types/index.ts, jangan buat tipe ganda.
// 3. Pakai komponen di src/components/common sebelum membuat komponen baru.
// 4. Jangan membuat folder atau file di luar struktur ini tanpa persetujuan tim.
// 5. Hanya React + TypeScript, tanpa HTML/JS terpisah.
// 6. Jangan bungkus dengan PelangganLayout lagi (sudah disediakan oleh PelangganRoute).
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './HomePage.css';

export default function HomePage() {
  const { user, logout: onLogout } = useAuth();
  const navigate = useNavigate();
  const shortName = user?.name.split(' ')[0] || 'Pelanggan';

  return (
    <section className="home-hero">
      {/* 4-panel image grid */}
      <img
        src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=85"
        alt="Coffee latte art"
      />
      <img
        src="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=900&q=85"
        alt="Kopi hitam"
      />
      <img
        src="https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=900&q=85"
        alt="Matcha latte"
      />
      <img
        src="https://images.unsplash.com/photo-1561047029-3000c68339ca?w=900&q=85"
        alt="Suasana kafe"
      />

      {/* Welcome chip */}
      <div className="welcome-chip">
        ☕ Selamat datang, <span>{shortName}</span>!
      </div>

      {/* Overlay konten */}
      <div className="home-hero-overlay">
        <div className="hero-circle">
          <div className="hero-circle-inner">
            <svg viewBox="0 0 48 48">
              <circle cx="24" cy="20" r="10" />
              <path d="M14 36c0-5.523 4.477-10 10-10s10 4.477 10 10" />
            </svg>
          </div>
        </div>
        <div className="hero-words">
          <span>One Step</span>
          <span>Closer to</span>
          <span>Your Doorstep</span>
          <span className="tagline">EtaCafe · Pesan dari mejamu</span>
          <button
            type="button"
            className="hero-cta"
            onClick={() => navigate('/pelanggan/products')}
          >
            Lihat Menu →
          </button>
        </div>
      </div>
    </section>
  );
}
