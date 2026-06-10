/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AppBadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  label,
  variant = 'primary',
}) => {
  const styles = {
    primary: 'bg-bu-blue/10 text-bu-blue border-bu-blue/20',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-bu-success/15 text-bu-success border-bu-success/20',
    warning: 'bg-bu-warning/15 text-bu-warning border-bu-warning/20',
    danger: 'bg-bu-danger/10 text-bu-danger border-bu-danger/20',
    info: 'bg-bu-bright/10 text-bu-bright border-bu-bright/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]}`}>
      {label}
    </span>
  );
};
export default AppBadge;
