import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import LoginButton from './components/auth/LoginButton';
import DashboardPage from './pages/DashboardPage';
import PortfolioDetailPage from './pages/PortfolioDetailPage';
import PublicPortfolioPage from './pages/PublicPortfolioPage';
import TickerPreviewPage from './pages/TickerPreviewPage';
import AppLayout from './components/layout/AppLayout';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { PublicThemeProvider } from './components/theme/PublicThemeProvider';

type Route = 
  | { type: 'dashboard' }
  | { type: 'portfolio'; name: string }
  | { type: 'ticker'; symbol: string }
  | { type: 'public'; owner: string; portfolio: string };

function parseRoute(): Route {
  const hash = window.location.hash.slice(1) || '/';
  
  if (hash.startsWith('/public/')) {
    const parts = hash.slice(8).split('/');
    if (parts.length >= 2) {
      return { type: 'public', owner: decodeURIComponent(parts[0]), portfolio: decodeURIComponent(parts[1]) };
    }
  }
  
  if (hash.startsWith('/portfolio/')) {
    const name = decodeURIComponent(hash.slice(11));
    return { type: 'portfolio', name };
  }
  
  if (hash.startsWith('/ticker/')) {
    const symbol = decodeURIComponent(hash.slice(8));
    return { type: 'ticker', symbol };
  }
  
  return { type: 'dashboard' };
}

export function navigate(path: string) {
  window.location.hash = path;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const [route, setRoute] = useState<Route>(parseRoute());

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRoute());
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isAuthenticated = !!identity;
  const isInitializing = loginStatus === 'initializing';

  // Public routes don't require authentication - FORCED LIGHT MODE
  if (route.type === 'public') {
    return (
      <PublicThemeProvider>
        <div className="min-h-screen bg-background">
          <PublicPortfolioPage owner={route.owner} portfolioName={route.portfolio} />
          <Toaster />
        </div>
      </PublicThemeProvider>
    );
  }

  // Show loading state during initialization - FORCED LIGHT MODE
  if (isInitializing) {
    return (
      <PublicThemeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PublicThemeProvider>
    );
  }

  // Show login screen if not authenticated - FORCED LIGHT MODE
  if (!isAuthenticated) {
    return (
      <PublicThemeProvider>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="space-y-4">
              <img 
                src="/assets/generated/app-logo.dim_512x512.png" 
                alt="EveryDollar" 
                className="h-24 w-24 mx-auto object-contain"
              />
              <h1 className="text-4xl font-bold tracking-tight">EveryDollar</h1>
              <p className="text-lg text-muted-foreground">
                Track your investment portfolios with real-time market data
              </p>
            </div>
            <div className="pt-8">
              <LoginButton />
            </div>
          </div>
        </div>
      </PublicThemeProvider>
    );
  }

  // Authenticated routes - keep existing dark theme behavior
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AppLayout>
        {route.type === 'dashboard' && <DashboardPage />}
        {route.type === 'portfolio' && <PortfolioDetailPage portfolioName={route.name} />}
        {route.type === 'ticker' && <TickerPreviewPage symbol={route.symbol} />}
      </AppLayout>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
