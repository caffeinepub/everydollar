import { useState, useCallback } from 'react';

export interface SimulationState {
  enabled: boolean;
  globalMovePercent: number;
  priceOverrides: Map<string, number>; // ticker -> override price
}

export function usePortfolioSimulation() {
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const [globalMovePercent, setGlobalMovePercent] = useState(0);
  const [priceOverrides, setPriceOverrides] = useState<Map<string, number>>(new Map());

  const toggleSimulation = useCallback(() => {
    setSimulationEnabled(prev => !prev);
  }, []);

  const resetSimulation = useCallback(() => {
    setGlobalMovePercent(0);
    setPriceOverrides(new Map());
  }, []);

  const setOverridePrice = useCallback((ticker: string, price: number | null) => {
    setPriceOverrides(prev => {
      const next = new Map(prev);
      if (price === null) {
        next.delete(ticker);
      } else {
        next.set(ticker, price);
      }
      return next;
    });
  }, []);

  const clearSimulation = useCallback(() => {
    setSimulationEnabled(false);
    setGlobalMovePercent(0);
    setPriceOverrides(new Map());
  }, []);

  return {
    simulationEnabled,
    globalMovePercent,
    priceOverrides,
    toggleSimulation,
    setGlobalMovePercent,
    setOverridePrice,
    resetSimulation,
    clearSimulation,
  };
}
