import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import MessageProvider from '@/features/message/providers/MessageProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'User Management App',
  description: 'A comprehensive user management application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
      
        <Providers>
        <MessageProvider>
          {children}
          </MessageProvider>
        </Providers>

      </body>
    </html>
  );
}