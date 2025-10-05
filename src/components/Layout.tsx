import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  LinkIcon, 
  FolderIcon, 
  TagIcon, 
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon,
  EyeSlashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { state, toggleTheme, toggleSidebar, toggleMinimalView } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // إضافة اختصار لوحة المفاتيح لإخفاء/إظهار القائمة الجانبية والعرض المبسط
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
      if (event.ctrlKey && event.key === 'm') {
        event.preventDefault();
        toggleMinimalView();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, toggleMinimalView]);

  const navigation = [
    { id: 'links', name: 'الروابط', icon: LinkIcon },
    { id: 'categories', name: 'الأقسام', icon: FolderIcon },
    { id: 'groups', name: 'المجموعات', icon: TagIcon },
    { id: 'stats', name: 'الإحصائيات', icon: ChartBarIcon }
  ];


  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
              >
                {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
              
              <button
                onClick={toggleSidebar}
                className="hidden lg:block p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ml-2 transition-all duration-200 hover:scale-110"
                title={`${state.sidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'} (Ctrl+B)`}
              >
                {state.sidebarCollapsed ? 
                  <ChevronDoubleLeftIcon className="h-5 w-5 transition-transform duration-200 hover:animate-pulse" /> : 
                  <ChevronDoubleRightIcon className="h-5 w-5 transition-transform duration-200 hover:animate-pulse" />
                }
              </button>
              
              <div className="flex-shrink-0 flex items-center mr-4">
                <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-600">
                  <path d="M8 16L16 8L24 16L16 24L8 16Z" fill="currentColor"/>
                  <circle cx="16" cy="16" r="3" fill="white"/>
                </svg>
                <h1 className={`mr-3 text-xl font-bold text-gray-900 dark:text-white font-cairo transition-opacity ${state.sidebarCollapsed ? 'lg:opacity-100' : 'lg:opacity-100'}`}>
                  إدارة الروابط
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              {/* زر العرض المبسط */}
              <button
                onClick={toggleMinimalView}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                title={state.minimalView ? 'العودة للعرض العادي (Ctrl+M)' : 'عرض مبسط - إخفاء كل شيء إلا الروابط والمجموعات (Ctrl+M)'}
              >
                {state.minimalView ? 
                  <EyeIcon className="h-5 w-5" /> : 
                  <EyeSlashIcon className="h-5 w-5" />
                }
              </button>
              
              {/* زر الوضع المظلم */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                title={state.theme === 'light' ? 'تفعيل الوضع المظلم' : 'تفعيل الوضع المضيء'}
              >
                {state.theme === 'light' ? 
                  <MoonIcon className="h-5 w-5" /> : 
                  <SunIcon className="h-5 w-5" />
                }
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 right-0 z-50 ${state.sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'} w-64 bg-white dark:bg-gray-800 shadow-xl lg:shadow-none border-l border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out flex flex-col`}>
          {/* شريط التمرير الرفيع */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onNavigate(item.id);
                        setSidebarOpen(false);
                      }}
                      title={state.sidebarCollapsed ? item.name : ''}
                      className={`${
                        currentPage === item.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      } group flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${state.sidebarCollapsed ? 'justify-center' : 'text-right'} transition-all duration-200 font-tajawal hover:scale-105`}
                    >
                      <Icon className={`h-5 w-5 ${state.sidebarCollapsed ? '' : 'ml-3'}`} />
                      {!state.sidebarCollapsed && item.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* إحصائيات سريعة */}
          {!state.sidebarCollapsed && (
            <div className="mt-8 px-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 font-cairo">
                  إحصائيات سريعة
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 font-tajawal">
                  <div className="flex justify-between">
                    <span>الروابط:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{state.links.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الأقسام:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{state.categories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المجموعات:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{state.groups.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* مؤشر الطي */}
          {state.sidebarCollapsed && (
            <div className="mt-8 px-2">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-tajawal">
                  {state.links.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-tajawal">
                  رابط
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Overlay للموبايل */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className={`flex-1 transition-all duration-300 overflow-hidden w-full ${state.sidebarCollapsed ? 'lg:mr-0' : 'lg:mr-64'} ${sidebarOpen ? 'mr-64' : ''}`}>
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}