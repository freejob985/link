import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Category, Subcategory } from '../types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  FolderIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export function CategoriesPage() {
  const { state, addCategory, updateCategory, deleteCategory, addSubcategory, updateSubcategory, deleteSubcategory } = useApp();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState('');
  
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [subcategoryParent, setSubcategoryParent] = useState('');

  const resetForms = () => {
    setCategoryName('');
    setSubcategoryName('');
    setSubcategoryParent('');
    setEditingCategory(null);
    setEditingSubcategory(null);
    setShowCategoryForm(false);
    setShowSubcategoryForm(false);
  };

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast.error('يرجى إدخال اسم القسم');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryName.trim());
    } else {
      addCategory(categoryName.trim());
    }

    resetForms();
  };

  const handleSubmitSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subcategoryName.trim() || !subcategoryParent) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (editingSubcategory) {
      updateSubcategory(editingSubcategory.id, subcategoryName.trim());
    } else {
      addSubcategory(subcategoryName.trim(), subcategoryParent);
    }

    resetForms();
  };

  const handleEditCategory = (category: Category) => {
    setCategoryName(category.name);
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setSubcategoryName(subcategory.name);
    setSubcategoryParent(subcategory.categoryId);
    setEditingSubcategory(subcategory);
    setShowSubcategoryForm(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    const subcategoriesCount = state.subcategories.filter(sub => sub.categoryId === category.id).length;
    const linksCount = state.links.filter(link => link.categoryId === category.id).length;

    let warningMessage = `سيتم حذف القسم "${category.name}"`;
    if (subcategoriesCount > 0) {
      warningMessage += ` و ${subcategoriesCount} قسم فرعي`;
    }
    if (linksCount > 0) {
      warningMessage += `. سيتم نقل ${linksCount} رابط إلى "بدون قسم"`;
    }
    warningMessage += '. لا يمكن التراجع عن هذا الإجراء';

    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: warningMessage,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      deleteCategory(category.id);
    }
  };

  const handleDeleteSubcategory = async (subcategory: Subcategory) => {
    const linksCount = state.links.filter(link => link.subcategoryId === subcategory.id).length;
    
    let warningMessage = `سيتم حذف القسم الفرعي "${subcategory.name}"`;
    if (linksCount > 0) {
      warningMessage += `. سيتم نقل ${linksCount} رابط إلى "بدون قسم فرعي"`;
    }
    warningMessage += '. لا يمكن التراجع عن هذا الإجراء';

    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: warningMessage,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      deleteSubcategory(subcategory.id);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = state.categories.find(c => c.id === categoryId);
    return category?.name || '';
  };

  const getSubcategoriesForCategory = (categoryId: string) => {
    return state.subcategories.filter(sub => sub.categoryId === categoryId);
  };

  const getLinksCountForCategory = (categoryId: string) => {
    return state.links.filter(link => link.categoryId === categoryId).length;
  };

  const getLinksCountForSubcategory = (subcategoryId: string) => {
    return state.links.filter(link => link.subcategoryId === subcategoryId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-cairo">
          إدارة الأقسام
        </h1>
        <div className="flex space-x-4 space-x-reverse">
          <button
            onClick={() => setShowSubcategoryForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors font-tajawal"
          >
            <PlusIcon className="h-5 w-5 ml-2" />
            قسم فرعي
          </button>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors font-tajawal"
          >
            <PlusIcon className="h-5 w-5 ml-2" />
            قسم رئيسي
          </button>
        </div>
      </div>

      {/* الأقسام الرئيسية */}
      <div className="space-y-4">
        {state.categories.map(category => {
          const subcategories = getSubcategoriesForCategory(category.id);
          const linksCount = getLinksCountForCategory(category.id);
          
          return (
            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              {/* القسم الرئيسي */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <FolderIcon className="h-6 w-6 text-blue-600 ml-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-tajawal">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-tajawal">
                        {linksCount} رابط • {subcategories.length} قسم فرعي
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => {
                        setSelectedCategoryForSub(category.id);
                        setSubcategoryParent(category.id);
                        setShowSubcategoryForm(true);
                      }}
                      className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-md transition-colors"
                      title="إضافة قسم فرعي"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md transition-colors"
                      title="تعديل"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-md transition-colors"
                      title="حذف"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* الأقسام الفرعية */}
              {subcategories.length > 0 && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subcategories.map(subcategory => {
                      const subLinksCount = getLinksCountForSubcategory(subcategory.id);
                      
                      return (
                        <div
                          key={subcategory.id}
                          className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                        >
                          <div className="flex items-center">
                            <DocumentIcon className="h-4 w-4 text-gray-500 ml-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white font-tajawal">
                                {subcategory.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-tajawal">
                                {subLinksCount} رابط
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-1 space-x-reverse">
                            <button
                              onClick={() => handleEditSubcategory(subcategory)}
                              className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                              title="تعديل"
                            >
                              <PencilIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(subcategory)}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded transition-colors"
                              title="حذف"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {state.categories.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-tajawal">
          لا توجد أقسام بعد. ابدأ بإضافة قسم جديد!
        </div>
      )}

      {/* نموذج إضافة/تعديل قسم رئيسي */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-cairo">
                {editingCategory ? 'تعديل القسم' : 'إضافة قسم رئيسي'}
              </h2>

              <form onSubmit={handleSubmitCategory}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                    اسم القسم
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end space-x-4 space-x-reverse">
                  <button
                    type="button"
                    onClick={resetForms}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-tajawal"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-tajawal"
                  >
                    {editingCategory ? 'تحديث' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* نموذج إضافة/تعديل قسم فرعي */}
      {showSubcategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-cairo">
                {editingSubcategory ? 'تعديل القسم الفرعي' : 'إضافة قسم فرعي'}
              </h2>

              <form onSubmit={handleSubmitSubcategory}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                    اسم القسم الفرعي
                  </label>
                  <input
                    type="text"
                    value={subcategoryName}
                    onChange={(e) => setSubcategoryName(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                    القسم الرئيسي
                  </label>
                  <select
                    value={subcategoryParent}
                    onChange={(e) => setSubcategoryParent(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
                    required
                  >
                    <option value="">اختر القسم الرئيسي</option>
                    {state.categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-4 space-x-reverse">
                  <button
                    type="button"
                    onClick={resetForms}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-tajawal"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-tajawal"
                  >
                    {editingSubcategory ? 'تحديث' : 'إضافة'}
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