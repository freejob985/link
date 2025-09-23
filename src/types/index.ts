export interface Link {
  id: string;
  name: string;
  url: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  tags: string[];
  clicks: number;
  createdAt: string;
  updatedAt: string;
  isHighlighted?: boolean; // للبحث
  icon?: string; // رابط الأيقونة
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  linkIds: string[];
  createdAt: string;
}

export interface ClickRecord {
  id: string;
  linkId: string;
  clickedAt: string;
}

export interface Stats {
  totalClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  topLinks: Array<{ link: Link; clicks: number }>;
  clicksByDay: Array<{ date: string; clicks: number }>;
}

export interface AppData {
  links: Link[];
  categories: Category[];
  subcategories: Subcategory[];
  groups: Group[];
  clickRecords: ClickRecord[];
}

export type Theme = 'light' | 'dark';

export interface AIsuggestion {
  name?: string;
  description: string;
  tags: string[];
}