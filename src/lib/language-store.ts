///////////////////////////////////////////////////////////
//                                                       //
//               LANGUAGE STORE (ZUSTAND)                //
//                                                       //
///////////////////////////////////////////////////////////

import { create } from 'zustand';

export type Language = 'vi' | 'en';

export const DICTIONARY = {
  vi: {
    navbar: {
      searchPlaceholder: 'Tìm kiếm sản phẩm, giáo trình, đồ điện sinh viên...',
      suggestions: 'Gợi ý:',
      adminPortal: 'Cổng Admin',
      postAd: 'Đăng tin',
      login: 'Đăng nhập',
      register: 'Đăng ký',
      logout: 'Đăng xuất',
      signedInAs: 'Đăng nhập:',
      postListingMobile: '+ Đăng tin pass đồ',
      searchAria: 'Mở tìm kiếm',
      closeAria: 'Đóng tìm kiếm',
      cartAria: 'Giỏ hàng',
      langToggle: 'Đổi ngôn ngữ',
      popularSearches: [
        'Sách giáo trình',
        'Quạt mini để bàn',
        'Ấm siêu tốc',
        'Đèn bàn LED',
        'Tai nghe',
        'Bàn gấp KTX',
        'Nồi cơm điện mini',
        'Máy tính Casio',
      ],
    },
    hero: {
      badge: 'STUDENT FLEA MARKET',
      headlinePart1: 'Trao đổi đồ dùng sinh viên',
      headlinePart2: 'Tiết kiệm & An toàn',
      subtitle: 'Giáo trình, quạt điện, ấm đun, đồ dùng học tập giá hạt dẻ từ bạn bè cùng trường.',
      btnBrowse: 'Xem đồ đang bán',
      btnPost: 'Đăng đồ cần pass',
      trustBadge1: 'Gặp mặt trực tiếp - Giao dịch an toàn',
      trustBadge2: 'Khu vực KTX & Quanh trường',
    },
    categories: {
      all: 'Tất cả danh mục',
      books: 'Sách & Giáo trình',
      electronics: 'Đồ điện tử',
      'dorm-living': 'Đồ KTX & Đời sống',
      fashion: 'Thời trang',
      'beauty-health': 'Sức khỏe & Sắc đẹp',
      'stationery-study': 'Dụng cụ học tập',
      'food-drinks': 'Đồ ăn & Thức uống',
    },
    home: {
      recentTitle: 'Đồ sinh viên mới đăng',
      searchResultsTitle: 'Kết quả tìm kiếm',
      itemsCount: 'món đồ',
      seeAll: 'Xem tất cả',
      searchingFor: 'Kết quả tìm kiếm cho:',
      matchingFound: 'món đồ phù hợp',
      clearFilter: 'Xóa bộ lọc',
      emptyTitle: 'Không tìm thấy món đồ phù hợp.',
      emptySubtitle: 'Hãy thử tìm bằng từ khóa hoặc danh mục khác nhé!',
      footerDesc: 'Nền tảng mua bán & trao đổi đồ dùng sinh viên đã qua sử dụng.',
      termsOfService: 'Điều khoản dịch vụ',
      privacyPolicy: 'Chính sách bảo mật',
      refundDispute: 'Hoàn tiền & Khiếu nại',
    },
    productCard: {
      contactBtn: 'Liên hệ / Trao đổi',
      conditionLabel: 'Tình trạng',
    },
  },
  en: {
    navbar: {
      searchPlaceholder: 'Search textbooks, electronics, student gear...',
      suggestions: 'Suggestions:',
      adminPortal: 'Admin Portal',
      postAd: 'Post Ad',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      signedInAs: 'Signed in as:',
      postListingMobile: '+ Post New Listing',
      searchAria: 'Open search',
      closeAria: 'Close search',
      cartAria: 'Shopping cart',
      langToggle: 'Change language',
      popularSearches: [
        'Textbooks',
        'Desk fan',
        'Electric kettle',
        'Desk lamp',
        'Headphones',
        'Dorm table',
        'Mini rice cooker',
        'Casio calculator',
      ],
    },
    hero: {
      badge: 'STUDENT FLEA MARKET',
      headlinePart1: 'Campus Student Exchange',
      headlinePart2: 'Save More, Trade Safe',
      subtitle: 'Textbooks, desk fans, electric kettles, and study essentials at friendly student prices.',
      btnBrowse: 'Browse Listings',
      btnPost: 'Post an Item',
      trustBadge1: 'Face-to-face meetups - Safe deals',
      trustBadge2: 'Dormitory & Campus Area',
    },
    categories: {
      all: 'All Categories',
      books: 'Books & Textbooks',
      electronics: 'Electronics',
      'dorm-living': 'Dorm & Living',
      fashion: 'Fashion',
      'beauty-health': 'Beauty & Health',
      'stationery-study': 'Stationery & Study',
      'food-drinks': 'Food & Drinks',
    },
    home: {
      recentTitle: 'Newly posted seller items',
      searchResultsTitle: 'Search results',
      itemsCount: 'items',
      seeAll: 'See all',
      searchingFor: 'Search results for:',
      matchingFound: 'matching items found',
      clearFilter: 'Clear filter',
      emptyTitle: 'No items matched your search criteria.',
      emptySubtitle: 'Try a different keyword or category!',
      footerDesc: 'A platform for students to exchange second-hand items.',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      refundDispute: 'Refund & Dispute',
    },
    productCard: {
      contactBtn: 'Contact / Exchange',
      conditionLabel: 'Condition',
    },
  },
} as const;

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'vi', // Default to Vietnamese as requested

  setLanguage: (lang: Language) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('sfm_lang', lang);
      } catch (e) {
        console.error(e);
      }
    }
    set({ language: lang });
  },

  toggleLanguage: () => {
    const nextLang: Language = get().language === 'vi' ? 'en' : 'vi';
    get().setLanguage(nextLang);
  },
}));

// Initialize language from localStorage on client
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('sfm_lang') as Language | null;
    if (saved === 'vi' || saved === 'en') {
      useLanguageStore.setState({ language: saved });
    }
  } catch (e) {
    console.error(e);
  }
}

