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

    if (validLinks.length === 1) {
      // فتح رابط واحد فقط
      const link = validLinks[0];
      recordClick(link.id);
      window.open(link.url, '_blank', 'noopener,noreferrer');
      toast.success('تم فتح الرابط');
    } else {
      // عرض قائمة للاختيار من بين عدة روابط
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-cairo">
          إدارة المجموعات
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors font-tajawal"
        >
          <PlusIcon className="h-5 w-5 ml-2" />
          إضافة مجموعة
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
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-cairo">
                  {editingGroup ? 'تعديل المجموعة' : 'إضافة مجموعة جديدة'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                    اسم المجموعة *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 font-tajawal">
                    اختر الروابط ({formData.linkIds.length} محدد)
                  </label>
                  
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="البحث في الروابط..."
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
                      onChange={(e) => {
                        const searchTerm = e.target.value.toLowerCase();
                        const filteredLinks = state.links.filter(link =>
                          link.name.toLowerCase().includes(searchTerm) ||
                          link.description.toLowerCase().includes(searchTerm)
                        );
                        // يمكن إضافة منطق التصفية هنا
                      }}
                    />
                  </div>
                  
                  {state.links.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-tajawal">
                      لا توجد روابط متاحة. أضف بعض الروابط أولاً.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-3">
                      {state.links.map(link => (
                        <label
                          key={link.id}
                          className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.linkIds.includes(link.id)}
                            onChange={() => toggleLinkSelection(link.id)}
                            className="ml-3"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate font-tajawal">
                              {link.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-tajawal">
                              {getCategoryName(link.categoryId)} • {link.clicks} نقرة
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-tajawal"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-tajawal"
                  >
                    {editingGroup ? 'تحديث' : 'إضافة'}
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