import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronRightIcon,
  FolderPlusIcon,
  TagIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { TagInput } from '../components/TagInput';
import { aiService } from '../services/ai';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export function LinksPage() {
  const { state, addLink, updateLink, deleteLink, recordClick, addCategory, addSubcategory, addGroup } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showMultiLinkForm, setShowMultiLinkForm] = useState(false);
  const [multiLinks, setMultiLinks] = useState<Array<{name: string, url: string}>>([{name: '', url: ''}]);
  const linksPerPage = 16;

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    tags: [] as string[],
    icon: ''
  });

  // إخفاء شارة Bolt مع ID وفحص دوري
  useEffect(() => {
    const hideBoltBadge = () => {
      const boltBadge = document.querySelector('div[style*="position: fixed"][style*="bottom: 1rem"][style*="right: 1rem"]');
      if (boltBadge) {
        (boltBadge as HTMLElement).style.display = 'none';
        (boltBadge as HTMLElement).id = 'bolt-badge-hidden';
      }
    };

    hideBoltBadge();
    const interval = setInterval(hideBoltBadge, 1000);
    return () => clearInterval(interval);
  }, []);

  // تصفية الروابط مع التمييز
  const filteredLinks = useMemo(() => {
    return state.links.map(link => {
      const matchesSearch = searchTerm === '' || 
        link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === '' || link.categoryId === selectedCategory;
      const matchesSubcategory = selectedSubcategory === '' || link.subcategoryId === selectedSubcategory;
      const matchesTag = selectedTag === '' || link.tags.includes(selectedTag);

      const isVisible = matchesSearch && matchesCategory && matchesSubcategory && matchesTag;
      
      return {
        ...link,
        isHighlighted: matchesSearch && searchTerm !== '',
        isVisible
      };
    }).filter(link => link.isVisible);
  }, [state.links, searchTerm, selectedCategory, selectedSubcategory, selectedTag]);

  // تقسيم الروابط إلى صفحات
  const totalPages = Math.ceil(filteredLinks.length / linksPerPage);
  const paginatedLinks = useMemo(() => {
    const startIndex = (currentPage - 1) * linksPerPage;
    return filteredLinks.slice(startIndex, startIndex + linksPerPage);
  }, [filteredLinks, currentPage, linksPerPage]);

  // إعادة تعيين الصفحة عند تغيير التصفية
  useEffect(() => {
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
      tags: [],
      icon: ''
    });
    setEditingLink(null);
    setShowForm(false);
  };

  const resetMultiForm = () => {
    setMultiLinks([{name: '', url: ''}]);
    setShowMultiLinkForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

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

  const handleMultiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validLinks = multiLinks.filter(link => link.name.trim() && link.url.trim());
    
    if (validLinks.length === 0) {
      toast.error('يرجى إدخال رابط واحد على الأقل');
      return;
    }

    validLinks.forEach(link => {
      try {
        new URL(link.url);
        addLink({
          name: link.name,
          url: link.url,
          description: '',
          categoryId: formData.categoryId,
          subcategoryId: formData.subcategoryId || undefined,
          tags: formData.tags
        });
      } catch {
        toast.error(`رابط غير صحيح: ${link.url}`);
      }
    });

    resetMultiForm();
    toast.success(`تم إضافة ${validLinks.length} رابط بنجاح`);
  };

  const handleEdit = (link: Link) => {
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description,
      categoryId: link.categoryId,
      subcategoryId: link.subcategoryId || '',
      tags: [...link.tags],
      icon: link.icon || ''
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
        name: suggestion.name || prev.name,
        description: suggestion.description || prev.description,
        tags: [...new Set([...prev.tags, ...suggestion.tags])]
      }));
      
      toast.success('تم الحصول على الاقتراحات');
    } catch (error: unknown) {
      toast.error((error as Error).message || 'فشل في الحصول على الاقتراحات');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleAddCategory = async () => {
    const { value: name } = await Swal.fire({
      title: 'إضافة قسم جديد',
      input: 'text',
      inputLabel: 'اسم القسم',
      inputPlaceholder: 'أدخل اسم القسم',
      showCancelButton: true,
      confirmButtonText: 'إضافة',
      cancelButtonText: 'إلغاء',
      inputValidator: (value) => {
        if (!value) {
          return 'يرجى إدخال اسم القسم';
        }
      }
    });

    if (name) {
      addCategory(name);
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
      const { value: name } = await Swal.fire({
        title: 'إضافة قسم فرعي',
        input: 'text',
        inputLabel: 'اسم القسم الفرعي',
        inputPlaceholder: 'أدخل اسم القسم الفرعي',
        showCancelButton: true,
        confirmButtonText: 'إضافة',
        cancelButtonText: 'إلغاء',
        inputValidator: (value) => {
          if (!value) {
            return 'يرجى إدخال اسم القسم الفرعي';
          }
        }
      });

      if (name) {
        addSubcategory(name, categoryId);
      }
    }
  };

  const handleAddGroup = async () => {
    if (state.links.length === 0) {
      toast.error('يرجى إضافة روابط أولاً');
      return;
    }

    const { value: name } = await Swal.fire({
      title: 'إضافة مجموعة جديدة',
      input: 'text',
      inputLabel: 'اسم المجموعة',
      inputPlaceholder: 'أدخل اسم المجموعة',
      showCancelButton: true,
      confirmButtonText: 'متابعة',
      cancelButtonText: 'إلغاء',
      inputValidator: (value) => {
        if (!value) {
          return 'يرجى إدخال اسم المجموعة';
        }
      }
    });

    if (name) {
      const { value: linkIds } = await Swal.fire({
        title: 'اختر الروابط',
        input: 'checkbox',
        inputOptions: state.links.reduce((acc, link) => {
          acc[link.id] = link.name;
          return acc;
        }, {} as Record<string, string>),
        showCancelButton: true,
        confirmButtonText: 'إضافة',
        cancelButtonText: 'إلغاء'
      });

      if (linkIds && linkIds.length > 0) {
        addGroup(name, linkIds);
      }
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

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const addMultiLink = () => {
    setMultiLinks([...multiLinks, {name: '', url: ''}]);
  };

  const removeMultiLink = (index: number) => {
    if (multiLinks.length > 1) {
      setMultiLinks(multiLinks.filter((_, i) => i !== index));
    }
  };

  const updateMultiLink = (index: number, field: 'name' | 'url', value: string) => {
    setMultiLinks(multiLinks.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 w-full" onContextMenu={handleContextMenu}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-cairo">
            إدارة الروابط
          </h1>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={() => setShowMultiLinkForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors font-tajawal"
            >
              <PlusIcon className="h-5 w-5 ml-2" />
              إضافة روابط متعددة
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors font-tajawal"
            >
              <PlusIcon className="h-5 w-5 ml-2" />
              إضافة رابط
            </button>
          </div>
        </div>
      </div>

      {/* البحث والتصفية */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-4">
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
      <div className="flex-1 overflow-y-auto p-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
          {paginatedLinks.map(link => (
            <div key={link.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <img 
                    src={link.icon || 'https://cdn-icons-png.flaticon.com/128/6928/6928929.png'} 
                    alt={link.name}
                    className="w-8 h-8 rounded-lg ml-3 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/128/6928/6928929.png';
                    }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-tajawal">
                    {link.isHighlighted ? highlightText(link.name, searchTerm) : link.name}
                  </h3>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 font-tajawal">
                  <ChartBarIcon className="h-4 w-4 ml-1" />
                  {link.clicks}
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 font-tajawal">
                {link.isHighlighted ? highlightText(link.description || 'لا يوجد وصف', searchTerm) : (link.description || 'لا يوجد وصف')}
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
                      className={`px-2 py-1 rounded text-xs font-tajawal ${
                        link.isHighlighted && tag.toLowerCase().includes(searchTerm.toLowerCase())
                          ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}
                    >
                      {link.isHighlighted ? highlightText(tag, searchTerm) : tag}
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
          <div className="flex justify-center items-center space-x-4 space-x-reverse mt-8">
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
      </div>

      {/* قائمة السياق */}
      {showContextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
        >
          <button
            onClick={() => {
              setShowForm(true);
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-right"
          >
            <LinkIcon className="h-4 w-4 ml-2" />
            إضافة رابط
          </button>
          <button
            onClick={() => {
              handleAddCategory();
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-right"
          >
            <FolderPlusIcon className="h-4 w-4 ml-2" />
            إضافة قسم
          </button>
          <button
            onClick={() => {
              handleAddSubcategory();
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-right"
          >
            <FolderPlusIcon className="h-4 w-4 ml-2" />
            إضافة قسم فرعي
          </button>
          <button
            onClick={() => {
              handleAddGroup();
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-right"
          >
            <TagIcon className="h-4 w-4 ml-2" />
            إضافة مجموعة
          </button>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                    رابط الأيقونة
                  </label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="url"
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      placeholder="https://example.com/icon.png"
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
                    />
                    {formData.icon && (
                      <img 
                        src={formData.icon} 
                        alt="معاينة الأيقونة"
                        className="w-8 h-8 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/128/6928/6928929.png';
                        }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-tajawal">
                    إذا لم تحدد أيقونة، سيتم استخدام الأيقونة الافتراضية
                  </p>
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
                      {isLoadingAI ? 'جاري الحصول على الاقتراحات...' : 'اقتراح ذكي للاسم والوصف'}
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

      {/* نموذج إضافة روابط متعددة */}
      {showMultiLinkForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-cairo">
                  إضافة روابط متعددة
                </h2>
                <button
                  onClick={resetMultiForm}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleMultiSubmit} className="space-y-4">
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

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white font-cairo">
                      الروابط
                    </h3>
                    <button
                      type="button"
                      onClick={addMultiLink}
                      className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition-colors font-tajawal"
                    >
                      إضافة رابط
                    </button>
                  </div>

                  {multiLinks.map((link, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                          اسم الرابط *
                        </label>
                        <input
                          type="text"
                          value={link.name}
                          onChange={(e) => updateMultiLink(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-tajawal">
                          الرابط *
                        </label>
                        <div className="flex">
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateMultiLink(index, 'url', e.target.value)}
                            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-tajawal"
                            required
                          />
                          {multiLinks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMultiLink(index)}
                              className="mr-2 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-md transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={resetMultiForm}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-tajawal"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-tajawal"
                  >
                    إضافة جميع الروابط
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