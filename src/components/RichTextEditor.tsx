/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Link2, 
  Image as ImageIcon, 
  Table as TableIcon,
  RotateCcw, 
  RotateCw, 
  Minimize2, 
  Code
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder = 'เริ่มพิมพ์เนื้อหาที่นี่...' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showHtml, setShowHtml] = useState(false);
  const [htmlValue, setHtmlValue] = useState(value);

  // Synchronize internal ref with external value without causing cursor losses
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
    setHtmlValue(value);
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      onChange(currentHtml);
      setHtmlValue(currentHtml);
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleInsertLink = () => {
    const url = prompt('ป้อน URL ของลิงก์ (Enter Link URL):', 'https://');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleInsertImage = () => {
    const type = confirm('ต้องการแทรกรูปภาพผ่านทาง URL (กด OK) หรือใช้รูปจำลอง (กด Cancel)?');
    if (type) {
      const url = prompt('ป้อน URL รูปภาพ (Image URL):', 'https://images.unsplash.com/');
      if (url) {
        executeCommand('insertImage', url);
      }
    } else {
      const url = 'https://picsum.photos/600/400';
      executeCommand('insertImage', url);
    }
  };

  const handleInsertTable = () => {
    const rows = prompt('จำนวนแถว (Rows):', '3');
    const cols = prompt('จำนวนคอลัมน์ (Columns):', '3');
    
    if (rows && cols) {
      const rCount = parseInt(rows);
      const cCount = parseInt(cols);
      
      if (isNaN(rCount) || isNaN(cCount)) return;

      let tableHtml = '<table class="min-w-full border-collapse border border-gray-300 my-4 text-sm">';
      tableHtml += '<thead><tr>';
      for (let j = 0; j < cCount; j++) {
        tableHtml += `<th class="border border-gray-300 bg-gray-150 p-2 font-bold text-left">หัวข้อ ${j + 1}</th>`;
      }
      tableHtml += '</tr></thead><tbody>';
      for (let i = 0; i < rCount; i++) {
        tableHtml += '<tr>';
        for (let j = 0; j < cCount; j++) {
          tableHtml += '<td class="border border-gray-300 p-2">ข้อมูล</td>';
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table><p></p>';
      
      // Focus first
      if (editorRef.current) {
        editorRef.current.focus();
      }
      executeCommand('insertHTML', tableHtml);
    }
  };

  const formatBlock = (blockType: string) => {
    executeCommand('formatBlock', blockType);
  };

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-xs focus-within:border-bu-blue focus-within:ring-2 focus-within:ring-bu-blue/10 transition-all flex flex-col min-h-[300px]">
      
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 bg-gray-50 border-b border-gray-200 p-2 text-gray-700">
        
        {/* Undo / Redo */}
        <button 
          type="button"
          onClick={() => executeCommand('undo')} 
          className="p-1 px-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
          title="Undo"
        >
          <RotateCcw size={15} />
        </button>
        <button 
          type="button"
          onClick={() => executeCommand('redo')} 
          className="p-1 px-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
          title="Redo"
        >
          <RotateCw size={15} />
        </button>

        <div className="h-4 w-[1px] bg-gray-300 mx-1" />

        {/* Text Formats */}
        <button 
          type="button"
          onClick={() => executeCommand('bold')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer font-bold"
          title="Bold"
        >
          <Bold size={15} />
        </button>
        <button 
          type="button"
          onClick={() => executeCommand('italic')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer italic"
          title="Italic"
        >
          <Italic size={15} />
        </button>
        <button 
          type="button"
          onClick={() => executeCommand('underline')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer underline"
          title="Underline"
        >
          <Underline size={15} />
        </button>

        <div className="h-4 w-[1px] bg-gray-300 mx-1" />

        {/* Headings */}
        <button 
          type="button"
          onClick={() => formatBlock('H1')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-0.5"
          title="Heading 1"
        >
          <Heading1 size={15} />
        </button>
        <button 
          type="button"
          onClick={() => formatBlock('H2')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-0.5"
          title="Heading 2"
        >
          <Heading2 size={15} />
        </button>
        <button 
          type="button"
          onClick={() => formatBlock('H3')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-0.5"
          title="Heading 3"
        >
          <Heading3 size={15} />
        </button>
        <button 
          type="button"
          onClick={() => formatBlock('P')} 
          className="p-1 px-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 text-xs font-semibold cursor-pointer"
          title="Paragraph"
        >
          Normal
        </button>
        <button 
          type="button"
          onClick={() => formatBlock('BLOCKQUOTE')} 
          className="p-1 px-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 text-xs font-semibold cursor-pointer italic border-l-2 border-gray-400 pl-1.5"
          title="Blockquote"
        >
          Quote
        </button>

        <div className="h-4 w-[1px] bg-gray-300 mx-1" />

        {/* Lists */}
        <button 
          type="button"
          onClick={() => executeCommand('insertUnorderedList')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
          title="Bullet List"
        >
          <List size={15} />
        </button>
        <button 
          type="button"
          onClick={() => executeCommand('insertOrderedList')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
          title="Number List"
        >
          <ListOrdered size={15} />
        </button>

        <div className="h-4 w-[1px] bg-gray-300 mx-1" />

        {/* Alignments */}
        <button 
          type="button"
          onClick={() => executeCommand('justifyLeft')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
          title="Align Left"
        >
          <AlignLeft size={15} />
        </button>
        <button 
          type="button"
          onClick={() => executeCommand('justifyCenter')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
          title="Align Center"
        >
          <AlignCenter size={15} />
        </button>
        <button 
          type="button"
          onClick={() => executeCommand('justifyRight')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
          title="Align Right"
        >
          <AlignRight size={15} />
        </button>
        <button 
          type="button"
          onClick={() => executeCommand('justifyFull')} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
          title="Justify"
        >
          <AlignJustify size={15} />
        </button>

        <div className="h-4 w-[1px] bg-gray-300 mx-1" />

        {/* Media / Tables */}
        <button 
          type="button"
          onClick={handleInsertLink} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
          title="Insert Link"
        >
          <Link2 size={15} />
        </button>
        <button 
          type="button"
          onClick={handleInsertImage} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
          title="Insert Image"
        >
          <ImageIcon size={15} />
        </button>
        <button 
          type="button"
          onClick={handleInsertTable} 
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
          title="Insert Table"
        >
          <TableIcon size={15} />
        </button>

        <div className="ml-auto flex items-center">
          <button 
            type="button"
            onClick={() => setShowHtml(!showHtml)}
            className={`p-1 px-2 rounded-lg text-xs font-semibold flex items-center gap-1 tracking-wide transition-colors cursor-pointer ${
              showHtml ? 'bg-bu-blue text-white' : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Toggle Raw HTML Editor"
          >
            <Code size={13} />
            HTML
          </button>
        </div>

      </div>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        {showHtml ? (
          <textarea
            value={htmlValue}
            onChange={(e) => {
              setHtmlValue(e.target.value);
              onChange(e.target.value);
            }}
            className="flex-1 w-full p-4 font-mono text-xs bg-gray-950 text-emerald-400 focus:outline-none resize-y min-h-[200px]"
            placeholder="เขียนโค้ด HTML ที่นี่ (Edit HTML raw contents here)"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className="rich-text-editor-workspace flex-1 p-4 overflow-y-auto focus:outline-none text-sm text-gray-850 leading-relaxed min-h-[200px]"
            style={{ minHeight: '200px' }}
          />
        )}
      </div>

    </div>
  );
};
