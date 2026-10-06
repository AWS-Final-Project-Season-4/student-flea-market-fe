🎓STUDENT FLEA MARKET - FRONTEND WEB APPLICATION
A modern, responsive and cloud-native web frontend for STUDENT FLEA MARKET, an e-commerce platform designed for university students to exchange textbooks, study materials, and second-hand items.

Build with Next.js (App Router), TailwindCSS and shadcn/ui, interfacing seamlessly with an enterprise .NET 8 Web API and AWS Cloud Services.

--------------------------------

🚀Tech Stack & Core Libraries:
- Framework: Next.js (App Router, React 19 / Server & Client Components)
- Styling: TailwindCSS
- UI Components: shadcn/ui (Radix UI primitives)
- Icons: Lucide React
- Server State Management & Data Fetching: TanStack Query v5 (React Query)
- Client State Management & Validation: React Hook Form + Zod
- HTTP Client: Axios (Centralized interceptors for JWT injection & refresh token rotation)

--------------------------------

☁️ Cloud & Architecture Highlights:
- Direct-to-S3 Media Uploads: Utilizes S3 Presigned URLs issued by the .NET backend, offloading media bandwidth from API servers.
- Global Asset Delivery: Optimized thumbnail and media caching through Amazon CloudFront CDN.
- Responsive & Accessible UI: Strict compliance with WCAG accessibility guidelines via Radix UI primitives.