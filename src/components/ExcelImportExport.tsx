import React, { useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { DocumentArrowDownIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

export function ExcelImportExport() {
  const { downloadExcelTemplate, importFromExcel } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    downloadExcelTemplate();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        alert('يرجى اختيار ملف Excel صالح (.xlsx أو .xls)');
        return;
      }

      importFromExcel(file);
      
      // مسح قيمة input لإمكانية رفع نفس الملف مرة أخرى
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="excel-section flex flex-col sm:flex-row gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          استيراد وتصدير Excel
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          يمكنك تحميل قالب Excel لملء البيانات أو رفع ملف Excel يحتوي على روابط
        </p>
      </div>
      
      <div className="excel-buttons flex flex-col sm:flex-row gap-2">
        {/* زر تحميل القالب */}
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 text-sm font-medium"
        >
          <DocumentArrowDownIcon className="w-4 h-4" />
          تحميل قالب Excel
        </button>

        {/* زر رفع الملف */}
        <button
          onClick={handleUploadClick}
          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-200 text-sm font-medium"
        >
          <DocumentArrowUpIcon className="w-4 h-4" />
          رفع ملف Excel
        </button>

        {/* Input مخفي لرفع الملف */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
