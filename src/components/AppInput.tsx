/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  icon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || 'input_' + Math.random().toString(36).substr(2, 9);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-xs">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`block w-full rounded-lg border-gray-300 text-sm py-2.5 px-3 transition-colors duration-200
            ${icon ? 'pl-10' : ''} 
            ${error ? 'border-bu-danger focus:border-bu-danger focus:ring-1 focus:ring-bu-danger' : 'border-gray-300 focus:border-bu-blue focus:ring-1 focus:ring-bu-blue'}
            outline-hidden border text-gray-900 bg-white placeholder-gray-400 shadow-2xs`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-bu-danger font-medium flex items-center">
          <span className="mr-1">⚠</span> {error}
        </p>
      )}
    </div>
  );
};
export default AppInput;
