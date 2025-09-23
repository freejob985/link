import { AppData } from '../types';

class StorageService {
  private readonly STORAGE_KEY = 'linksManagerData';

  async saveData(data: AppData): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      throw new Error('فشل في حفظ البيانات');
    }
  }

  async loadData(): Promise<AppData> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // إرجاع البيانات الأولية مع أمثلة
      return this.getInitialData();
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      return this.getInitialData();
    }
  }

  private getInitialData(): AppData {
    const now = new Date().toISOString();
    
    const categories = [
      { id: '1', name: 'التصميم', createdAt: now },
      { id: '2', name: 'البرمجة', createdAt: now },
      { id: '3', name: 'التسويق', createdAt: now }
    ];

    const subcategories = [
      { id: '1', name: 'UI/UX', categoryId: '1', createdAt: now },
      { id: '2', name: 'جرافيك', categoryId: '1', createdAt: now },
      { id: '3', name: 'ويب', categoryId: '2', createdAt: now },
      { id: '4', name: 'موبايل', categoryId: '2', createdAt: now },
      { id: '5', name: 'شبكات اجتماعية', categoryId: '3', createdAt: now },
      { id: '6', name: 'سيو', categoryId: '3', createdAt: now }
    ];

    const links = [
      {
        id: '1',
        name: 'Figma',
        url: 'https://figma.com',
        description: 'أداة التصميم الجماعي الأكثر شهرة',
        categoryId: '1',
        subcategoryId: '1',
        tags: ['تصميم', 'UI', 'تعاون'],
        clicks: 25,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        name: 'GitHub',
        url: 'https://github.com',
        description: 'منصة استضافة الكود المصدري',
        categoryId: '2',
        subcategoryId: '3',
        tags: ['git', 'كود', 'تعاون'],
        clicks: 18,
        createdAt: now,
        updatedAt: now
      },
      {
        id: '3',
        name: 'Canva',
        url: 'https://canva.com',
        description: 'أداة تصميم بسيطة وسهلة',
        categoryId: '1',
        subcategoryId: '2',
        tags: ['تصميم', 'قوالب', 'سهل'],
        clicks: 32,
        createdAt: now,
        updatedAt: now
      }
    ];

    const groups = [
      {
        id: '1',
        name: 'أدوات التصميم',
        linkIds: ['1', '3'],
        createdAt: now
      },
      {
        id: '2',
        name: 'البرمجة الأساسية',
        linkIds: ['2'],
        createdAt: now
      }
    ];

    return {
      links,
      categories,
      subcategories,
      groups,
      clickRecords: []
    };
  }

  async clearData(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const storageService = new StorageService();