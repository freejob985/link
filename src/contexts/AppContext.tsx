import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Link, Category, Subcategory, Group, ClickRecord, AppData, Theme } from '../types';
import { storageService } from '../services/storage';
import { excelService, ExcelImportResult } from '../services/excel';
import toast from 'react-hot-toast';

interface AppState extends AppData {
  theme: Theme;
  showSplash: boolean;
  sidebarCollapsed: boolean;
  groupsSectionHidden: boolean; // إخفاء قسم المجموعات بالكامل
  linksSectionHidden: boolean; // إخفاء قسم إدارة الروابط بالكامل
}

type AppAction = 
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_SPLASH'; payload: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_GROUPS_SECTION' }
  | { type: 'TOGGLE_LINKS_SECTION' }
  | { type: 'SET_DATA'; payload: AppData }
  | { type: 'ADD_LINK'; payload: Link }
  | { type: 'UPDATE_LINK'; payload: Link }
  | { type: 'DELETE_LINK'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_SUBCATEGORY'; payload: Subcategory }
  | { type: 'UPDATE_SUBCATEGORY'; payload: Subcategory }
  | { type: 'DELETE_SUBCATEGORY'; payload: string }
  | { type: 'ADD_GROUP'; payload: Group }
  | { type: 'UPDATE_GROUP'; payload: Group }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'TOGGLE_GROUP_VISIBILITY'; payload: string }
  | { type: 'ADD_CLICK'; payload: ClickRecord };

const initialState: AppState = {
  theme: 'light',
  showSplash: true,
  sidebarCollapsed: true,
  groupsSectionHidden: false,
  linksSectionHidden: false,
  links: [],
  categories: [],
  subcategories: [],
  groups: [],
  clickRecords: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_SPLASH':
      return { ...state, showSplash: action.payload };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'TOGGLE_GROUPS_SECTION':
      return { ...state, groupsSectionHidden: !state.groupsSectionHidden };
    case 'TOGGLE_LINKS_SECTION':
      return { ...state, linksSectionHidden: !state.linksSectionHidden };
    case 'SET_DATA':
      return { ...state, ...action.payload };
    case 'ADD_LINK':
      return { ...state, links: [...state.links, action.payload] };
    case 'UPDATE_LINK':
      return {
        ...state,
        links: state.links.map(link => 
          link.id === action.payload.id ? action.payload : link
        )
      };
    case 'DELETE_LINK':
      return {
        ...state,
        links: state.links.filter(link => link.id !== action.payload),
        groups: state.groups.map(group => ({
          ...group,
          linkIds: group.linkIds.filter(id => id !== action.payload)
        }))
      };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat => 
          cat.id === action.payload.id ? action.payload : cat
        )
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(cat => cat.id !== action.payload),
        subcategories: state.subcategories.filter(sub => sub.categoryId !== action.payload),
        links: state.links.map(link => 
          link.categoryId === action.payload 
            ? { ...link, categoryId: '', subcategoryId: undefined }
            : link
        )
      };
    case 'ADD_SUBCATEGORY':
      return { ...state, subcategories: [...state.subcategories, action.payload] };
    case 'UPDATE_SUBCATEGORY':
      return {
        ...state,
        subcategories: state.subcategories.map(sub => 
          sub.id === action.payload.id ? action.payload : sub
        )
      };
    case 'DELETE_SUBCATEGORY':
      return {
        ...state,
        subcategories: state.subcategories.filter(sub => sub.id !== action.payload),
        links: state.links.map(link => 
          link.subcategoryId === action.payload 
            ? { ...link, subcategoryId: undefined }
            : link
        )
      };
    case 'ADD_GROUP':
      return { ...state, groups: [...state.groups, action.payload] };
    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map(group => 
          group.id === action.payload.id ? action.payload : group
        )
      };
    case 'DELETE_GROUP':
      return {
        ...state,
        groups: state.groups.filter(group => group.id !== action.payload)
      };
    case 'ADD_CLICK':
      return {
        ...state,
        clickRecords: [...state.clickRecords, action.payload],
        links: state.links.map(link =>
          link.id === action.payload.linkId
            ? { ...link, clicks: link.clicks + 1 }
            : link
        )
      };
    case 'TOGGLE_GROUP_VISIBILITY':
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === action.payload
            ? { ...group, hidden: !group.hidden }
            : group
        )
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addLink: (link: Omit<Link, 'id' | 'clicks' | 'createdAt' | 'updatedAt'>) => void;
  updateLink: (link: Link) => void;
  deleteLink: (id: string) => void;
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (name: string, categoryId: string) => void;
  updateSubcategory: (id: string, name: string) => void;
  deleteSubcategory: (id: string) => void;
  addGroup: (name: string, linkIds: string[]) => void;
  updateGroup: (id: string, name: string, linkIds: string[]) => void;
  deleteGroup: (id: string) => void;
  toggleGroupVisibility: (id: string) => void;
  recordClick: (linkId: string) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  toggleGroupsSection: () => void;
  toggleLinksSection: () => void;
  hideSplash: () => void;
  exportData: () => void;
  importData: (data: AppData) => void;
  clearAllData: () => void;
  downloadExcelTemplate: () => void;
  importFromExcel: (file: File) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // تحميل البيانات عند بدء التطبيق
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await storageService.loadData();
        dispatch({ type: 'SET_DATA', payload: data });
        
        const theme = localStorage.getItem('theme') as Theme || 'light';
        dispatch({ type: 'SET_THEME', payload: theme });
        
        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (sidebarCollapsed) {
          dispatch({ type: 'TOGGLE_SIDEBAR' });
        }
        
        const linksSectionHidden = localStorage.getItem('linksSectionHidden') === 'true';
        if (linksSectionHidden) {
          dispatch({ type: 'TOGGLE_LINKS_SECTION' });
        }
        
        const hasSeenSplash = localStorage.getItem('hasSeenSplash') === 'true';
        dispatch({ type: 'SET_SPLASH', payload: !hasSeenSplash });
      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        toast.error('فشل في تحميل البيانات');
      }
    };

    loadData();
  }, []);

  // حفظ البيانات عند تغييرها
  useEffect(() => {
    if (state.links.length > 0 || state.categories.length > 0) {
      storageService.saveData({
        links: state.links,
        categories: state.categories,
        subcategories: state.subcategories,
        groups: state.groups,
        clickRecords: state.clickRecords
      });
    }
  }, [state.links, state.categories, state.subcategories, state.groups, state.clickRecords]);

  // تطبيق الثيم
  useEffect(() => {
    document.documentElement.className = state.theme;
    localStorage.setItem('theme', state.theme);
  }, [state.theme]);

  // حفظ حالة الشريط الجانبي
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed.toString());
  }, [state.sidebarCollapsed]);

  // حفظ حالة قسم إدارة الروابط
  useEffect(() => {
    localStorage.setItem('linksSectionHidden', state.linksSectionHidden.toString());
  }, [state.linksSectionHidden]);
  const addLink = (linkData: Omit<Link, 'id' | 'clicks' | 'createdAt' | 'updatedAt'>) => {
    const link: Link = {
      ...linkData,
      id: Date.now().toString(),
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_LINK', payload: link });
    toast.success('تم إضافة الرابط بنجاح');
  };

  const updateLink = (link: Link) => {
    const updatedLink = { ...link, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_LINK', payload: updatedLink });
    toast.success('تم تحديث الرابط بنجاح');
  };

  const deleteLink = (id: string) => {
    dispatch({ type: 'DELETE_LINK', payload: id });
    toast.success('تم حذف الرابط بنجاح');
  };

  const addCategory = (name: string) => {
    const category: Category = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_CATEGORY', payload: category });
    toast.success('تم إضافة القسم بنجاح');
  };

  const updateCategory = (id: string, name: string) => {
    const category = state.categories.find(c => c.id === id);
    if (category) {
      dispatch({ type: 'UPDATE_CATEGORY', payload: { ...category, name } });
      toast.success('تم تحديث القسم بنجاح');
    }
  };

  const deleteCategory = (id: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
    toast.success('تم حذف القسم بنجاح');
  };

  const addSubcategory = (name: string, categoryId: string) => {
    const subcategory: Subcategory = {
      id: Date.now().toString(),
      name,
      categoryId,
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_SUBCATEGORY', payload: subcategory });
    toast.success('تم إضافة القسم الفرعي بنجاح');
  };

  const updateSubcategory = (id: string, name: string) => {
    const subcategory = state.subcategories.find(s => s.id === id);
    if (subcategory) {
      dispatch({ type: 'UPDATE_SUBCATEGORY', payload: { ...subcategory, name } });
      toast.success('تم تحديث القسم الفرعي بنجاح');
    }
  };

  const deleteSubcategory = (id: string) => {
    dispatch({ type: 'DELETE_SUBCATEGORY', payload: id });
    toast.success('تم حذف القسم الفرعي بنجاح');
  };

  const addGroup = (name: string, linkIds: string[]) => {
    const group: Group = {
      id: Date.now().toString(),
      name,
      linkIds,
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_GROUP', payload: group });
    toast.success('تم إضافة المجموعة بنجاح');
  };

  const updateGroup = (id: string, name: string, linkIds: string[]) => {
    const group = state.groups.find(g => g.id === id);
    if (group) {
      dispatch({ type: 'UPDATE_GROUP', payload: { ...group, name, linkIds } });
      toast.success('تم تحديث المجموعة بنجاح');
    }
  };

  const deleteGroup = (id: string) => {
    dispatch({ type: 'DELETE_GROUP', payload: id });
    toast.success('تم حذف المجموعة بنجاح');
  };

  const recordClick = (linkId: string) => {
    const clickRecord: ClickRecord = {
      id: Date.now().toString(),
      linkId,
      clickedAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_CLICK', payload: clickRecord });
  };

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
  };

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };
  const hideSplash = () => {
    dispatch({ type: 'SET_SPLASH', payload: false });
    localStorage.setItem('hasSeenSplash', 'true');
  };

  const exportData = () => {
    const data = {
      links: state.links,
      categories: state.categories,
      subcategories: state.subcategories,
      groups: state.groups,
      clickRecords: state.clickRecords,
      sidebarCollapsed: state.sidebarCollapsed,
      groupsSectionHidden: state.groupsSectionHidden,
      linksSectionHidden: state.linksSectionHidden
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `links-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('تم تصدير البيانات بنجاح');
  };

  const importData = (data: AppData) => {
    dispatch({ type: 'SET_DATA', payload: data });
    
    // حفظ إعدادات الواجهة
    if (data.sidebarCollapsed !== undefined) {
      localStorage.setItem('sidebarCollapsed', data.sidebarCollapsed.toString());
    }
    if (data.groupsSectionHidden !== undefined) {
      localStorage.setItem('groupsSectionHidden', data.groupsSectionHidden.toString());
    }
    if (data.linksSectionHidden !== undefined) {
      localStorage.setItem('linksSectionHidden', data.linksSectionHidden.toString());
    }
    
    toast.success('تم استيراد البيانات بنجاح');
  };

  const clearAllData = () => {
    // مسح جميع البيانات من localStorage
    localStorage.clear();
    
    // مسح البيانات من الحالة
    dispatch({ type: 'SET_DATA', payload: {
      links: [],
      categories: [],
      subcategories: [],
      groups: [],
      clickRecords: [],
      sidebarCollapsed: false,
      groupsSectionHidden: false,
      linksSectionHidden: false
    }});
    
    toast.success('تم مسح جميع البيانات بنجاح');
  };

  const toggleGroupVisibility = (id: string) => {
    dispatch({ type: 'TOGGLE_GROUP_VISIBILITY', payload: id });
  };

  const toggleGroupsSection = () => {
    dispatch({ type: 'TOGGLE_GROUPS_SECTION' });
  };

  const toggleLinksSection = () => {
    dispatch({ type: 'TOGGLE_LINKS_SECTION' });
  };

  const downloadExcelTemplate = () => {
    try {
      excelService.generateTemplate();
      toast.success('تم تحميل قالب Excel بنجاح');
    } catch (error) {
      console.error('خطأ في تحميل القالب:', error);
      toast.error('فشل في تحميل قالب Excel');
    }
  };

  const importFromExcel = async (file: File) => {
    try {
      const result: ExcelImportResult = await excelService.parseExcelFile(file);
      
      if (result.errors.length > 0) {
        // عرض الأخطاء للمستخدم
        const errorMessage = result.errors.slice(0, 5).join('\n') + 
          (result.errors.length > 5 ? `\n... و ${result.errors.length - 5} خطأ آخر` : '');
        toast.error(`تم العثور على أخطاء:\n${errorMessage}`, { duration: 8000 });
      }

      // إضافة الأقسام الجديدة
      const existingCategoryNames = new Set(state.categories.map(c => c.name));
      const newCategories = result.categories.filter(cat => !existingCategoryNames.has(cat.name));
      
      newCategories.forEach(category => {
        dispatch({ type: 'ADD_CATEGORY', payload: category });
      });

      // إضافة الأقسام الفرعية الجديدة
      const existingSubcategoryKeys = new Set(
        state.subcategories.map(s => `${s.categoryId}_${s.name}`)
      );
      const newSubcategories = result.subcategories.filter(sub => 
        !existingSubcategoryKeys.has(`${sub.categoryId}_${sub.name}`)
      );
      
      newSubcategories.forEach(subcategory => {
        dispatch({ type: 'ADD_SUBCATEGORY', payload: subcategory });
      });

      // ربط الأقسام الفرعية بالأقسام الصحيحة
      const categoryMap = new Map<string, string>();
      [...state.categories, ...newCategories].forEach(cat => {
        categoryMap.set(cat.name, cat.id);
      });

      const processedLinks = result.links.map(link => {
        // تحديث categoryId إذا لزم الأمر
        const correctCategoryId = categoryMap.get(
          [...state.categories, ...newCategories].find(c => c.id === link.categoryId)?.name || ''
        ) || link.categoryId;

        // تحديث subcategoryId إذا لزم الأمر
        let correctSubcategoryId = link.subcategoryId;
        if (link.subcategoryId) {
          const subcategory = [...state.subcategories, ...newSubcategories].find(s => s.id === link.subcategoryId);
          if (subcategory) {
            const correctSub = [...state.subcategories, ...newSubcategories].find(s => 
              s.name === subcategory.name && s.categoryId === correctCategoryId
            );
            correctSubcategoryId = correctSub?.id;
          }
        }

        return {
          ...link,
          categoryId: correctCategoryId,
          subcategoryId: correctSubcategoryId
        };
      });

      // إضافة الروابط الجديدة
      const existingUrls = new Set(state.links.map(l => l.url));
      const newLinks = processedLinks.filter(link => !existingUrls.has(link.url));
      
      newLinks.forEach(link => {
        dispatch({ type: 'ADD_LINK', payload: link });
      });

      const successMessage = `تم استيراد ${newLinks.length} رابط جديد و ${newCategories.length} قسم جديد و ${newSubcategories.length} قسم فرعي جديد`;
      toast.success(successMessage);

    } catch (error) {
      console.error('خطأ في استيراد Excel:', error);
      toast.error('فشل في استيراد ملف Excel: ' + (error as Error).message);
    }
  };

  const value: AppContextValue = {
    state,
    dispatch,
    addLink,
    updateLink,
    deleteLink,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addGroup,
    updateGroup,
    deleteGroup,
    toggleGroupVisibility,
    recordClick,
    toggleTheme,
    toggleSidebar,
    toggleGroupsSection,
    toggleLinksSection,
    hideSplash,
    exportData,
    importData,
    clearAllData,
    downloadExcelTemplate,
    importFromExcel
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}