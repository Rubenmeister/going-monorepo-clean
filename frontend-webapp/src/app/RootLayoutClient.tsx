'use client';

import { AuthProvider } from '@going-monorepo-clean/frontend-providers';
import { Navbar } from './components/Navbar';
import { Footer } from './components/layout/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalErrorNotification } from './components/GlobalErrorNotification';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClientOnly } from './ClientOnly';
import SupportChat from './components/ui/SupportChat';

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <GlobalErrorNotification />
          <ClientOnly>
            <Navbar />
          </ClientOnly>
          <main className="min-h-screen">{children}</main>
          <ClientOnly>
            <Footer />
          </ClientOnly>
          <ClientOnly>
            <SupportChat />
          </ClientOnly>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
