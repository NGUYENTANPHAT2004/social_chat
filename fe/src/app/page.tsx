// src/app/layout.tsx

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Entertainment Platform',
  description: 'Nền tảng giải trí với livestream, games và nhiều tính năng khác',
  keywords: ['entertainment', 'games', 'livestream', 'platform'],
  authors: [{ name: 'Entertainment Platform Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Entertainment Platform',
    description: 'Nền tảng giải trí hàng đầu với livestream và games',
    siteName: 'Entertainment Platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Entertainment Platform',
    description: 'Nền tảng giải trí hàng đầu với livestream và games',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Meta tags for mobile */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body 
        className={`${inter.className} bg-gray-900 text-white antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {/* Skip to main content for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-3 py-2 rounded-md z-50"
          >
            Chuyển đến nội dung chính
          </a>
          
          {/* Main content */}
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
          
          {/* Portal container for modals */}
          <div id="modal-root" />
          
          {/* Portal container for tooltips */}
          <div id="tooltip-root" />
        </Providers>
        
        {/* Scripts */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics or other analytics */}
            {process.env.NEXT_PUBLIC_GA_ID && (
              <>
                <script
                  async
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                    `,
                  }}
                />
              </>
            )}
          </>
        )}
      </body>
    </html>
  );
}