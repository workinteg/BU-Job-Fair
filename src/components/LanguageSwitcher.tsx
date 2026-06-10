/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-2xs">
      <button
        onClick={() => setLanguage('th')}
        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer ${
          language === 'th'
            ? 'bg-bu-blue text-white shadow-2xs'
            : 'text-gray-500 hover:text-gray-900 bg-transparent'
        }`}
      >
        TH
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 cursor-pointer ${
          language === 'en'
            ? 'bg-bu-blue text-white shadow-2xs'
            : 'text-gray-500 hover:text-gray-900 bg-transparent'
        }`}
      >
        EN
      </button>
    </div>
  );
};
export default LanguageSwitcher;
