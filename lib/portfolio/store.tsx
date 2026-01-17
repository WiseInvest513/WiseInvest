"use client";

/**
 * Portfolio Store - React Context State Management
 * 投资组合状态管理（持久化到 localStorage）
 * 使用 React Context 替代 Zustand，避免额外依赖
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Asset } from './types';

const STORAGE_KEY = 'portfolio-tracker-storage';

interface PortfolioContextType {
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  removeAsset: (id: string) => void;
  updateAsset: (id: string, updates: Partial<Asset>) => void;
  clearPortfolio: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>([]);

  // 从 localStorage 加载
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setAssets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load portfolio from storage:', error);
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    } catch (error) {
      console.error('Failed to save portfolio to storage:', error);
    }
  }, [assets]);

  const addAsset = useCallback((asset: Asset) => {
    setAssets((prev) => [...prev, asset]);
  }, []);

  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateAsset = useCallback((id: string, updates: Partial<Asset>) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }, []);

  const clearPortfolio = useCallback(() => {
    setAssets([]);
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        assets,
        addAsset,
        removeAsset,
        updateAsset,
        clearPortfolio,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioStore() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolioStore must be used within PortfolioProvider');
  }
  return context;
}

