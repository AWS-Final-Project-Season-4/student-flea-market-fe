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
    { id: 'all', name: 'All', iconName: 'BookOpen' },
    { id: 'books', name: 'Books', iconName: 'BookOpen' },
    { id: 'electronics', name: 'Electronics', iconName: 'Laptop' },
    { id: 'appliances', name: 'Appliances', iconName: 'Cpu' },
    { id: 'stationery', name: 'Stationery', iconName: 'PenTool' },
    { id: 'fashion', name: 'Fashion', iconName: 'Shirt' },
    { id: 'others', name: 'Other', iconName: 'Grid' },
];

export const MOCK_PRODUCTS: ProductItem[] = [
    {
        id: 'prod-01',
        title: 'Casio fx-580VN X',
        price: '500.000đ',
        condition: 'Mới 99%',
        conditionVariant: 'emerald',
        location: 'KTX Khu A',
        imageUrl: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=80',
        category: 'stationery',
    },
    {
        id: 'prod-02',
        title: 'Sách Introduction to Engineering',
        price: '50.000đ',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'KTX Khu A',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
        category: 'books',
    },
    {
        id: 'prod-03',
        title: 'Nồi cơm mini 1.2L',
        price: '500.000đ',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Cơ sở 1',
        imageUrl: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format&fit=crop&q=80',
        category: 'appliances',
    },
    {
        id: 'prod-04',
        title: 'Máy tính để bàn (i5, 8GB)',
        price: '3.000.000đ',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Cơ sở 1',
        imageUrl: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=500&auto=format&fit=crop&q=80',
        category: 'electronics',
    },
    {
        id: 'prod-05',
        title: 'Đèn bàn học chống cận',
        price: '300.000đ',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'Cơ sở 1',
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80',
        category: 'stationery',
    },
    {
        id: 'prod-06',
        title: 'Balo laptop thời trang',
        price: '250.000đ',
        condition: 'Mới 98%',
        conditionVariant: 'emerald',
        location: 'KTX Khu B',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80',
        category: 'fashion',
    },
    {
        id: 'prod-07',
        title: 'Sách Data Structures & Algorithms',
        price: '80.000đ',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'KTX Khu A',
        imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=500&auto=format&fit=crop&q=80',
        category: 'books',
    },
    {
        id: 'prod-08',
        title: 'Tai nghe Bluetooth chụp tai',
        price: '350.000đ',
        condition: 'Mới 99%',
        conditionVariant: 'emerald',
        location: 'KTX Khu A',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
        category: 'electronics',
    },
    {
        id: 'prod-09',
        title: 'Áo khoác Hoodie Unisex FPT',
        price: '180.000đ',
        condition: 'Giảm giá',
        conditionVariant: 'orange',
        location: 'Cơ sở 2',
        imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80',
        category: 'fashion',
    },
    {
        id: 'prod-10',
        title: 'Ghế xoay văn phòng lưới thoáng',
        price: '450.000đ',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'KTX Khu B',
        imageUrl: 'https://images.unsplash.com/photo-1580481077195-c328a37db719?w=500&auto=format&fit=crop&q=80',
        category: 'appliances',
    },
    {
        id: 'prod-11',
        title: 'iPhone 11 Pro 64GB Xanh Midnight',
        price: '4.800.000đ',
        condition: 'Mới 95%',
        conditionVariant: 'emerald',
        location: 'Cơ sở 1',
        imageUrl: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=500&auto=format&fit=crop&q=80',
        category: 'electronics',
    },
    {
        id: 'prod-12',
        title: 'Cây cảnh mini để bàn học',
        price: '45.000đ',
        condition: 'Like New',
        conditionVariant: 'emerald',
        location: 'KTX Khu A',
        imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&auto=format&fit=crop&q=80',
        category: 'others',
    },
];