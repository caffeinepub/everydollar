import { useDeletePortfolio } from '../../hooks/useQueries';
import { navigate } from '../../App';
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

interface DeletePortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioName: string;
}

export default function DeletePortfolioDialog({
  open,
  onOpenChange,
  portfolioName,
}: DeletePortfolioDialogProps) {
  const deleteMutation = useDeletePortfolio();

  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(portfolioName);
      toast.success(`Portfolio "${portfolioName}" deleted`);
      navigate('/');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete portfolio');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Portfolio</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{portfolioName}"? This will remove all holdings and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Portfolio'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
