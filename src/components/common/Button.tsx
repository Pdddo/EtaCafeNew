// KOMPONEN : Button
// PERAN    : Komponen tombol serbaguna dengan varian pill khas desain Figma EtaCafe

import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'pill' | 'danger' | 'danger-outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  active = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    'etacafe-btn',
    `etacafe-btn--${variant}`,
    `etacafe-btn--${size}`,
    active ? 'etacafe-btn--active active' : '',
    loading ? 'etacafe-btn--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className="etacafe-btn-spinner" aria-hidden="true" />
      ) : (
        icon && <span className="etacafe-btn-icon">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
