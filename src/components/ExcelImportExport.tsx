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
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          استيراد وتصدير Excel
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          يمكنك تحميل قالب Excel لملء البيانات أو رفع ملف Excel يحتوي على روابط
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {/* زر تحميل القالب */}
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          تحميل قالب Excel
        </button>

        {/* زر رفع الملف */}
        <button
          onClick={handleUploadClick}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          <DocumentArrowUpIcon className="w-5 h-5" />
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
