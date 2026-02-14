import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { waitForActor } from './actorReady';
import type { Portfolio, Holding } from '../backend';
import { Principal } from '@dfinity/principal';

export function useGetPortfolios() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Portfolio[]>({
    queryKey: ['portfolios'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPortfolios();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreatePortfolio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      // Wait for actor to be ready if it's not immediately available
      const readyActor = actor || await waitForActor(queryClient);
      await readyActor.createPortfolio(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useUpdatePortfolio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (portfolio: Portfolio) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updatePortfolio(portfolio);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useDeletePortfolio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deletePortfolio(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useChangePortfolioPrivacy() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ portfolioName, isPublic }: { portfolioName: string; isPublic: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.changePortfolioPrivacy(portfolioName, isPublic);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useAddHolding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ portfolioName, holding }: { portfolioName: string; holding: Holding }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addHolding(portfolioName, holding);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useRemoveHolding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ portfolioName, ticker }: { portfolioName: string; ticker: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.removeHolding(portfolioName, ticker);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
    },
  });
}

export function useGetPublicPortfolio(owner: string, portfolioName: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Portfolio>({
    queryKey: ['publicPortfolio', owner, portfolioName],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPublicPortfolio(Principal.fromText(owner), portfolioName);
    },
    enabled: !!actor && !actorFetching && !!owner && !!portfolioName,
    retry: false,
  });
}
