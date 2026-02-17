import { useState, useRef, useEffect } from 'react';
import { useTickerSearch, SearchResult } from '../../hooks/useMarketData';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

interface TickerTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  minQueryLength?: number;
  debounceMs?: number;
}

export default function TickerTypeahead({
  value,
  onChange,
  onSelect,
  placeholder = 'Search ticker...',
  className = '',
  minQueryLength = 2,
  debounceMs = 300,
}: TickerTypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebouncedValue(value, debounceMs);
  const { data: results = [], isLoading, isFetching } = useTickerSearch(debouncedQuery, minQueryLength);

  const shouldShowDropdown = value.length >= minQueryLength;
  const hasResults = results.length > 0;
  const isSearching = isLoading || isFetching;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [results]);

  useEffect(() => {
    // Open dropdown as soon as minimum query length is reached
    if (value.length >= minQueryLength) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [value, minQueryLength]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !hasResults) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    onSelect(result);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.length >= minQueryLength) {
              setIsOpen(true);
            }
          }}
          className="pl-9"
        />
      </div>

      {isOpen && shouldShowDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
          {isSearching ? (
            <div className="p-2 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : hasResults ? (
            <ScrollArea className="max-h-64">
              <div className="p-1">
                {results.map((result, index) => (
                  <button
                    key={`${result.symbol}-${result.type}`}
                    type="button"
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      index === highlightedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <div className="font-medium">{result.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.name}
                      {result.type && result.type !== 'Unknown' && ` • ${result.type}`}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
