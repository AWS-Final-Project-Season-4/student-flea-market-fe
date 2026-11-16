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

export const MOCK_PRODUCTS: ProductItem[] = [
    {
        id: 'prod-01',
        itemCode: 'ST7K9A2P', // ST: Stationery
        title: 'Casio FX-580VN X Calculator',
        price: '500,000 VND',
        condition: '99% New',
        conditionVariant: 'emerald',
        location: 'Dorm Area A',
        imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=80',
        category: 'stationery-study',
    },
    {
        id: 'prod-02',
        itemCode: 'BK8X2M4N', // BK: Books
        title: 'Introduction to Engineering Textbook',
        price: '50,000 VND',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Dorm Area A',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
        category: 'books',
    },
    {
        id: 'prod-03',
        itemCode: 'DL3P5Q9R', // DL: Dorm & Living
        title: 'Compact Rice Cooker 1.2L',
        price: '500,000 VND',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Main Campus',
        imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
        category: 'dorm-living',
    },
    {
        id: 'prod-04',
        itemCode: 'EL4D6E8F', // EL: Electronics
        title: 'Desktop PC Set (Core i5, 8GB RAM)',
        price: '3,000,000 VND',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Campus 1',
        imageUrl: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=500&auto=format&fit=crop&q=80',
        category: 'electronics',
    },
    {
        id: 'prod-05',
        itemCode: 'ST9G2H5J', // ST: Stationery
        title: 'Eye-care LED Desk Lamp',
        price: '300,000 VND',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Campus 1',
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80',
        category: 'stationery-study',
    },
    {
        id: 'prod-06',
        itemCode: 'FA6K8M3N', // FA: Fashion
        title: 'Waterproof Laptop Backpack',
        price: '250,000 VND',
        condition: '98% New',
        conditionVariant: 'emerald',
        location: 'Dorm Area B',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80',
        category: 'fashion',
    },
    {
        id: 'prod-07',
        itemCode: 'BK2P4R7S', // BK: Books
        title: 'Data Structures & Algorithms in C++',
        price: '80,000 VND',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Dorm Area A',
        imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=500&auto=format&fit=crop&q=80',
        category: 'books',
    },
    {
        id: 'prod-08',
        itemCode: 'EL5T8V1W', // EL: Electronics
        title: 'Wireless Bluetooth Over-ear Headphones',
        price: '350,000 VND',
        condition: '99% New',
        conditionVariant: 'emerald',
        location: 'Dorm Area A',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
        category: 'electronics',
    },
    {
        id: 'prod-09',
        itemCode: 'FA3X7Y9Z', // FA: Fashion
        title: 'Unisex University Hoodie Sweatshirt',
        price: '180,000 VND',
        condition: 'Discounted',
        conditionVariant: 'orange',
        location: 'Campus 2',
        imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80',
        category: 'fashion',
    },
    {
        id: 'prod-10',
        itemCode: 'DL8A2C4D', // DL: Dorm & Living
        title: 'Ergonomic Mesh Swivel Chair',
        price: '450,000 VND',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Dorm Area B',
        imageUrl: 'https://images.unsplash.com/photo-1580481077195-c328a37db719?w=500&auto=format&fit=crop&q=80',
        category: 'dorm-living',
    },
    {
        id: 'prod-11',
        itemCode: 'EL1E3F6G', // EL: Electronics
        title: 'iPhone 11 Pro 64GB Midnight Green',
        price: '4,800,000 VND',
        condition: '95% New',
        conditionVariant: 'emerald',
        location: 'Campus 1',
        imageUrl: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=500&auto=format&fit=crop&q=80',
        category: 'electronics',
    },
    {
        id: 'prod-12',
        itemCode: 'BH7H9J2K', // BH: Beauty & Health
        title: 'Mini Ionic Hair Dryer 1200W',
        price: '140,000 VND',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Dorm Area B',
        imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
        category: 'beauty-health',
    },
    {
        id: 'prod-13',
        itemCode: 'BH4M6N8P', // BH: Beauty & Health
        title: 'Smart Digital Bluetooth Body Scale',
        price: '120,000 VND',
        condition: '99% New',
        conditionVariant: 'emerald',
        location: 'Campus 1',
        imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&fit=crop&q=80',
        category: 'beauty-health',
    },
    {
        id: 'prod-14',
        itemCode: 'FD9R2S4T', // FD: Food & Drinks
        title: 'Da Lat Dried Fruit & Snack Mix (500g)',
        price: '65,000 VND',
        condition: 'Unopened',
        conditionVariant: 'emerald',
        location: 'Dorm Area A',
        imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&auto=format&fit=crop&q=80',
        category: 'food-drinks',
    },
    {
        id: 'prod-15',
        itemCode: 'FD5V7W9X', // FD: Food & Drinks
        title: 'Highlands Coffee Gift Voucher (100k)',
        price: '70,000 VND',
        condition: 'Valid till Dec',
        conditionVariant: 'orange',
        location: 'Campus 1',
        imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80',
        category: 'food-drinks',
    },
    {
        id: 'prod-16',
        itemCode: 'DL3Z6A8B', // DL: Dorm & Living
        title: 'Foldable Student Study Bed-Desk',
        price: '150,000 VND',
        condition: '98% New',
        conditionVariant: 'emerald',
        location: 'Dorm Area B',
        imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop&q=80',
        category: 'dorm-living',
    },
];
