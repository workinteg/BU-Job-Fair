/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const AppLoading: React.FC<{ message?: string }> = ({ message = 'Loading system parameters...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-100 animate-spin border-t-bu-blue"></div>
      </div>
      <p className="mt-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">{message}</p>
    </div>
  );
};
export default AppLoading;
