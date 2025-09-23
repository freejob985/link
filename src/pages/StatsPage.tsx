import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { statsService } from '../services/stats';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  LinkIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export function StatsPage() {
  const { state } = useApp();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-cairo">
          الإحصائيات والتحليلات
        </h1>
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
            {stats.clicksByDay.map((day, index) => {
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
    </div>
  );
}