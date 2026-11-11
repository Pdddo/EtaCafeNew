// KOMPONEN : RupiahText
// PERAN    : Menampilkan format mata uang Rupiah Indonesia (Rp xx.xxx)

import React from 'react';

export interface RupiahTextProps {
  amount: number;
  small?: boolean;
  className?: string;
  badge?: boolean;
}

export function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat('id-ID').format(amount || 0);
  return `Rp ${formatted}`;
}

export default function RupiahText({
  amount,
  small = false,
  className = '',
  badge = false,
}: RupiahTextProps) {
  const text = formatRupiah(amount);

  if (!badge) {
    return (
      <span
        className={`etacafe-rupiah-text ${className}`}
        style={{
          fontWeight: 700,
          color: '#2c1810',
          fontSize: small ? '13px' : '15px',
        }}
      >
        {text}
      </span>
    );
  }

  return (
    <span
      className={`etacafe-rupiah-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: small ? '2px 8px' : '4px 12px',
        backgroundColor: '#e6dfd8',
        color: '#2c1810',
        borderRadius: '9999px',
        fontSize: small ? '11px' : '13px',
        fontWeight: 700,
      }}
    >
      {text}
    </span>
  );
}
