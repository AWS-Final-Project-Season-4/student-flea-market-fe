///////////////////////////////////////////////////////////
//                                                       //
//                    ROOT LAYOUT                        //
//                                                       //
///////////////////////////////////////////////////////////

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Flea Market",
  description: "Student Flea Market - Buy, sell, and exchange textbooks, student essentials, and dorm gear. Trao đổi đồ dùng sinh viên tiết kiệm và an toàn.",
  icons: {
    icon: [
      { url: '/icon.svg?v=2', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg?v=2" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem('sfm_lang');if(l){document.documentElement.lang=l;}var t=localStorage.getItem('sfm_theme');var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#FAF7F2] dark:bg-stone-950 text-[#2A211B] dark:text-stone-100 transition-colors duration-200" suppressHydrationWarning>{children}</body>
    </html>
  );
}
