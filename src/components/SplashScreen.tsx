import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';

export function SplashScreen() {
  const { hideSplash } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center z-50">
      <div className="text-center">
        {/* شعار متحرك */}
        <div className="mb-8 relative">
          <svg 
            width="120" 
            height="120" 
            viewBox="0 0 120 120" 
            className={`mx-auto ${loading ? 'animate-spin' : ''}`}
          >
            <circle cx="60" cy="60" r="50" fill="none" stroke="white" strokeWidth="4" className="opacity-30"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="white" strokeWidth="4" strokeDasharray="314" strokeDashoffset="157" className={`transition-all duration-1000 ${loading ? '' : 'strokeDashoffset-0'}`}/>
            <path d="M30 60L60 30L90 60L60 90L30 60Z" fill="white" className={`transition-all duration-500 ${loading ? 'scale-75' : 'scale-100'}`}/>
            <circle cx="60" cy="60" r="8" fill="rgb(59, 130, 246)"/>
          </svg>
        </div>

        {/* عنوان التطبيق */}
        <h1 className="text-4xl font-bold text-white mb-4 font-cairo">
          إدارة الروابط
        </h1>
        <p className="text-xl text-blue-100 mb-8 font-tajawal">
          نظام متطور لإدارة وتنظيم روابطك
        </p>

        {/* مؤشر التحميل */}
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-white">جاري التحميل...</div>
          </div>
        ) : (
          <button
            onClick={hideSplash}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors duration-200 font-tajawal"
          >
            ابدأ الاستخدام
          </button>
        )}

        {/* نقاط الميزات */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg width="24" height="24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <p className="text-sm">إدارة سهلة</p>
          </div>
          <div className="text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg width="24" height="24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="text-sm">تنظيم ذكي</p>
          </div>
          <div className="text-white">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg width="24" height="24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <p className="text-sm">أداء سريع</p>
          </div>
        </div>
      </div>
    </div>
  );
}