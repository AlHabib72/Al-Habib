// FIXED ISSUES:
// 1. Two layout.tsx versions existed — one imported AuthProvider directly, other via Provider wrapper — MERGED
// 2. One version had Navbar/Footer in layout (correct), other didn't (missing) — FIXED to have both
// 3. Font variables not applied to body in v2 — FIXED

import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../hooks/useAuth';
import { CartProvider } from '../hooks/useCart';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Toaster } from 'react-hot-toast';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'GlowAura | Luxury Skincare',
    template: '%s | GlowAura',
  },
  description: 'Discover premium skincare products for your radiant glow. Luxurious, natural, and effective.',
  keywords: ['skincare', 'luxury', 'beauty', 'organic', 'natural', 'glowaura'],
  openGraph: {
    title: 'GlowAura | Luxury Skincare',
    description: 'Premium skincare for your radiant glow.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans bg-[#fdfbf7] text-[#2c2c2c]">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3000,
                style: { background: '#2c2c2c', color: '#fff' },
                success: { iconTheme: { primary: '#c4a35a', secondary: '#fff' } },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
