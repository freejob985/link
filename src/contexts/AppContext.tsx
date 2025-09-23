import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Link, Category, Subcategory, Group, ClickRecord, AppData, Theme } from '../types';
import { storageService } from '../services/storage';
import toast from 'react-hot-toast';

interface AppState extends AppData {
  theme: Theme;
  showSplash: boolean;
  sidebarCollapsed: boolean;
  groupsSectionHidden: boolean; // إخفاء قسم المجموعات بالكامل
}

type AppAction = 
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_SPLASH'; payload: boolean }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_GROUPS_SECTION' }
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
  sidebarCollapsed: false,
  groupsSectionHidden: false,
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
  hideSplash: () => void;
  exportData: () => void;
  importData: (data: AppData) => void;
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
      clickRecords: state.clickRecords
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
    toast.success('تم استيراد البيانات بنجاح');
  };

  const toggleGroupVisibility = (id: string) => {
    dispatch({ type: 'TOGGLE_GROUP_VISIBILITY', payload: id });
  };

  const toggleGroupsSection = () => {
    dispatch({ type: 'TOGGLE_GROUPS_SECTION' });
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
    hideSplash,
    exportData,
    importData
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