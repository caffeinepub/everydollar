import { useState } from 'react';
import { navigate } from '../../App';
import { useGetPortfolios } from '../../hooks/useQueries';
import { useTheme } from '../../hooks/useTheme';
import LoginButton from '../auth/LoginButton';
import MobileTickerSearchDialog from '../market/MobileTickerSearchDialog';
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
import { Settings, Moon, Sun, ChevronDown, Menu, Search } from 'lucide-react';

interface TopNavProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function TopNav({ sidebarOpen, onToggleSidebar }: TopNavProps) {
  const { data: portfolios = [] } = useGetPortfolios();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleTickerSelect = (result: SearchResult) => {
    navigate(`/ticker/${encodeURIComponent(result.symbol)}`);
    setSearchQuery('');
    setMobileSearchOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 z-50">
      <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left section: Menu + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-9 w-9"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0"
          >
            <img
              src="/assets/generated/app-logo.dim_512x512.png"
              alt="EveryDollar"
              className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 object-contain"
            />
            <span className="text-lg sm:text-xl font-bold hidden xs:inline truncate">EveryDollar</span>
          </button>
        </div>

        {/* Center section: Desktop search */}
        <div className="flex-1 max-w-md hidden lg:block">
          <TickerTypeahead
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={handleTickerSelect}
            placeholder="Search ticker..."
          />
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Portfolio switcher - hidden on small mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hidden sm:flex h-9 px-3">
                <span className="hidden md:inline">Portfolios</span>
                <span className="md:hidden">Port.</span>
                <ChevronDown className="ml-1 sm:ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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

          {/* Settings menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
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

      <MobileTickerSearchDialog
        open={mobileSearchOpen}
        onOpenChange={setMobileSearchOpen}
        onSelect={handleTickerSelect}
      />
    </header>
  );
}
