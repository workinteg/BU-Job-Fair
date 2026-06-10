/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CompanyMaster } from '../types';
import { companySearchService } from '../services/companySearchService';
import { Search, Loader2, X, Check } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

interface CompanyAutocompleteProps {
  onSelect: (company: CompanyMaster | null) => void;
  placeholder?: string;
  initialValue?: CompanyMaster | null;
  className?: string;
  id?: string;
}

export const CompanyAutocomplete: React.FC<CompanyAutocompleteProps> = ({
  onSelect,
  placeholder = 'Type to search companies...',
  initialValue = null,
  className = '',
  id = 'company-autocomplete-comp'
}) => {
  const { language } = useTranslation();
  
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CompanyMaster[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyMaster | null>(initialValue);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initialValue
  useEffect(() => {
    if (initialValue) {
      setSelectedCompany(initialValue);
      setQuery(language === 'th' ? initialValue.companyNameTH : initialValue.companyNameEN);
    } else if (selectedCompany && !initialValue) {
      setSelectedCompany(null);
      setQuery('');
    }
  }, [initialValue, language]);

  // Handle autocomplete dynamic suggestions
  useEffect(() => {
    if (!isOpen || selectedCompany) {
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const list = await companySearchService.getCompanySuggestions(query);
        setSuggestions(list);
        setHighlightedIndex(prev => Math.min(prev, list.length - 1));
      } catch (err) {
        console.error('Error loading autocomplete suggestions', err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 180); // Debounce to allow fluid performance

    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen, selectedCompany]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    if (selectedCompany) {
      // Clear selection if user types again
      setSelectedCompany(null);
      onSelect(null);
    }
  };

  const selectOption = (comp: CompanyMaster) => {
    setSelectedCompany(comp);
    setQuery(language === 'th' ? comp.companyNameTH : comp.companyNameEN);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelect(comp);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        selectOption(suggestions[highlightedIndex]);
      } else if (!selectedCompany && suggestions.length > 0) {
        // Fallback: select first match
        selectOption(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearSelection = () => {
    setSelectedCompany(null);
    setQuery('');
    setSuggestions([]);
    onSelect(null);
    setIsOpen(true);
  };

  return (
    <div 
      id={id}
      ref={containerRef} 
      className={`relative w-full ${className}`}
    >
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search size={16} />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true);
            // Pre-load suggestions on empty focus
            if (!query && suggestions.length === 0) {
              setLoading(true);
              companySearchService.getCompanySuggestions('').then(list => {
                setSuggestions(list);
                setLoading(false);
              });
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-350 pl-10 pr-10 py-2.5 text-sm font-medium text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-bu-blue/20 focus:border-bu-blue focus:outline-none transition-all shadow-3xs"
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
          {loading && (
            <Loader2 size={16} className="text-bu-blue animate-spin" />
          )}
          {query && (
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 rounded-full hover:bg-gray-150 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {isOpen && (suggestions.length > 0 || !loading) && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto overflow-x-hidden animate-slide-in">
          {suggestions.length > 0 ? (
            <div className="py-1.5">
              <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-50/50">
                {language === 'th' ? `ผลลัพธ์การค้นหา (${suggestions.length})` : `Search Matches (${suggestions.length})`}
              </div>
              
              {suggestions.map((comp, index) => {
                const isSelected = selectedCompany?.id === comp.id;
                const isHighlighted = highlightedIndex === index;
                
                return (
                  <div
                    key={comp.id || index}
                    onClick={() => selectOption(comp)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isHighlighted ? 'bg-bu-blue/5 text-bu-blue' : 'text-gray-800'
                    } ${isSelected ? 'font-bold bg-bu-blue/10' : ''}`}
                  >
                    <div className="text-left flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-500 font-mono px-1.5 py-0.5 rounded shrink-0">
                          {comp.companyCode}
                        </span>
                        <span className="text-sm font-bold truncate block">
                          {language === 'th' ? comp.companyNameTH : comp.companyNameEN}
                        </span>
                      </div>
                      <span className="block text-[11px] text-gray-400 truncate mt-0.5 pl-1.5 border-l border-gray-200 ml-1">
                        {language === 'th' ? comp.companyNameEN : comp.companyNameTH}
                      </span>
                    </div>

                    <div className="shrink-0 pl-1">
                      {isSelected ? (
                        <span className="text-bu-blue p-0.5 bg-white rounded-full border border-bu-blue/20 shadow-3xs">
                          <Check size={14} />
                        </span>
                      ) : comp.businessCategoryNameTH ? (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                          {language === 'th' ? comp.businessCategoryNameTH : comp.businessCategoryNameEN}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-450 text-xs">
              {language === 'th' ? ' ไม่พบข้อมูลสถานประกอบการที่มีอยู่' : 'No matching companies found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyAutocomplete;
