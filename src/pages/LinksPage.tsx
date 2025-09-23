import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Link } from '../types';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { TagInput } from '../components/TagInput';
import { aiService } from '../services/ai';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export function LinksPage() {
  const { state, addLink, updateLink, deleteLink, recordClick } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const linksPerPage = 16;

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    tags: [] as string[]
  });

  // تصفية الروابط
  const filteredLinks = useMemo(() => {
    return state.links.filter(link => {
      const matchesSearch = searchTerm === '' || 
        link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === '' || link.categoryId === selectedCategory;
      const matchesSubcategory = selectedSubcategory === '' || link.subcategoryId === selectedSubcategory;
      const matchesTag = selectedTag === '' || link.tags.includes(selectedTag);

      return matchesSearch && matchesCategory && matchesSubcategory && matchesTag;
    });
  }, [state.links, searchTerm, selectedCategory, selectedSubcategory, selectedTag]);

  // تقسيم الروابط إلى صفحات
  const totalPages = Math.ceil(filteredLinks.length / linksPerPage);
  const paginatedLinks = useMemo(() => {
    const startIndex = (currentPage - 1) * linksPerPage;
    return filteredLinks.slice(startIndex, startIndex + linksPerPage);
  }, [filteredLinks, currentPage, linksPerPage]);

  // إعادة تعيين الصفحة عند تغيير التصفية
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSubcategory, selectedTag]);
  // الحصول على الأقسام الفرعية للقسم المحدد
  const availableSubcategories = useMemo(() => {
    return state.subcategories.filter(sub => 
      formData.categoryId === '' || sub.categoryId === formData.categoryId
    );
  }, [state.subcategories, formData.categoryId]);

  // الحصول على جميع الكلمات الدلالية
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    state.links.forEach(link => {
      link.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [state.links]);

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      categoryId: '',
      subcategoryId: '',
      tags: []
    });
    setEditingLink(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    // التحقق من صحة الرابط
    try {
      new URL(formData.url);
    } catch {
      toast.error('يرجى إدخال رابط صحيح');
      return;
    }

    if (editingLink) {
      updateLink({
        ...editingLink,
        ...formData,
        subcategoryId: formData.subcategoryId || undefined
      });
    } else {
      addLink({
        ...formData,
        subcategoryId: formData.subcategoryId || undefined
      });
    }

    resetForm();
  };

  const handleEdit = (link: Link) => {
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description,
      categoryId: link.categoryId,
      subcategoryId: link.subcategoryId || '',
      tags: [...link.tags]
    });
    setEditingLink(link);
    setShowForm(true);
  };

  const handleDelete = async (link: Link) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: `سيتم حذف الرابط "${link.name}" ولا يمكن التراجع عن هذا الإجراء`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      deleteLink(link.id);
    }
  };

  const handleOpenLink = (link: Link) => {
    recordClick(link.id);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('تم نسخ الرابط');
    } catch {
      toast.error('فشل في نسخ الرابط');
    }
  };

  const handleAISuggestion = async () => {
    if (!formData.url.trim()) {
      toast.error('يرجى إدخال الرابط أولاً');
      return;
    }

    setIsLoadingAI(true);
    
    try {
      const suggestion = await aiService.suggestDescriptionAndTags(
        formData.url, 
        formData.name || undefined
      );
      
      setFormData(prev => ({
        ...prev,
        description: suggestion.description || prev.description,
        tags: [...new Set([...prev.tags, ...suggestion.tags])]
      }));
      
      toast.success('تم الحصول على الاقتراحات');
    } catch (error: any) {
      toast.error(error.message || 'فشل في الحصول على الاقتراحات');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = state.categories.find(c => c.id === categoryId);
    return category?.name || '';
  };

  const getSubcategoryName = (subcategoryId?: string) => {
    if (!subcategoryId) return '';
    const subcategory = state.subcategories.find(s => s.id === subcategoryId);
    return subcategory?.name || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-cairo">
          إدارة الروابط
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors font-tajawal"
        >
          <PlusIcon className="h-5 w-5 ml-2" />
          إضافة رابط
        </button>
      </div>

      {/* البحث والتصفية */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في الروابط..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory('');
            }}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
          >
            <option value="">جميع الأقسام</option>
            {state.categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            disabled={!selectedCategory}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal disabled:opacity-50"
          >
            <option value="">جميع الأقسام الفرعية</option>
            {state.subcategories
              .filter(sub => sub.categoryId === selectedCategory)
              .map(subcategory => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
          >
            <option value="">جميع الكلمات الدلالية</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 font-tajawal">
            <FunnelIcon className="h-4 w-4 ml-1" />
            {filteredLinks.length} من {state.links.length}
          </div>
        </div>
      </div>

      {/* قائمة الروابط */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedLinks.map(link => (
          <div key={link.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-tajawal">
                {link.name}
              </h3>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 font-tajawal">
                  <ChartBarIcon className="h-4 w-4 ml-1" />
                  {link.clicks}
                </div>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 font-tajawal">
              {link.description || 'لا يوجد وصف'}
            </p>

            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-tajawal">
              {getCategoryName(link.categoryId)}
              {getSubcategoryName(link.subcategoryId) && (
                <span> → {getSubcategoryName(link.subcategoryId)}</span>
              )}
            </div>

            {link.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {link.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-tajawal"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => handleOpenLink(link)}
                  className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-md transition-colors"
                  title="فتح الرابط"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleCopyLink(link.url)}
                  className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="نسخ الرابط"
                >
                  <ClipboardIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => handleEdit(link)}
                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md transition-colors"
                  title="تعديل"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(link)}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-md transition-colors"
                  title="حذف"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* التنقل بين الصفحات */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 space-x-reverse">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white font-tajawal"
          >
            <ChevronRightIcon className="h-5 w-5 ml-2" />
            السابق
          </button>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg font-cairo ${
                    currentPage === pageNum
                      ? 'text-blue-600 bg-blue-50 border border-blue-300 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white font-tajawal"
          >
            التالي
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
          </button>
        </div>
      )}

      {filteredLinks.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-tajawal">
          {searchTerm || selectedCategory || selectedSubcategory || selectedTag 
            ? 'لا توجد روابط تطابق معايير البحث'
            : 'لا توجد روابط بعد. ابدأ بإضافة رابط جديد!'}
        </div>
      )}

      {/* نموذج إضافة/تعديل الرابط */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-cairo">
                  {editingLink ? 'تعديل الرابط' : 'إضافة رابط جديد'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                    اسم الرابط *
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                    الرابط *
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-tajawal">
                      الوصف
                    </label>
                    <button
                      type="button"
                      onClick={handleAISuggestion}
                      disabled={isLoadingAI || !formData.url}
                      className="flex items-center text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 font-tajawal"
                    >
                      <SparklesIcon className="h-4 w-4 ml-1" />
                      {isLoadingAI ? 'جاري الحصول على الاقتراحات...' : 'اقتراح ذكي'}
                    </button>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                      القسم الرئيسي
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        categoryId: e.target.value,
                        subcategoryId: '' 
                      }))}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
                    >
                      <option value="">اختر القسم</option>
                      {state.categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                      القسم الفرعي
                    </label>
                    <select
                      value={formData.subcategoryId}
                      onChange={(e) => setFormData(prev => ({ ...prev, subcategoryId: e.target.value }))}
                      disabled={!formData.categoryId}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal disabled:opacity-50"
                    >
                      <option value="">اختر القسم الفرعي</option>
                      {availableSubcategories.map(subcategory => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                    الكلمات الدلالية
                  </label>
                  <TagInput
                    tags={formData.tags}
                    onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                    placeholder="أضف كلمة دلالية واضغط Enter..."
                  />
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
                    {editingLink ? 'تحديث' : 'إضافة'}
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