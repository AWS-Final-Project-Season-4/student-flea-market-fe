export interface CategoryItem {
    id: string;
    name: string;
    iconName: 'LayoutGrid' | 'BookOpen' | 'Laptop' | 'Home' | 'Shirt' | 'Lipstick' | 'Clover' | 'PenTool' | 'Utensils';
}

export interface ProductItem {
    id: string;
    itemCode: string;
    title: string;
    price: string;
    condition: string;
    conditionVariant: 'emerald' | 'orange';
    location: string;
    imageUrl: string;
    category: string;
}

export const CATEGORIES: CategoryItem[] = [
    { id: 'all', name: 'All', iconName: 'LayoutGrid' },
    { id: 'books', name: 'Books & Textbooks', iconName: 'BookOpen' },
    { id: 'electronics', name: 'Electronics', iconName: 'Laptop' },
    { id: 'dorm-living', name: 'Dorm & Living', iconName: 'Home' },
    { id: 'fashion', name: 'Fashion', iconName: 'Shirt' },
    { id: 'beauty-health', name: 'Beauty & Health', iconName: 'Lipstick' },
    { id: 'stationery-study', name: 'Stationery & Study', iconName: 'PenTool' },
    { id: 'food-drinks', name: 'Food & Drinks', iconName: 'Utensils' },
];

export const formatItemCodeDisplay = (code?: string): string => {
    if (!code) return '';
    const clean = code.trim().toUpperCase().replace('-', '');
    if (clean.length === 8) {
        return `${clean.slice(0, 2)}-${clean.slice(2)}`;
    }
    return clean;
};
