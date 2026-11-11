// KOMPONEN : ManajerLayout
// PERAN    : Layout untuk halaman role Manajer dengan navigasi terpusat pada Navbar atas

import React from 'react';
import Navbar from '../common/Navbar';
import './ManajerLayout.css';

interface ManajerLayoutProps {
  children?: React.ReactNode;
  activeNav?: string;
  userName?: string;
  onLogout?: () => void;
}

export default function ManajerLayout({
  children,
}: ManajerLayoutProps) {
  return (
    <div className="manajer-wrapper">
      <Navbar role="manajer" />
      <main className="manajer-container">{children}</main>
    </div>
  );
}
