import { useState } from 'react';
import { useChangePortfolioPrivacy } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Share2 } from 'lucide-react';

interface PortfolioSharingPanelProps {
  portfolioName: string;
  isPublic: boolean;
}

export default function PortfolioSharingPanel({ portfolioName, isPublic }: PortfolioSharingPanelProps) {
  const { identity } = useInternetIdentity();
  const privacyMutation = useChangePortfolioPrivacy();
  const [isToggling, setIsToggling] = useState(false);

  const publicUrl = identity
    ? `${window.location.origin}/#/public/${identity.getPrincipal().toString()}/${encodeURIComponent(portfolioName)}`
    : '';

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      await privacyMutation.mutateAsync({ portfolioName, isPublic: checked });
      toast.success(checked ? 'Portfolio is now public' : 'Portfolio is now private');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update privacy settings');
    } finally {
      setIsToggling(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Public URL copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Portfolio Sharing
        </CardTitle>
        <CardDescription>
          Make this portfolio publicly accessible via a shareable link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="public-toggle" className="cursor-pointer">
            Make portfolio public
          </Label>
          <Switch
            id="public-toggle"
            checked={isPublic}
            onCheckedChange={handleToggle}
            disabled={isToggling}
          />
        </div>

        {isPublic && (
          <div className="space-y-2">
            <Label>Public URL</Label>
            <div className="flex gap-2">
              <Input value={publicUrl} readOnly className="font-mono text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view your portfolio holdings and performance.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
