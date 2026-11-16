export interface CategoryDetectorResult {
    categoryId: string;
    prefix: string;
    labelVi: string;
    labelEn: string;
    matchedKeyword: string;
}

interface CategoryRule {
    categoryId: string;
    prefix: string;
    labelVi: string;
    labelEn: string;
    keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
    {
        categoryId: 'stationery-study',
        prefix: 'ST',
        labelVi: 'Dụng cụ học tập',
        labelEn: 'Stationery & Study',
        keywords: [
            'casio', 'fx-580', 'fx580', 'fx-570', 'fx570', 'vinacal', 'máy tính cầm tay',
            'thước', 'bút', 'vở', 'tập', 'bút dạ', 'compa', 'hộp bút', 'bút bi',
            'bút chì', 'tẩy', 'gôm', 'giấy note', 'kẹp giấy', 'đèn bàn', 'kéo học sinh',
            'bìa còng', 'sổ tay', 'file tài liệu'
        ],
    },
    {
        categoryId: 'books',
        prefix: 'BK',
        labelVi: 'Sách & Giáo trình',
        labelEn: 'Books & Textbooks',
        keywords: [
            'sách', 'giáo trình', 'tiểu thuyết', 'giải tích', 'đại số', 'ielts', 'toeic',
            'toán', 'vật lý', 'hóa học', 'triết học', 'kinh tế', 'pháp luật', 'từ điển',
            'truyện', 'textbook', 'book', 'novel', 'grammar', 'ngữ pháp', 'tài liệu ôn'
        ],
    },
    {
        categoryId: 'electronics',
        prefix: 'EL',
        labelVi: 'Đồ điện tử',
        labelEn: 'Electronics',
        keywords: [
            'laptop', 'chuột', 'bàn phím', 'tai nghe', 'headphone', 'earphone', 'màn hình',
            'sạc', 'cáp', 'iphone', 'ipad', 'máy tính bảng', 'điện thoại', 'bluetooth',
            'loa', 'macbook', 'ram', 'ổ cứng', 'ssd', 'usb', 'case pc', 'cpu', 'linh kiện pc',
            'củ sạc', 'pin dự phòng', 'airpods'
        ],
    },
    {
        categoryId: 'dorm-living',
        prefix: 'DL',
        labelVi: 'Đồ KTX & Đời sống',
        labelEn: 'Dorm & Living',
        keywords: [
            'quạt', 'ấm đun', 'nồi cơm', 'nồi lẩu', 'ấm siêu tốc', 'ghế', 'bàn gấp',
            'nệm', 'kệ', 'móc áo', 'chăn', 'drap', 'gối', 'rèm', 'thau', 'chậu',
            'gương', 'bình nước', 'bếp từ', 'bếp điện', 'hộp cơm'
        ],
    },
    {
        categoryId: 'fashion',
        prefix: 'FA',
        labelVi: 'Thời trang',
        labelEn: 'Fashion',
        keywords: [
            'áo', 'quần', 'hoodie', 'balo', 'túi xách', 'túi đeo', 'giày', 'dép',
            'khoác', 'sneaker', 'sơ mi', 'thun', 'jacket', 'mũ', 'nón', 'ví',
            'khăn choàng', 'thắt lưng', 'chân váy'
        ],
    },
    {
        categoryId: 'beauty-health',
        prefix: 'BH',
        labelVi: 'Sức khỏe & Sắc đẹp',
        labelEn: 'Beauty & Health',
        keywords: [
            'sữa rửa mặt', 'kem chống nắng', 'máy sấy', 'cân điện tử', 'son',
            'nước hoa', 'dưỡng ẩm', 'serum', 'toner', 'kẹp tóc', 'lược',
            'dầu gội', 'sữa tắm', 'bông tẩy trang', 'máy uốn tóc'
        ],
    },
    {
        categoryId: 'food-drinks',
        prefix: 'FD',
        labelVi: 'Đồ ăn & Thức uống',
        labelEn: 'Food & Drinks',
        keywords: [
            'bánh', 'kẹo', 'cà phê', 'coffee', 'mì gói', 'trà sữa', 'khô gà',
            'voucher', 'đồ ăn', 'nước ngọt', 'snack', 'trái cây sấy', 'bánh tráng'
        ],
    },
];

export function detectCategoryFromTitle(title: string): CategoryDetectorResult | null {
    if (!title || title.trim().length < 2) return null;

    const normalized = title.trim().toLowerCase();

    for (const rule of CATEGORY_RULES) {
        for (const kw of rule.keywords) {
            // Check word boundary or substring
            if (normalized.includes(kw)) {
                return {
                    categoryId: rule.categoryId,
                    prefix: rule.prefix,
                    labelVi: rule.labelVi,
                    labelEn: rule.labelEn,
                    matchedKeyword: kw,
                };
            }
        }
    }

    return null;
}

export function getCategoryPrefix(categoryId: string): string {
    const found = CATEGORY_RULES.find((r) => r.categoryId === categoryId);
    return found ? found.prefix : 'IT';
}

