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
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ChevronDoubleRightIcon,
  ChevronDoubleLeftIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { state, toggleTheme, toggleSidebar, exportData } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const navigation = [
    { id: 'links', name: 'الروابط', icon: LinkIcon },
    { id: 'categories', name: 'الأقسام', icon: FolderIcon },
    { id: 'groups', name: 'المجموعات', icon: TagIcon },
    { id: 'stats', name: 'الإحصائيات', icon: ChartBarIcon }
  ];

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          // importData(data); // سيتم تنفيذها لاحقاً
        } catch (error) {
          console.error('خطأ في استيراد البيانات:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors"
      onContextMenu={handleContextMenu}
      onClick={() => setContextMenu(null)}
    >
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
                className="hidden lg:block p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ml-2"
                title={state.sidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
              >
                {state.sidebarCollapsed ? 
                  <ChevronDoubleLeftIcon className="h-5 w-5" /> : 
                  <ChevronDoubleRightIcon className="h-5 w-5" />
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
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {state.theme === 'light' ? 
                  <MoonIcon className="h-5 w-5" /> : 
                  <SunIcon className="h-5 w-5" />
                }
              </button>

              <button
                onClick={exportData}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                title="تصدير البيانات"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>

              <label className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" title="استيراد البيانات">
                <ArrowUpTrayIcon className="h-5 w-5" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 right-0 z-50 ${state.sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'} w-64 bg-white dark:bg-gray-800 shadow-xl lg:shadow-none border-l border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out`}>
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
                      } group flex items-center px-4 py-2 text-sm font-medium rounded-md w-full ${state.sidebarCollapsed ? 'justify-center' : 'text-right'} transition-colors font-tajawal`}
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
                    <span>{state.links.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الأقسام:</span>
                    <span>{state.categories.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المجموعات:</span>
                    <span>{state.groups.length}</span>
                  </div>
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
        <main className={`flex-1 transition-all duration-300 ${state.sidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64'}`}>
          <div className="h-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              exportData();
              setContextMenu(null);
            }}
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-right"
          >
            <ArrowDownTrayIcon className="h-4 w-4 ml-2" />
            تصدير البيانات
          </button>
          <label className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-right cursor-pointer">
            <ArrowUpTrayIcon className="h-4 w-4 ml-2" />
            استيراد البيانات
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}