// KOMPONEN : DapurLayout
// PERAN    : Layout untuk halaman role Dapur (Kitchen Display System) dengan bottom tabs Figma

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../common/Navbar';
import './DapurLayout.css';

interface DapurLayoutProps {
  children: React.ReactNode;
  activeTab?: 'dikonfirmasi' | 'proses' | 'selesai';
}

export default function DapurLayout({
  children,
  activeTab = 'dikonfirmasi',
}: DapurLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="dapur-wrapper">
      <Navbar role="dapur" />

      <main className="dapur-container">{children}</main>

      {/* FOOTER TABS DAPUR (FIGMA: Dikonfirmasi | Proses | Selesai) */}
      <footer className="dapur-footer-nav">
        <button
          type="button"
          className={`dapur-footer-pill ${activeTab === 'dikonfirmasi' ? 'active' : ''}`}
          onClick={() => navigate('/dapur/antrian')}
        >
          Dikonfirmasi
        </button>

        <button
          type="button"
          className={`dapur-footer-pill ${activeTab === 'proses' ? 'active' : ''}`}
          onClick={() => navigate('/dapur/antrian-pesanan')}
        >
          Proses
        </button>

        <button
          type="button"
          className={`dapur-footer-pill ${activeTab === 'selesai' ? 'active' : ''}`}
          onClick={() => navigate('/dapur/antrian')}
        >
          Selesai
        </button>
      </footer>
    </div>
  );
}
