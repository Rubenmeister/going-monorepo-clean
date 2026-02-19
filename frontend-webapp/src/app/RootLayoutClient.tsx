'use client';

import { AuthProvider } from '@going-monorepo-clean/frontend-providers';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalErrorNotification } from './components/GlobalErrorNotification';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClientOnly } from './ClientOnly';

export function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <GlobalErrorNotification />
          <ClientOnly>
            <Navbar />
          </ClientOnly>
          <div className="flex flex-col md:flex-row min-h-screen">
            <ClientOnly>
              <Sidebar />
            </ClientOnly>
            <div className="flex flex-col flex-1 md:ml-0">
              <main className="flex-1">
                {children}
              </main>
              <ClientOnly>
                <Footer />
              </ClientOnly>
            </div>
          </div>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
