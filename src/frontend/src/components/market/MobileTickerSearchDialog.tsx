import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TickerTypeahead from './TickerTypeahead';
import { SearchResult } from '../../hooks/useMarketData';

interface MobileTickerSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: SearchResult) => void;
}

export default function MobileTickerSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: MobileTickerSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (result: SearchResult) => {
    onSelect(result);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search Ticker</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <TickerTypeahead
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={handleSelect}
            placeholder="Search ticker..."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
