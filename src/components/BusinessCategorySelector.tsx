/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { categoryService, CategoryTreeNode } from '../services/categoryService';
import { BusinessCategory } from '../types';

interface BusinessCategorySelectorProps {
  selectedId: string | null;
  selectedCustomText?: string;
  onChange: (categoryId: string | null, customText: string) => void;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
  labelClassName?: string;
}

export const BusinessCategorySelector: React.FC<BusinessCategorySelectorProps> = ({
  selectedId,
  selectedCustomText = '',
  onChange,
  error = null,
  required = false,
  disabled = false,
  labelClassName = ''
}) => {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [parentCode, setParentCode] = useState<string>('');
  const [childId, setChildId] = useState<string>('');
  const [customText, setCustomText] = useState<string>(selectedCustomText);
  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to categories list to ensure real-time updates across the app
  useEffect(() => {
    setLoading(true);
    const unsubscribe = categoryService.subscribeBusinessCategories(
      (list) => {
        const activeList = list.filter(c => c.active);
        setCategories(activeList);

        // Build Tree structure from active categories
        const parents = activeList.filter(c => c.level === 1) as CategoryTreeNode[];
        const children = activeList.filter(c => c.level === 2);
        parents.forEach(p => {
          p.children = children.filter(c => c.parentCode === p.categoryCode);
        });
        setTree(parents);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe categories in selectorComponent', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync state when selectedId changes externally
  useEffect(() => {
    if (!selectedId || categories.length === 0) {
      setParentCode('');
      setChildId('');
      return;
    }

    const currentCat = categories.find(c => c.id === selectedId);
    if (!currentCat) {
      setParentCode('');
      setChildId('');
      return;
    }

    if (currentCat.level === 1) {
      setParentCode(currentCat.categoryCode);
      setChildId('');
    } else {
      // It's a Level 2 Child Category
      const parent = categories.find(c => c.categoryCode === currentCat.parentCode);
      if (parent) {
        setParentCode(parent.categoryCode);
        setChildId(currentCat.id || '');
      }
    }
  }, [selectedId, categories]);

  // Sync custom text state Externally
  useEffect(() => {
    setCustomText(selectedCustomText);
  }, [selectedCustomText]);

  // Handle Parent Dropdown change
  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setParentCode(code);
    setChildId('');
    
    if (!code) {
      onChange(null, '');
      return;
    }

    const selectedParent = tree.find(p => p.categoryCode === code);
    if (!selectedParent) {
      onChange(null, '');
      return;
    }

    // If the parent has NO children (like OTHERS), it's the target selection
    if (!selectedParent.children || selectedParent.children.length === 0) {
      onChange(selectedParent.id || null, selectedParent.allowCustomText ? customText : '');
    } else {
      // User must choose a child, so temporarily selectedId is null
      onChange(null, '');
    }
  };

  // Handle Child Dropdown change
  const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setChildId(id);

    if (!id) {
      onChange(null, '');
      return;
    }

    const chosenChild = categories.find(c => c.id === id);
    if (!chosenChild) {
      onChange(null, '');
      return;
    }

    onChange(id, chosenChild.allowCustomText ? customText : '');
  };

  const handleCustomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCustomText(text);

    const currentActiveId = childId || (tree.find(p => p.categoryCode === parentCode)?.id) || null;
    onChange(currentActiveId, text);
  };

  // Locate current active category to detect whether Custom Text Input is required
  const activeCategory = categories.find(c => {
    if (childId) return c.id === childId;
    const parentObj = tree.find(p => p.categoryCode === parentCode);
    if (parentObj && (!parentObj.children || parentObj.children.length === 0)) {
      return c.id === parentObj.id;
    }
    return false;
  });

  const showCustomTextInput = activeCategory?.allowCustomText || false;
  const currentParentObj = tree.find(p => p.categoryCode === parentCode);
  const eligibleChildren = currentParentObj?.children || [];

  return (
    <div className="space-y-4" id="business-category-selector-container">
      {/* 1. Parent Dropdown */}
      <div>
        <label className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`} id="parent-category-label">
          หมวดธุรกิจหลัก / Parent Category {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id="parent-category-select"
          className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition disabled:bg-gray-100 disabled:text-gray-400"
          value={parentCode}
          onChange={handleParentChange}
          disabled={disabled || loading}
        >
          <option value="">-- เลือกหมวดธุรกิจหลัก / Select Parent Category --</option>
          {tree.map(p => (
            <option key={p.categoryCode} value={p.categoryCode}>
              {p.categoryNameTH} ({p.categoryNameEN})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Child Dropdown */}
      {parentCode && eligibleChildren.length > 0 && (
        <div className="transition-all duration-300 transform translate-y-0" id="child-category-container">
          <label className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`} id="child-category-label">
            หมวดธุรกิจย่อย / Child Category {required && <span className="text-red-500">*</span>}
          </label>
          <select
            id="child-category-select"
            className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition disabled:bg-gray-100 disabled:text-gray-400"
            value={childId}
            onChange={handleChildChange}
            disabled={disabled || loading}
          >
            <option value="">-- เลือกหมวดธุรกิจย่อย / Select Child Category --</option>
            {eligibleChildren.map(c => (
              <option key={c.id} value={c.id}>
                {c.categoryNameTH} {c.categoryNameEN ? `(${c.categoryNameEN})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Custom Text Input (Shown when active category has allowCustomText = true) */}
      {showCustomTextInput && (
        <div className="transition-all duration-300" id="custom-category-text-container">
          <label className={`block text-sm font-medium text-amber-700 mb-1 ${labelClassName}`} id="custom-category-text-label">
            โปรดระบุหมวดธุรกิจ / Please specify category details <span className="text-red-500">*</span>
          </label>
          <input
            id="custom-category-text-input"
            type="text"
            className="w-full h-11 px-3 border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-lg shadow-sm bg-amber-50/30 font-medium placeholder-gray-400"
            placeholder="ตัวอย่างเช่น หมวดอื่น ๆ : ค้าขายออนไลน์, งานออกแบบกระจก"
            value={customText}
            onChange={handleCustomTextChange}
            disabled={disabled}
            required
          />
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1" id="business-category-selector-error">{error}</p>}
    </div>
  );
};
