import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Provider } from '@/components/provider';
import './global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.openmausbot.com'),
  title: {
    default: "Mama's Agent",
    template: "%s · Mama's Agent",
  },
  description: 'Install, configure, and extend your local-first team of AI agents.',
  openGraph: {
    title: "Mama's Agent",
    description: 'Install, configure, and extend your local-first team of AI agents.',
    type: 'website',
  },
  icons: {
    icon: '/app-icon.svg',
    apple: '/app-icon.svg',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
