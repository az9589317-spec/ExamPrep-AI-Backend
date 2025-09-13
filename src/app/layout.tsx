
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/components/app/auth-provider';
import { NotificationProvider } from '@/hooks/use-notifications';

export const metadata: Metadata = {
  title: 'ExamPrep AI - Admin',
  description: 'AI-powered competitive exam preparation platform - Admin Panel.',
};

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
          <Toaster />
      </body>
    </html>
  );
}
