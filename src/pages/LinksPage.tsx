import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Link, Group } from '../types';
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
  LinkIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { TagInput } from '../components/TagInput';
import { aiService } from '../services/ai';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface LinksPageProps {
  onNavigate?: (page: string) => void;
}

export function LinksPage({ onNavigate }: LinksPageProps = {}) {
  const { state, addLink, updateLink, deleteLink, recordClick, addCategory, addSubcategory, addGroup, exportData, importData, toggleGroupVisibility, toggleGroupsSection } = useApp();
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

  // استخراج اسم الموقع من الرابط
  const extractDomainName = (url: string): string => {
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      
      // إزالة www. من البداية
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      
      // إزالة النطاقات الشائعة من النهاية
      const commonTlds = [
        'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'co', 'io', 'me', 'us', 'uk', 'ca', 'au', 
        'de', 'fr', 'es', 'it', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'hu', 
        'ro', 'bg', 'hr', 'si', 'sk', 'lt', 'lv', 'ee', 'lu', 'mt', 'cy', 'ie', 'pt', 'gr', 'tr', 
        'ru', 'ua', 'by', 'md', 'ge', 'am', 'az', 'kz', 'kg', 'tj', 'tm', 'uz', 'mn', 'cn', 'jp', 
        'kr', 'th', 'vn', 'ph', 'id', 'my', 'sg', 'hk', 'tw', 'in', 'pk', 'bd', 'lk', 'mv', 'np', 
        'bt', 'mm', 'la', 'kh', 'bn', 'tl', 'fj', 'pg', 'sb', 'vu', 'nc', 'pf', 'wf', 'ws', 'to', 
        'tv', 'ki', 'nr', 'pw', 'mh', 'fm', 'mp', 'gu', 'as', 'vi', 'pr', 'do', 'ht', 'jm', 'tt', 
        'bb', 'ag', 'kn', 'lc', 'vc', 'gd', 'dm', 'bs', 'bz', 'gt', 'sv', 'hn', 'ni', 'cr', 'pa', 'cu', 'mx'
      ];
      
      // إزالة النطاقات الشائعة
      for (const tld of commonTlds) {
        if (domain.endsWith(`.${tld}`)) {
          domain = domain.slice(0, -(tld.length + 1));
          break;
        }
      }
      
      return domain;
    } catch {
      return '';
    }
  };

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

  // تصفية الروابط مع التمييز
  const filteredLinks = useMemo(() => {
    return state.links.map(link => {
      const matchesSearch = searchTerm === '' || 
        link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.description && link.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  const handleOpenGroupLinks = async (group: Group) => {
    const validLinks = group.linkIds
      .map((id: string) => state.links.find((link: Link) => link.id === id))
      .filter((link: Link | undefined): link is Link => link !== undefined);

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
      validLinks.forEach((link: Link, index: number) => {
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
        inputOptions: validLinks.reduce((acc: Record<string, string>, link: Link) => {
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
        const selectedLink = validLinks.find((link: Link) => link.id === selectedLinkId);
        if (selectedLink) {
          recordClick(selectedLink.id);
          window.open(selectedLink.url, '_blank', 'noopener,noreferrer');
          toast.success('تم فتح الرابط');
        }
      }
    }
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
        tags: [...new Set([...prev.tags, ...suggestion.tags])],
        icon: suggestion.icon || prev.icon
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
        html: `
          <div class="text-right space-y-4">
            <div class="relative">
              <input type="text" id="linkSearch" placeholder="البحث في الروابط..." 
                     class="w-full p-3 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <div class="absolute left-3 top-3 text-gray-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-2">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-gray-700">الروابط المتاحة</span>
                <span id="selectedCount" class="text-sm text-blue-600 font-medium">0 محدد</span>
              </div>
              <div id="linkList" class="max-h-60 overflow-y-auto space-y-1">
                ${state.links.map(link => `
                  <label class="flex items-center p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-200">
                    <input type="checkbox" value="${link.id}" class="ml-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                    <div class="flex-1">
                      <div class="font-medium text-gray-900">${link.name}</div>
                      <div class="text-xs text-gray-500">${link.url}</div>
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'إضافة',
        cancelButtonText: 'إلغاء',
        didOpen: () => {
          const searchInput = document.getElementById('linkSearch') as HTMLInputElement;
          const linkList = document.getElementById('linkList');
          const selectedCount = document.getElementById('selectedCount');
          
          if (searchInput && linkList) {
            searchInput.addEventListener('input', (e) => {
              const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
              const labels = linkList.querySelectorAll('label');
              
              labels.forEach(label => {
                const text = label.textContent?.toLowerCase() || '';
                if (text.includes(searchTerm)) {
                  label.style.display = 'flex';
                } else {
                  label.style.display = 'none';
                }
              });
            });
          }

          // تحديث عداد الروابط المحددة
          if (linkList && selectedCount) {
            const updateCount = () => {
              const checkedBoxes = linkList.querySelectorAll('input[type="checkbox"]:checked');
              selectedCount.textContent = `${checkedBoxes.length} محدد`;
            };

            linkList.addEventListener('change', updateCount);
            updateCount();
          }
        },
        preConfirm: () => {
          const checkboxes = document.querySelectorAll('#linkList input[type="checkbox"]:checked');
          return Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value);
        }
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
    
    // تنظيف مصطلح البحث من الرموز الخاصة
    const cleanSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${cleanSearchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-300 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-1.5 py-0.5 rounded-md font-semibold shadow-sm border border-yellow-400 dark:border-yellow-500">
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
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={() => setShowMultiLinkForm(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-xl flex items-center hover:bg-green-700 transition-all duration-200 font-tajawal shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-5 w-5 ml-2" />
              إضافة روابط متعددة
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center hover:bg-blue-700 transition-all duration-200 font-tajawal shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <PlusIcon className="h-5 w-5 ml-2" />
              إضافة رابط
            </button>
            <button
              onClick={handleAddGroup}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl flex items-center hover:bg-purple-700 transition-all duration-200 font-tajawal shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <TagIcon className="h-5 w-5 ml-2" />
              إضافة مجموعة
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

      {/* زر إظهار قسم المجموعات عندما يكون مخفياً */}
      {state.groups.length > 0 && state.groupsSectionHidden && (
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <TagIcon className="h-5 w-5 text-purple-600 ml-2" />
              <span className="text-sm text-gray-500 dark:text-gray-400 font-tajawal">
                قسم المجموعات مخفي ({state.groups.length} مجموعة)
              </span>
            </div>
            <button
              onClick={toggleGroupsSection}
              className="flex items-center px-3 py-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <EyeIcon className="h-4 w-4 ml-1" />
              إظهار المجموعات
            </button>
          </div>
        </div>
      )}

      {/* قائمة المجموعات */}
      {state.groups.length > 0 && !state.groupsSectionHidden && (
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white font-cairo">المجموعات</h2>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-tajawal">
                {state.groups.filter(g => !g.hidden).length} من {state.groups.length} مرئية
              </span>
              <button
                onClick={toggleGroupsSection}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                title={state.groupsSectionHidden ? 'إظهار قسم المجموعات' : 'إخفاء قسم المجموعات'}
              >
                {state.groupsSectionHidden ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {state.groups.map(group => {
              const groupLinks = group.linkIds
                .map((id: string) => state.links.find((link: Link) => link.id === id))
                .filter((link: Link | undefined): link is Link => link !== undefined);
              
              return (
                <div key={group.id} className={`bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700 hover:shadow-md transition-shadow cursor-pointer ${group.hidden ? 'opacity-50' : ''}`} onClick={() => handleOpenGroupLinks(group)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <TagIcon className="h-5 w-5 text-purple-600 ml-2" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-tajawal">
                        {group.name}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroupVisibility(group.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title={group.hidden ? 'إظهار المجموعة' : 'إخفاء المجموعة'}
                    >
                      {group.hidden ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-tajawal">
                    {groupLinks.length} رابط
                  </p>
                  <div className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-tajawal">
                    {group.hidden ? 'مخفية' : 'اضغط لفتح جميع الروابط'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* قائمة الروابط */}
      <div className="flex-1 overflow-y-auto p-4 w-full">
        {filteredLinks.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-tajawal">
                💡 اضغط على أي كارد لفتح الرابط في صفحة جديدة
              </p>
              {searchTerm && (
                <div className="flex items-center text-xs text-yellow-700 dark:text-yellow-300 font-tajawal">
                  <span className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded-full">
                    {filteredLinks.filter(link => link.isHighlighted).length} نتيجة مطابقة
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 w-full">
          {paginatedLinks.map(link => (
            <div 
              key={link.id} 
              className={`rounded-lg shadow p-6 border transition-all duration-300 cursor-pointer hover:scale-105 transform group ${
                link.isHighlighted 
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-500 shadow-yellow-200 dark:shadow-yellow-800 hover:shadow-yellow-300 dark:hover:shadow-yellow-700' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600'
              }`}
              onClick={() => {
                recordClick(link.id);
                window.open(link.url, '_blank', 'noopener,noreferrer');
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center flex-1 min-w-0">
                  <img 
                    src={link.icon || 'https://cdn-icons-png.flaticon.com/128/6928/6928929.png'} 
                    alt={link.name}
                    className="w-10 h-10 rounded-lg ml-3 object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/128/6928/6928929.png';
                    }}
                  />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-tajawal line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1 min-w-0">
                    {link.isHighlighted ? highlightText(link.name, searchTerm) : link.name}
                  </h3>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 font-tajawal flex-shrink-0">
                  <ChartBarIcon className="h-4 w-4 ml-1" />
                  {link.clicks}
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-xs mb-3 font-tajawal line-clamp-2">
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
                      className={`px-2 py-1 rounded text-xs font-tajawal transition-all duration-200 ${
                        link.isHighlighted && tag.toLowerCase().includes(searchTerm.toLowerCase())
                          ? 'bg-yellow-300 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 font-semibold shadow-sm border border-yellow-400 dark:border-yellow-500'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
                      }`}
                    >
                      {link.isHighlighted ? highlightText(tag, searchTerm) : tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-1 space-x-reverse">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenLink(link);
                    }}
                    className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-md transition-colors"
                    title="فتح الرابط"
                  >
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink(link.url);
                    }}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    title="نسخ الرابط"
                  >
                    <ClipboardIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex space-x-1 space-x-reverse">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(link);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md transition-colors"
                    title="تعديل"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(link);
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-md transition-colors"
                    title="حذف"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
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
              setShowForm(true);
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <LinkIcon className="h-4 w-4 ml-3 text-blue-600" />
            <div>
              <div className="font-medium">إضافة رابط</div>
              <div className="text-xs text-gray-500">إضافة رابط جديد</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              setShowMultiLinkForm(true);
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <PlusIcon className="h-4 w-4 ml-3 text-green-600" />
            <div>
              <div className="font-medium">إضافة روابط متعددة</div>
              <div className="text-xs text-gray-500">إضافة عدة روابط مرة واحدة</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              handleAddCategory();
              setShowContextMenu(false);
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
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <FolderPlusIcon className="h-4 w-4 ml-3 text-orange-600" />
            <div>
              <div className="font-medium">إضافة قسم فرعي</div>
              <div className="text-xs text-gray-500">إضافة أقسام فرعية</div>
            </div>
          </button>
          
          <button
            onClick={() => {
              handleAddGroup();
              setShowContextMenu(false);
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900 w-full text-right transition-colors rounded-lg mx-2 my-1"
          >
            <TagIcon className="h-4 w-4 ml-3 text-indigo-600" />
            <div>
              <div className="font-medium">إضافة مجموعة</div>
              <div className="text-xs text-gray-500">إنشاء مجموعة روابط</div>
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
                      رابط الأيقونة
                    </label>
                    <a
                      href={`https://www.flaticon.com/search?word=${encodeURIComponent(extractDomainName(formData.url) || 'icon')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-tajawal flex items-center"
                      title={formData.url ? `البحث عن أيقونات لـ: ${extractDomainName(formData.url) || 'icon'}` : 'البحث عن أيقونات عامة'}
                    >
                      <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                      {formData.url ? `Flaticon (${extractDomainName(formData.url) || 'icon'})` : 'Flaticon للمساعدة'}
                    </a>
                  </div>
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
                      {isLoadingAI ? 'جاري الحصول على الاقتراحات...' : 'اقتراح ذكي للاسم والوصف والأيقونة'}
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