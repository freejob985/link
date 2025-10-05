import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Link, Category, Subcategory } from '../types';

export interface ExcelRow {
  'اسم الرابط': string;
  'الرابط': string;
  'الوصف': string;
  'القسم': string;
  'القسم الفرعي': string;
  'العلامات (مفصولة بفاصلة)': string;
  'الأيقونة (اختياري)': string;
}

export interface ExcelImportResult {
  links: Link[];
  categories: Category[];
  subcategories: Subcategory[];
  errors: string[];
}

class ExcelService {
  /**
   * إنشاء قالب Excel مع أمثلة
   */
  generateTemplate(): void {
    const templateData: ExcelRow[] = [
      {
        'اسم الرابط': 'Figma',
        'الرابط': 'https://figma.com',
        'الوصف': 'أداة التصميم الجماعي الأكثر شهرة',
        'القسم': 'التصميم',
        'القسم الفرعي': 'UI/UX',
        'العلامات (مفصولة بفاصلة)': 'تصميم,UI,تعاون',
        'الأيقونة (اختياري)': 'https://cdn-icons-png.flaticon.com/128/5968/5968705.png'
      },
      {
        'اسم الرابط': 'GitHub',
        'الرابط': 'https://github.com',
        'الوصف': 'منصة استضافة الكود المصدري',
        'القسم': 'البرمجة',
        'القسم الفرعي': 'ويب',
        'العلامات (مفصولة بفاصلة)': 'git,كود,تعاون',
        'الأيقونة (اختياري)': 'https://cdn-icons-png.flaticon.com/128/733/733609.png'
      },
      {
        'اسم الرابط': 'Canva',
        'الرابط': 'https://canva.com',
        'الوصف': 'أداة تصميم بسيطة وسهلة',
        'القسم': 'التصميم',
        'القسم الفرعي': 'جرافيك',
        'العلامات (مفصولة بفاصلة)': 'تصميم,قوالب,سهل',
        'الأيقونة (اختياري)': 'https://cdn-icons-png.flaticon.com/128/5968/5968705.png'
      },
      {
        'اسم الرابط': 'YouTube',
        'الرابط': 'https://youtube.com',
        'الوصف': 'منصة مشاركة الفيديوهات',
        'القسم': 'التسويق',
        'القسم الفرعي': 'شبكات اجتماعية',
        'العلامات (مفصولة بفاصلة)': 'فيديو,تسويق,تعليم',
        'الأيقونة (اختياري)': 'https://cdn-icons-png.flaticon.com/128/1384/1384060.png'
      }
    ];

    // إنشاء ورقة عمل
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // تخصيص عرض الأعمدة
    const colWidths = [
      { wch: 15 }, // اسم الرابط
      { wch: 30 }, // الرابط
      { wch: 40 }, // الوصف
      { wch: 15 }, // القسم
      { wch: 20 }, // القسم الفرعي
      { wch: 30 }, // العلامات
      { wch: 50 }  // الأيقونة
    ];
    ws['!cols'] = colWidths;

    // إنشاء مصنف
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'روابط');

    // إضافة ورقة تعليمات
    const instructionsData = [
      ['تعليمات استخدام القالب'],
      [''],
      ['1. املأ البيانات في الأعمدة المحددة'],
      ['2. اسم الرابط: اسم الرابط (مطلوب)'],
      ['3. الرابط: رابط الموقع (مطلوب)'],
      ['4. الوصف: وصف مختصر للرابط (اختياري)'],
      ['5. القسم: اسم القسم الرئيسي (مطلوب)'],
      ['6. القسم الفرعي: اسم القسم الفرعي (اختياري)'],
      ['7. العلامات: كلمات مفتاحية مفصولة بفاصلة (اختياري)'],
      ['8. الأيقونة: رابط صورة الأيقونة (اختياري)'],
      [''],
      ['ملاحظات مهمة:'],
      ['- إذا كان القسم غير موجود، سيتم إنشاؤه تلقائياً'],
      ['- إذا كان القسم الفرعي غير موجود، سيتم إنشاؤه تلقائياً'],
      ['- الروابط المكررة لن يتم إضافتها'],
      ['- الأقسام المكررة لن يتم إنشاؤها مرة أخرى']
    ];

    const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsWs['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'تعليمات');

    // تصدير الملف
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `قالب-الروابط-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * قراءة ملف Excel وتحويله إلى بيانات التطبيق
   */
  parseExcelFile(file: File): Promise<ExcelImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // قراءة الورقة الأولى
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];

          const result = this.processExcelData(jsonData);
          resolve(result);
        } catch (error) {
          reject(new Error('خطأ في قراءة ملف Excel: ' + (error as Error).message));
        }
      };

      reader.onerror = () => {
        reject(new Error('خطأ في قراءة الملف'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * معالجة بيانات Excel وتحويلها إلى كائنات التطبيق
   */
  private processExcelData(excelData: ExcelRow[]): ExcelImportResult {
    const links: Link[] = [];
    const categories: Category[] = [];
    const subcategories: Subcategory[] = [];
    const errors: string[] = [];
    const existingUrls = new Set<string>();
    const existingCategoryNames = new Set<string>();
    const existingSubcategoryNames = new Set<string>();

    const now = new Date().toISOString();

    excelData.forEach((row, index) => {
      const rowNumber = index + 2; // +2 لأن الصف الأول هو العناوين

      try {
        // التحقق من البيانات المطلوبة
        if (!row['اسم الرابط']?.trim()) {
          errors.push(`الصف ${rowNumber}: اسم الرابط مطلوب`);
          return;
        }

        if (!row['الرابط']?.trim()) {
          errors.push(`الصف ${rowNumber}: الرابط مطلوب`);
          return;
        }

        if (!row['القسم']?.trim()) {
          errors.push(`الصف ${rowNumber}: القسم مطلوب`);
          return;
        }

        // تنظيف الرابط
        let url = row['الرابط'].trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }

        // التحقق من تكرار الرابط
        if (existingUrls.has(url)) {
          errors.push(`الصف ${rowNumber}: الرابط موجود مسبقاً`);
          return;
        }
        existingUrls.add(url);

        // إنشاء أو العثور على القسم
        const categoryName = row['القسم'].trim();
        let categoryId: string;

        if (!existingCategoryNames.has(categoryName)) {
          const category: Category = {
            id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: categoryName,
            createdAt: now
          };
          categories.push(category);
          categoryId = category.id;
          existingCategoryNames.add(categoryName);
        } else {
          // البحث عن القسم الموجود
          const existingCategory = categories.find(c => c.name === categoryName);
          categoryId = existingCategory?.id || '';
        }

        // إنشاء أو العثور على القسم الفرعي
        let subcategoryId: string | undefined;
        if (row['القسم الفرعي']?.trim()) {
          const subcategoryName = row['القسم الفرعي'].trim();
          const subcategoryKey = `${categoryId}_${subcategoryName}`;

          if (!existingSubcategoryNames.has(subcategoryKey)) {
            const subcategory: Subcategory = {
              id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: subcategoryName,
              categoryId,
              createdAt: now
            };
            subcategories.push(subcategory);
            subcategoryId = subcategory.id;
            existingSubcategoryNames.add(subcategoryKey);
          } else {
            // البحث عن القسم الفرعي الموجود
            const existingSubcategory = subcategories.find(s => 
              s.name === subcategoryName && s.categoryId === categoryId
            );
            subcategoryId = existingSubcategory?.id;
          }
        }

        // معالجة العلامات
        const tags = row['العلامات (مفصولة بفاصلة)']?.trim()
          ? row['العلامات (مفصولة بفاصلة)'].split(',').map(tag => tag.trim()).filter(tag => tag)
          : [];

        // إنشاء الرابط
        const link: Link = {
          id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: row['اسم الرابط'].trim(),
          url,
          description: row['الوصف']?.trim() || '',
          categoryId,
          subcategoryId,
          tags,
          clicks: 0,
          createdAt: now,
          updatedAt: now,
          icon: row['الأيقونة (اختياري)']?.trim() || undefined
        };

        links.push(link);

      } catch (error) {
        errors.push(`الصف ${rowNumber}: خطأ في معالجة البيانات - ${(error as Error).message}`);
      }
    });

    return {
      links,
      categories,
      subcategories,
      errors
    };
  }
}

export const excelService = new ExcelService();
