// KOMPONEN : StatusBadge
// PERAN    : Menampilkan badge status pesanan dengan gaya warna pill Figma

import React from 'react';

export type StatusType =
  | 'Menunggu Konfirmasi Kasir'
  | 'Dikonfirmasi'
  | 'Sedang Diproses'
  | 'Selesai'
  | 'Dibatalkan'
  | 'MENUNGGU_KONFIRMASI_KASIR'
  | 'DIKONFIRMASI'
  | 'SEDANG_DIPROSES'
  | 'SELESAI'
  | 'DIBATALKAN'
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  small?: boolean;
  className?: string;
}

export default function StatusBadge({ status, small = false, className = '' }: StatusBadgeProps) {
  const normalized = (status || '').toLowerCase().replace(/_/g, ' ');

  let label = status;
  let bg = '#e2e8f0';
  let text = '#0f172a';
  let border = 'transparent';

  if (normalized.includes('menunggu')) {
    label = 'Menunggu Konfirmasi';
    bg = '#fef3c7'; // Amber-100
    text = '#92400e'; // Amber-800
    border = '#fde68a';
  } else if (normalized.includes('dikonfirmasi')) {
    label = 'Dikonfirmasi';
    bg = '#e0f2fe'; // Sky-100
    text = '#0369a1'; // Sky-700
    border = '#bae6fd';
  } else if (normalized.includes('proses') || normalized.includes('diproses')) {
    label = 'Sedang Diproses';
    bg = '#ffedd5'; // Orange-100
    text = '#c2410c'; // Orange-700
    border = '#fed7aa';
  } else if (normalized.includes('selesai')) {
    label = 'Selesai';
    bg = '#dcfce7'; // Emerald-100
    text = '#15803d'; // Emerald-700
    border = '#bbf7d0';
  } else if (normalized.includes('batal')) {
    label = 'Dibatalkan';
    bg = '#fee2e2'; // Rose-100
    text = '#b91c1c'; // Rose-700
    border = '#fecaca';
  }

  return (
    <span
      className={`etacafe-status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: small ? '3px 10px' : '6px 14px',
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: '9999px',
        fontSize: small ? '11px' : '13px',
        fontWeight: 700,
        letterSpacing: '0.2px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
