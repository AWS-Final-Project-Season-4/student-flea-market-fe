///////////////////////////////////////////////////////////
//                                                       //
//                    ROOT LAYOUT                        //
//                                                       //
///////////////////////////////////////////////////////////

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Flea Market",
  description: "Student Flea Market - Buy, sell, and exchange textbooks, student essentials, and dorm gear",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
