'use client';

import { AuthProvider } from '@going-monorepo-clean/frontend-providers';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalErrorNotification } from './components/GlobalErrorNotification';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClientOnly } from './ClientOnly';

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
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
