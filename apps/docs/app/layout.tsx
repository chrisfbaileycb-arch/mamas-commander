import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { Provider } from '@/components/provider';
import './global.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.openmausbot.com'),
  title: {
    default: "Mama's Agent",
    template: "%s · Mama's Agent",
  },
  description: 'Supervisory AI agent orchestration, verification harness, and local-first team control plane.',
  openGraph: {
    title: "Mama's Agent",
    description: 'Supervisory AI agent orchestration, verification harness, and local-first team control plane.',
    type: 'website',
  },
  icons: {
    icon: '/app-icon.svg',
    apple: '/app-icon.svg',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.className} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col antialiased">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
