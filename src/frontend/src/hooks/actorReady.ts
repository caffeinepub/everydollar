import { useQueryClient } from '@tanstack/react-query';
import type { backendInterface } from '../backend';

/**
 * Waits for the actor to be available by polling the React Query cache.
 * Searches for any query key starting with ['actor'] to handle principal-scoped keys.
 * Throws a user-friendly error if the actor cannot be obtained within the timeout.
 */
export async function waitForActor(
  queryClient: ReturnType<typeof useQueryClient>,
  timeoutMs: number = 10000
): Promise<backendInterface> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    // Find any actor query in the cache (handles principal-scoped keys like ['actor', principal])
    const actorQueries = queryClient.getQueriesData({ queryKey: ['actor'] });
    
    // Check if any actor query has data
    for (const [_key, data] of actorQueries) {
      if (data) {
        return data as backendInterface;
      }
    }
    
    // Check if any actor query has a terminal error
    const actorQueryStates = queryClient
      .getQueryCache()
      .findAll({ queryKey: ['actor'] });
    
    for (const query of actorQueryStates) {
      if (query.state.status === 'error') {
        throw new Error('Unable to connect to the backend. Please refresh the page and try again.');
      }
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('Connection timeout. Please refresh the page and try again.');
}
