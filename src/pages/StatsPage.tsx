import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { statsService } from '../services/stats';
import Swal from 'sweetalert2';
import { toast } from 'react-hot-toast';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  LinkIcon,
  CalendarIcon,
  ClockIcon,
  TagIcon,
  FolderPlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

interface StatsPageProps {
  onNavigate?: (page: string) => void;
}

export function StatsPage({ onNavigate }: StatsPageProps = {}) {
  const { state, exportData, importData, addCategory, addSubcategory, clearAllData } = useApp();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const stats = useMemo(() => {
    return statsService.calculateStats(state.links, state.clickRecords);
  }, [state.links, state.clickRecords]);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue' 
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
        <div className="mr-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 font-tajawal">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white font-cairo">
            {value.toLocaleString('ar')}
          </p>
        </div>
      </div>
    </div>
  );

  const getCategoryName = (categoryId: string) => {
    const category = state.categories.find(c => c.id === categoryId);
    return category?.name || 'بدون قسم';
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          importData(data);
          setShowContextMenu(false);
        } catch (error) {
          console.error('خطأ في استيراد البيانات:', error);
          toast.error('خطأ في استيراد البيانات');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAddCategory = async () => {
    const { value: names } = await Swal.fire({
      title: 'إضافة أقسام جديدة',
      html: `
        <div class="text-right space-y-4">
          <div class="bg-blue-50 rounded-lg p-3">
            <p class="text-sm text-blue-800">يمكنك إضافة عدة أقسام في كل سطر</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">أسماء الأقسام (سطر واحد لكل قسم)</label>
            <textarea id="categoryNames" 
                      placeholder="قسم التصميم&#10;قسم البرمجة&#10;قسم التسويق"
                      class="w-full h-32 p-3 border border-gray-300 rounded-lg text-right resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'إضافة جميع الأقسام',
      cancelButtonText: 'إلغاء',
      preConfirm: () => {
        const textarea = document.getElementById('categoryNames') as HTMLTextAreaElement;
        const names = textarea.value.split('\n').filter(name => name.trim());
        if (names.length === 0) {
          Swal.showValidationMessage('يرجى إدخال اسم قسم واحد على الأقل');
          return false;
        }
        return names;
      }
    });

    if (names && names.length > 0) {
      names.forEach((name: string) => {
        if (name.trim()) {
          addCategory(name.trim());
        }
      });
      toast.success(`تم إضافة ${names.length} قسم بنجاح`);
      setShowContextMenu(false);
    }
  };

  const handleAddSubcategory = async () => {
    if (state.categories.length === 0) {
      toast.error('يرجى إضافة قسم رئيسي أولاً');
      return;
    }

    const { value: categoryId } = await Swal.fire({
      title: 'اختر القسم الرئيسي',
      input: 'select',
      inputOptions: state.categories.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {} as Record<string, string>),
      showCancelButton: true,
      confirmButtonText: 'متابعة',
      cancelButtonText: 'إلغاء'
    });

    if (categoryId) {
      const { value: names } = await Swal.fire({
        title: 'إضافة أقسام فرعية جديدة',
        html: `
          <div class="text-right space-y-4">
            <div class="bg-green-50 rounded-lg p-3">
              <p class="text-sm text-green-800">يمكنك إضافة عدة أقسام فرعية في كل سطر</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">أسماء الأقسام الفرعية (سطر واحد لكل قسم)</label>
              <textarea id="subcategoryNames" 
                        placeholder="UI/UX&#10;جرافيك&#10;تصميم ويب"
                        class="w-full h-32 p-3 border border-gray-300 rounded-lg text-right resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows="4"></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'إضافة جميع الأقسام الفرعية',
        cancelButtonText: 'إلغاء',
        preConfirm: () => {
          const textarea = document.getElementById('subcategoryNames') as HTMLTextAreaElement;
          const names = textarea.value.split('\n').filter(name => name.trim());
          if (names.length === 0) {
            Swal.showValidationMessage('يرجى إدخال اسم قسم فرعي واحد على الأقل');
            return false;
          }
          return names;
        }
      });

      if (names && names.length > 0) {
        names.forEach((name: string) => {
          if (name.trim()) {
            addSubcategory(name.trim(), categoryId);
          }
        });
        toast.success(`تم إضافة ${names.length} قسم فرعي بنجاح`);
        setShowContextMenu(false);
      }
    }
  };

  const handleClearAllData = async () => {
    const result = await Swal.fire({
      title: '⚠️ تحذير!',
      html: `
        <div class="text-right space-y-4">
          <div class="bg-red-50 rounded-lg p-4 border border-red-200">
            <div class="flex items-center mb-2">
              <svg class="h-5 w-5 text-red-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 class="text-lg font-semibold text-red-800">هذا الإجراء لا يمكن التراجع عنه!</h3>
            </div>
            <p class="text-sm text-red-700">سيتم حذف جميع البيانات التالية:</p>
            <ul class="text-sm text-red-700 mt-2 space-y-1">
              <li>• جميع الروابط (${state.links.length} رابط)</li>
              <li>• جميع الأقسام الرئيسية (${state.categories.length} قسم)</li>
              <li>• جميع الأقسام الفرعية (${state.subcategories.length} قسم فرعي)</li>
              <li>• جميع المجموعات (${state.groups.length} مجموعة)</li>
              <li>• جميع الإحصائيات والنقرات</li>
            </ul>
          </div>
          <div class="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p class="text-sm text-yellow-800">
              <strong>نصيحة:</strong> تأكد من تصدير البيانات قبل المتابعة
            </p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف جميع البيانات',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      allowEscapeKey: true,
      allowOutsideClick: true,
      input: 'text',
      inputLabel: 'اكتب "حذف" للتأكيد',
      inputPlaceholder: 'حذف',
      inputValidator: (value: string) => {
        if (value !== 'حذف') {
          return 'يجب كتابة "حذف" للتأكيد';
        }
        return null;
      }
    });

    if (result.isConfirmed) {
      try {
        // استخدام دالة clearAllData من AppContext
        clearAllData();
        
        // إظهار رسالة النجاح
        await Swal.fire({
          title: 'تم بنجاح!',
          text: 'تم مسح جميع البيانات بنجاح',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          allowEscapeKey: true,
          allowOutsideClick: true,
        });
        
        // إعادة تحميل الصفحة فوراً
        window.location.reload();
        
      } catch (error) {
        console.error('خطأ في مسح البيانات:', error);
        await Swal.fire({
          title: 'خطأ!',
          text: 'حدث خطأ أثناء مسح البيانات',
          icon: 'error',
          allowEscapeKey: true,
          allowOutsideClick: true,
        });
      }
    }
  };

  // إغلاق قائمة السياق عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = () => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  return (
    <div className="h-full flex flex-col" onContextMenu={handleContextMenu}>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-cairo">
          الإحصائيات والتحليلات
        </h1>
        <button
          onClick={handleClearAllData}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-tajawal flex items-center"
        >
          <svg className="h-4 w-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          مسح جميع البيانات
        </button>
      </div>

      {/* إحصائيات عامة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي النقرات"
          value={stats.totalClicks}
          icon={ChartBarIcon}
          color="blue"
        />
        <StatCard
          title="نقرات اليوم"
          value={stats.clicksToday}
          icon={CalendarIcon}
          color="green"
        />
        <StatCard
          title="نقرات الأسبوع"
          value={stats.clicksThisWeek}
          icon={ClockIcon}
          color="yellow"
        />
        <StatCard
          title="نقرات الشهر"
          value={stats.clicksThisMonth}
          icon={ArrowTrendingUpIcon}
          color="purple"
        />
      </div>

      {/* أكثر الروابط استخداماً */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-cairo">
            أكثر الروابط استخداماً
          </h2>
        </div>
        <div className="p-6">
          {stats.topLinks.length > 0 ? (
            <div className="space-y-4">
              {stats.topLinks.map((item, index) => (
                <div key={item.link.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400 ml-3">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white font-tajawal">
                        {item.link.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-tajawal">
                        {getCategoryName(item.link.categoryId)}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400 font-cairo">
                      {item.clicks}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-tajawal">
                      نقرة
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-tajawal">
              لا توجد إحصائيات بعد
            </div>
          )}
        </div>
      </div>

      {/* مخطط النقرات اليومية */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-cairo">
            النقرات خلال آخر 30 يوم
          </h2>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-end space-x-1 space-x-reverse">
            {stats.clicksByDay.map((day) => {
              const maxClicks = Math.max(...stats.clicksByDay.map(d => d.clicks));
              const height = maxClicks > 0 ? (day.clicks / maxClicks) * 100 : 0;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-full bg-blue-500 dark:bg-blue-400 rounded-t transition-all duration-300 hover:bg-blue-600 dark:hover:bg-blue-300 min-h-[4px]"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.clicks} نقرة`}
                  />
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 transform rotate-45 font-tajawal">
                    {new Date(day.date).getDate()}
                  </div>
                  <div className="absolute bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -mt-8 font-tajawal">
                    {day.clicks} نقرة
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* إحصائيات الأقسام */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* إحصائيات حسب القسم */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-cairo">
              الروابط حسب القسم
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {state.categories.map(category => {
                const categoryLinks = state.links.filter(link => link.categoryId === category.id);
                const totalClicks = categoryLinks.reduce((sum, link) => sum + link.clicks, 0);
                
                return (
                  <div key={category.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-900 dark:text-white font-tajawal">
                      {category.name}
                    </span>
                    <div className="text-left">
                      <span className="text-sm font-bold text-gray-900 dark:text-white font-cairo">
                        {categoryLinks.length}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 font-tajawal">
                        ({totalClicks} نقرة)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* إحصائيات المجموعات */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-cairo">
              إحصائيات المجموعات
            </h2>
          </div>
          <div className="p-6">
            {state.groups.length > 0 ? (
              <div className="space-y-3">
                {state.groups.map(group => {
                  const groupLinks = group.linkIds
                    .map(id => state.links.find(link => link.id === id))
                    .filter(link => link);
                  const totalClicks = groupLinks.reduce((sum, link) => sum + (link?.clicks || 0), 0);
                  
                  return (
                    <div key={group.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-900 dark:text-white font-tajawal">
                        {group.name}
                      </span>
                      <div className="text-left">
                        <span className="text-sm font-bold text-gray-900 dark:text-white font-cairo">
                          {groupLinks.length}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 font-tajawal">
                          ({totalClicks} نقرة)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-tajawal">
                لا توجد مجموعات
              </div>
            )}
          </div>
        </div>
      </div>

      {/* قائمة السياق */}
      {showContextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-3 z-50 min-w-72"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          {/* قسم التنقل */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">التنقل السريع</h3>
          </div>
          
          <button
            onClick={() => {
              onNavigate?.('links');
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <LinkIcon className="h-4 w-4 ml-3 text-blue-600" />
            <div>
              <div className="font-medium">الروابط</div>
              <div className="text-xs text-gray-500">عرض وإدارة جميع الروابط</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              onNavigate?.('categories');
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <FolderPlusIcon className="h-4 w-4 ml-3 text-purple-600" />
            <div>
              <div className="font-medium">الأقسام</div>
              <div className="text-xs text-gray-500">إدارة الأقسام الرئيسية والفرعية</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              onNavigate?.('groups');
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <TagIcon className="h-4 w-4 ml-3 text-indigo-600" />
            <div>
              <div className="font-medium">المجموعات</div>
              <div className="text-xs text-gray-500">إدارة مجموعات الروابط</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              onNavigate?.('stats');
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <ChartBarIcon className="h-4 w-4 ml-3 text-green-600" />
            <div>
              <div className="font-medium">الإحصائيات</div>
              <div className="text-xs text-gray-500">عرض الإحصائيات والتحليلات</div>
            </div>
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
          
          {/* قسم الإضافة السريعة */}
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">إضافة سريع</h3>
          </div>
          
          <button
            onClick={() => {
              handleAddCategory();
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <FolderPlusIcon className="h-4 w-4 ml-3 text-purple-600" />
            <div>
              <div className="font-medium">إضافة قسم رئيسي</div>
              <div className="text-xs text-gray-500">إضافة أقسام جديدة</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              handleAddSubcategory();
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <FolderPlusIcon className="h-4 w-4 ml-3 text-orange-600" />
            <div>
              <div className="font-medium">إضافة قسم فرعي</div>
              <div className="text-xs text-gray-500">إضافة أقسام فرعية</div>
            </div>
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
          
          {/* قسم التصدير والاستيراد */}
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">البيانات</h3>
          </div>
          
          <button
            onClick={() => {
              exportData();
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <ArrowDownTrayIcon className="h-4 w-4 ml-3 text-green-600" />
            <div>
              <div className="font-medium">تصدير البيانات</div>
              <div className="text-xs text-gray-500">حفظ نسخة احتياطية من البيانات</div>
            </div>
          </button>
          
          <label className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 w-full text-right transition-colors rounded-lg mx-2 my-1 cursor-pointer">
            <ArrowUpTrayIcon className="h-4 w-4 ml-3 text-blue-600" />
            <div>
              <div className="font-medium">استيراد البيانات</div>
              <div className="text-xs text-gray-500">استعادة البيانات من ملف</div>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
          
          {/* قسم الخطر */}
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide mb-2">خطر</h3>
          </div>
          
          <button
            onClick={() => {
              handleClearAllData();
            }}
            className="flex items-center px-4 py-3 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <svg className="h-4 w-4 ml-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <div>
              <div className="font-medium">مسح جميع البيانات</div>
              <div className="text-xs text-red-500">حذف جميع الروابط والأقسام والمجموعات</div>
            </div>
          </button>
        </div>
      )}
      </div>
    </div>
  );
}