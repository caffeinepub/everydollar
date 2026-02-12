import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

interface PublicThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme provider that enforces light mode for public/unauthenticated screens.
 * Disables system theme detection and forces light theme regardless of user preferences.
 */
export function PublicThemeProvider({ children }: PublicThemeProviderProps) {
  return (
    <ThemeProvider 
      attribute="class" 
      forcedTheme="light"
      enableSystem={false}
      storageKey="public-theme"
    >
      {children}
    </ThemeProvider>
  );
}
