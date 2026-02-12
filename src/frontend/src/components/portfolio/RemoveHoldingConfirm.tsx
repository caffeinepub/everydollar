import { useRemoveHolding } from '../../hooks/useQueries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface RemoveHoldingConfirmProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioName: string;
  ticker: string;
}

export default function RemoveHoldingConfirm({
  open,
  onOpenChange,
  portfolioName,
  ticker,
}: RemoveHoldingConfirmProps) {
  const removeMutation = useRemoveHolding();

  const handleConfirm = async () => {
    try {
      await removeMutation.mutateAsync({ portfolioName, ticker });
      toast.success(`Removed ${ticker} from portfolio`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove holding');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Holding</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {ticker} from this portfolio? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={removeMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {removeMutation.isPending ? 'Removing...' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
