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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
