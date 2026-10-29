export interface CategoryItem {
    id: string;
    name: string;
    iconName: 'BookOpen' | 'Laptop' | 'Cpu' | 'PenTool' | 'Shirt' | 'Grid';
}

export interface ProductItem {
    id: string;
    title: string;
    price: string;
    condition: string;
    conditionVariant: 'emerald' | 'orange';
    location: string;
    imageUrl: string;
    category: string;
}

export const CATEGORIES: CategoryItem[] = [
    { id: 'all', name: 'All Categories', iconName: 'BookOpen' },
    { id: 'books', name: 'Books & Textbooks', iconName: 'BookOpen' },
    { id: 'electronics', name: 'Electronics & IT', iconName: 'Laptop' },
    { id: 'appliances', name: 'Dorm Essentials', iconName: 'Cpu' },
    { id: 'stationery', name: 'Stationery', iconName: 'PenTool' },
    { id: 'fashion', name: 'Student Fashion', iconName: 'Shirt' },
    { id: 'others', name: 'Other Items', iconName: 'Grid' },
];

export const MOCK_PRODUCTS: ProductItem[] = [
    {
        id: 'prod-01',
        title: 'Casio FX-580VN X Calculator',
        price: '500,000 VND',
        condition: '99% New',
        conditionVariant: 'emerald',
        location: 'Dorm Area A',
        imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=80',
        category: 'stationery',
    },
    {
        id: 'prod-02',
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
        title: 'Compact Rice Cooker 1.2L',
        price: '500,000 VND',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Main Campus',
        imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
        category: 'appliances',
    },
    {
        id: 'prod-04',
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
        title: 'Eye-care LED Desk Lamp',
        price: '300,000 VND',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Campus 1',
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80',
        category: 'stationery',
    },
    {
        id: 'prod-06',
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
        title: 'Ergonomic Mesh Swivel Chair',
        price: '450,000 VND',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Dorm Area B',
        imageUrl: 'https://images.unsplash.com/photo-1580481077195-c328a37db719?w=500&auto=format&fit=crop&q=80',
        category: 'appliances',
    },
    {
        id: 'prod-11',
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
        title: 'Desk Succulent & Mini Plant Pot',
        price: '45,000 VND',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Dorm Area A',
        imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&auto=format&fit=crop&q=80',
        category: 'others',
    },
];
