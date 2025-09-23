import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Group } from '../types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  TagIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export function GroupsPage() {
  const { state, addGroup, updateGroup, deleteGroup, recordClick } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    linkIds: [] as string[]
  });

  const resetForm = () => {
    setFormData({ name: '', linkIds: [] });
    setEditingGroup(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم المجموعة');
      return;
    }

    if (formData.linkIds.length === 0) {
      toast.error('يرجى اختيار روابط للمجموعة');
      return;
    }

    if (editingGroup) {
      updateGroup(editingGroup.id, formData.name.trim(), formData.linkIds);
    } else {
      addGroup(formData.name.trim(), formData.linkIds);
    }

    resetForm();
  };

  const handleEdit = (group: Group) => {
    setFormData({
      name: group.name,
      linkIds: [...group.linkIds]
    });
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleDelete = async (group: Group) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف المجموعة "${group.name}" ولا يمكن التراجع عن هذا الإجراء`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      deleteGroup(group.id);
    }
  };

  const handleOpenGroup = async (group: Group) => {
    const validLinks = group.linkIds
      .map(id => state.links.find(link => link.id === id))
      .filter(link => link);

    if (validLinks.length === 0) {
      toast.error('لا توجد روابط صالحة في هذه المجموعة');
      return;
    }

    // عرض خيارات للمستخدم
    const { value: action } = await Swal.fire({
      title: `مجموعة: ${group.name}`,
      text: `تحتوي على ${validLinks.length} رابط`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'فتح جميع الروابط',
      cancelButtonText: 'اختيار رابط واحد',
      reverseButtons: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#3b82f6'
    });

    if (action === true) {
      // فتح جميع الروابط
      let openedCount = 0;
      validLinks.forEach((link, index) => {
        setTimeout(() => {
          recordClick(link.id);
          window.open(link.url, '_blank', 'noopener,noreferrer');
          openedCount++;
          
          if (openedCount === validLinks.length) {
            toast.success(`تم فتح جميع الروابط (${validLinks.length})`);
          }
        }, index * 200); // تأخير 200ms بين كل رابط لتجنب حظر المتصفح
      });
    } else if (action === false) {
      // اختيار رابط واحد
      const { value: selectedLinkId } = await Swal.fire({
        title: 'اختر رابط للفتح',
        input: 'select',
        inputOptions: validLinks.reduce((acc, link) => {
          acc[link.id] = link.name;
          return acc;
        }, {} as Record<string, string>),
        showCancelButton: true,
        confirmButtonText: 'فتح',
        cancelButtonText: 'إلغاء',
        inputValidator: (value) => {
          if (!value) {
            return 'يرجى اختيار رابط';
          }
        }
      });

      if (selectedLinkId) {
        const selectedLink = validLinks.find(link => link.id === selectedLinkId);
        if (selectedLink) {
          recordClick(selectedLink.id);
          window.open(selectedLink.url, '_blank', 'noopener,noreferrer');
          toast.success('تم فتح الرابط');
        }
      }
    }
  };

  const toggleLinkSelection = (linkId: string) => {
    setFormData(prev => ({
      ...prev,
      linkIds: prev.linkIds.includes(linkId)
        ? prev.linkIds.filter(id => id !== linkId)
        : [...prev.linkIds, linkId]
    }));
  };

  const getGroupLinks = (linkIds: string[]) => {
    return linkIds
      .map(id => state.links.find(link => link.id === id))
      .filter(link => link);
  };

  const getCategoryName = (categoryId: string) => {
    const category = state.categories.find(c => c.id === categoryId);
    return category?.name || '';
  };

  // تصفية الروابط بناءً على البحث
  const filteredLinks = state.links.filter(link => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      link.name.toLowerCase().includes(searchLower) ||
      (link.description && link.description.toLowerCase().includes(searchLower)) ||
      link.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      getCategoryName(link.categoryId).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-cairo">
          إدارة المجموعات
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-tajawal shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <TagIcon className="h-5 w-5 ml-2" />
          إضافة مجموعة جديدة
        </button>
      </div>

      {/* قائمة المجموعات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {state.groups.map(group => {
          const groupLinks = getGroupLinks(group.linkIds);
          
          return (
            <div key={group.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <TagIcon className="h-6 w-6 text-blue-600 ml-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-tajawal">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-tajawal">
                      {groupLinks.length} رابط
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleOpenGroup(group)}
                    className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-md transition-colors"
                    title="فتح جميع الروابط"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(group)}
                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md transition-colors"
                    title="تعديل"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(group)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-md transition-colors"
                    title="حذف"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* روابط المجموعة */}
              <div className="space-y-2">
                {groupLinks.slice(0, 5).map(link => (
                  <div key={link.id} className="flex items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <LinkIcon className="h-4 w-4 text-gray-500 ml-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate font-tajawal">
                        {link.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-tajawal">
                        {getCategoryName(link.categoryId)} • {link.clicks} نقرة
                      </p>
                    </div>
                  </div>
                ))}
                
                {groupLinks.length > 5 && (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 font-tajawal">
                    و {groupLinks.length - 5} رابط آخر...
                  </div>
                )}
              </div>

              {groupLinks.length === 0 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4 font-tajawal">
                  لا توجد روابط صالحة في هذه المجموعة
                </div>
              )}
            </div>
          );
        })}
      </div>

      {state.groups.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-tajawal">
          لا توجد مجموعات بعد. ابدأ بإضافة مجموعة جديدة!
        </div>
      )}

      {/* نموذج إضافة/تعديل المجموعة */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 p-3 rounded-xl ml-4">
                    <TagIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-cairo">
                      {editingGroup ? 'تعديل المجموعة' : 'إضافة مجموعة جديدة'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-tajawal">
                      {editingGroup ? 'قم بتعديل تفاصيل المجموعة' : 'أنشئ مجموعة جديدة من الروابط'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 font-tajawal">
                    اسم المجموعة *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="أدخل اسم المجموعة..."
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-tajawal">
                      اختر الروابط
                    </label>
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                      {formData.linkIds.length} محدد
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="البحث في الروابط..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <div className="absolute left-3 top-3 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                      </div>
                    </div>
                    {searchTerm && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-tajawal">
                        عرض {filteredLinks.length} من {state.links.length} رابط
                      </div>
                    )}
                  </div>
                  
                  {state.links.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-tajawal">
                      لا توجد روابط متاحة. أضف بعض الروابط أولاً.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      {filteredLinks.map(link => (
                        <label
                          key={link.id}
                          className={`flex items-center p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-200 border ${
                            formData.linkIds.includes(link.id) 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' 
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.linkIds.includes(link.id)}
                            onChange={() => toggleLinkSelection(link.id)}
                            className="ml-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <LinkIcon className="h-4 w-4 text-gray-500 ml-2" />
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate font-tajawal">
                                {link.name}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-tajawal mt-1">
                              {getCategoryName(link.categoryId)} • {link.clicks} نقرة
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-tajawal border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-tajawal shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {editingGroup ? 'تحديث المجموعة' : 'إضافة المجموعة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}