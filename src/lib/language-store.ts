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
      postAd: 'Đẩy tin bán gấp',
      login: 'Đăng nhập',
      register: 'Đăng ký',
      logout: 'Đăng xuất',
      signedInAs: 'Đăng nhập:',
      postListingMobile: '⚡ Đẩy tin bán gấp',
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
      all: 'Tất cả',
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
    authRequired: {
      contactTitle: 'Đăng nhập để liên hệ',
      contactDesc: 'Vui lòng đăng nhập với tài khoản sinh viên để trao đổi và mua món đồ này.',
      postItemTitle: 'Đăng nhập để đăng đồ pass',
      postItemDesc: 'Vui lòng đăng nhập với tài khoản sinh viên để đăng bán đồ cũ miễn phí.',
      postAdTitle: 'Đăng nhập để đẩy tin bán gấp',
      postAdDesc: 'Vui lòng đăng nhập để sử dụng tính năng quảng cáo và đẩy tin lên xu hướng.',
    },
    postItemModal: {
      title: 'Đăng đồ cần pass (Miễn phí)',
      subtitle: 'Chia sẻ đồ dùng, giáo trình giá hạt dẻ cho bạn bè trong trường',
      itemName: 'Tên món đồ',
      itemNamePlaceholder: 'Ví dụ: Quạt mini Senko, Giáo trình Giải tích 1...',
      category: 'Danh mục',
      price: 'Giá bán (VND)',
      freeGift: 'Tặng miễn phí (0đ)',
      condition: 'Tình trạng đồ',
      location: 'Khu vực giao dịch / KTX',
      locationPlaceholder: 'Ví dụ: KTX Khu A, KTX Khu B, Cổng trường...',
      description: 'Mô tả chi tiết',
      descPlaceholder: 'Mô tả tình trạng món đồ, phụ kiện kèm theo, thời gian rảnh...',
      submitBtn: 'Đăng tin ngay (Miễn phí)',
      successToast: 'Đã đăng món đồ thành công! Tin của bạn đã hiển thị trên chợ.',
    },
    adPromotionModal: {
      title: '🚀 Dịch vụ Đẩy tin bán gấp (Post Ad)',
      subtitle: 'Ghim món đồ lên đầu trang chủ & gắn huy hiệu BÁN GẤP để thanh lý nhanh nhất',
      selectItem: '1. Chọn món đồ muốn đẩy tin',
      choosePackage: '2. Chọn gói quảng cáo (Ad Package)',
      pkg1Title: 'Gói Bán Gấp 24h',
      pkg1Price: '5.000đ',
      pkg1Desc: 'Gắn nhãn ⚡ BÁN GẤP, ghim lên đầu trang chủ 24h',
      pkg2Title: 'Gói Xu Hướng 3 Ngày',
      pkg2Price: '15.000đ',
      pkg2Desc: 'Gắn nhãn 🔥 HOT DEAL, ưu tiên tìm kiếm 3 ngày',
      pkg3Title: 'Gói Siêu Tốc 7 Ngày',
      pkg3Price: '25.000đ',
      pkg3Desc: 'Gói VIP: Ghim trang chủ 7 ngày + thông báo KTX',
      paymentMethod: '3. Thanh toán phí quảng cáo',
      momoVnpay: 'Quét mã MoMo / VNPay QR (Sinh viên)',
      activateBtn: 'Thanh toán & Kích hoạt đẩy tin ngay',
      successToast: 'Đã kích hoạt đẩy tin bán gấp thành công! Món đồ của bạn đã lên Top.',
    },
  },
  en: {
    navbar: {
      searchPlaceholder: 'Search textbooks, electronics, student gear...',
      suggestions: 'Suggestions:',
      adminPortal: 'Admin Portal',
      postAd: 'Post Ad (Boost)',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      signedInAs: 'Signed in as:',
      postListingMobile: '⚡ Post Ad (Boost)',
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
      all: 'All',
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
    authRequired: {
      contactTitle: 'Login to contact seller',
      contactDesc: 'Please login with your student account to contact seller and exchange this item.',
      postItemTitle: 'Login to post an item',
      postItemDesc: 'Please login with your student account to post your pre-loved student gear for free.',
      postAdTitle: 'Login to boost your listing',
      postAdDesc: 'Please login to use advertisement and boost your items to trending status.',
    },
    postItemModal: {
      title: 'Post an Item (Free Listing)',
      subtitle: 'Share pre-loved essentials & textbooks with campus peers',
      itemName: 'Item title',
      itemNamePlaceholder: 'E.g.: Senko desk fan, Calculus 1 textbook...',
      category: 'Category',
      price: 'Price (VND)',
      freeGift: 'Giveaway (0 VND)',
      condition: 'Condition',
      location: 'Pickup / Campus Area',
      locationPlaceholder: 'E.g.: Dorm Area A, Dorm Area B, Main Campus Gate...',
      description: 'Description',
      descPlaceholder: 'Describe item condition, included accessories, pickup time...',
      submitBtn: 'Publish Item (Free)',
      successToast: 'Item published successfully! Your listing is now live.',
    },
    adPromotionModal: {
      title: 'Boost Listing (Post Ad)',
      subtitle: 'Pin your item to top of homepage and add URGENT badge for fastest deals',
      selectItem: '1. Select an item to promote',
      choosePackage: '2. Choose Ad Boost Package',
      pkg1Title: 'Urgent 24h Pass',
      pkg1Price: '5,000 VND',
      pkg1Desc: 'Badge ⚡ URGENT, pinned to homepage for 24h',
      pkg2Title: 'Trending 3-Day',
      pkg2Price: '15,000 VND',
      pkg2Desc: 'Badge 🔥 HOT DEAL, search priority for 3 days',
      pkg3Title: 'Super Fast 7-Day',
      pkg3Price: '25,000 VND',
      pkg3Desc: 'VIP: Pinned 7 days + campus dorm blast',
      paymentMethod: '3. Student payment method',
      momoVnpay: 'Scan MoMo / VNPay QR Code',
      activateBtn: 'Pay & Activate Boost Now',
      successToast: 'Boost activated successfully! Your item is now featured on top.',
    },
  },
} as const;

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'vi', // Default to Vietnamese

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
