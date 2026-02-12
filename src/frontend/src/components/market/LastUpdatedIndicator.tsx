import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface LastUpdatedIndicatorProps {
  timestamp?: number;
}

export default function LastUpdatedIndicator({ timestamp }: LastUpdatedIndicatorProps) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!timestamp) return;

    const updateSeconds = () => {
      const now = Date.now();
      const diff = Math.floor((now - timestamp) / 1000);
      setSecondsAgo(diff);
    };

    updateSeconds();
    const interval = setInterval(updateSeconds, 1000);

    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timestamp) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>Last updated: {secondsAgo}s ago</span>
    </div>
  );
}
