// KOMPONEN : KasirLayout
// PERAN    : Layout untuk halaman role Kasir dengan navbar atas bersih

import React from 'react';
import Navbar from '../common/Navbar';
import './KasirLayout.css';

interface KasirLayoutProps {
  children?: React.ReactNode;
  activeTab?: string;
  userName?: string;
  onLogout?: () => void;
}

export default function KasirLayout({
  children,
}: KasirLayoutProps) {
  return (
    <div className="kasir-wrapper">
      <Navbar role="kasir" />

      <main className="kasir-container">{children}</main>
    </div>
  );
}
