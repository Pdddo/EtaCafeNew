// ============================================================
// KOMPONEN : DapurLayout
// PERAN    : Layout terpadu untuk role Dapur (Kitchen Operations Hub)
//           Selaras dengan KasirLayout dan ManajerLayout
// ============================================================

import React from 'react';
import Navbar from '../common/Navbar';
import './DapurLayout.css';

interface DapurLayoutProps {
  children?: React.ReactNode;
}

export default function DapurLayout({ children }: DapurLayoutProps) {
  return (
    <div className="dapur-wrapper">
      <Navbar role="dapur" />
      <main className="dapur-container">{children}</main>
    </div>
  );
}
