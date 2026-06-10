/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const AppSelect: React.FC<AppSelectProps> = ({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || 'select_' + Math.random().toString(36).substr(2, 9);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-xs">
        <select
          id={selectId}
          className={`block w-full rounded-lg border-gray-300 text-sm py-2.5 px-3 bg-white transition-colors duration-200
            ${error ? 'border-bu-danger focus:border-bu-danger focus:ring-1 focus:ring-bu-danger' : 'border-gray-300 focus:border-bu-blue focus:ring-1 focus:ring-bu-blue'}
            outline-hidden border text-gray-900 shadow-2xs cursor-pointer`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-bu-danger font-medium flex items-center">
          <span className="mr-1">⚠</span> {error}
        </p>
      )}
    </div>
  );
};
export default AppSelect;
