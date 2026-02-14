import { useState } from 'react';
import { useCreatePortfolio } from '../../hooks/useQueries';
import { useActor } from '../../hooks/useActor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreatePortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreatePortfolioDialog({ open, onOpenChange }: CreatePortfolioDialogProps) {
  const [name, setName] = useState('');
  const createMutation = useCreatePortfolio();
  const { actor, isFetching: actorFetching } = useActor();

  const isActorReady = !!actor && !actorFetching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a portfolio name');
      return;
    }

    try {
      await createMutation.mutateAsync(name.trim());
      toast.success(`Portfolio "${name}" created successfully`);
      setName('');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create portfolio');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Portfolio</DialogTitle>
            <DialogDescription>
              Give your portfolio a name to start tracking your investments.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="name">Portfolio Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Retirement, Growth, Crypto"
              className="mt-2"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || !isActorReady}
            >
              {!isActorReady 
                ? 'Connecting...' 
                : createMutation.isPending 
                ? 'Creating...' 
                : 'Create Portfolio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
