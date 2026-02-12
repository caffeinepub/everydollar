import { useState } from 'react';
import { navigate } from '../../App';
import { useGetPortfolios } from '../../hooks/useQueries';
import { useTheme } from '../../hooks/useTheme';
import LoginButton from '../auth/LoginButton';
import TickerTypeahead from '../market/TickerTypeahead';
import { SearchResult } from '../../hooks/useMarketData';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, Moon, Sun, ChevronDown } from 'lucide-react';

export default function TopNav() {
  const { data: portfolios = [] } = useGetPortfolios();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleTickerSelect = (result: SearchResult) => {
    navigate(`/ticker/${encodeURIComponent(result.symbol)}`);
    setSearchQuery('');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 z-50">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Logo and name */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img
            src="/assets/generated/everydollar-logo.dim_512x512.png"
            alt="EveryDollar"
            className="h-8 w-8"
          />
          <span className="text-xl font-bold hidden sm:inline">EveryDollar</span>
        </button>

        {/* Portfolio switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="hidden md:flex">
              Portfolios
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Your Portfolios</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {portfolios.length === 0 ? (
              <DropdownMenuItem disabled>No portfolios yet</DropdownMenuItem>
            ) : (
              portfolios.map((p) => (
                <DropdownMenuItem
                  key={p.name}
                  onClick={() => navigate(`/portfolio/${encodeURIComponent(p.name)}`)}
                >
                  {p.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Global search with typeahead */}
        <div className="flex-1 max-w-md hidden lg:block">
          <TickerTypeahead
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={handleTickerSelect}
            placeholder="Search ticker..."
          />
        </div>

        {/* Settings and auth */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark Mode
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <LoginButton />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
