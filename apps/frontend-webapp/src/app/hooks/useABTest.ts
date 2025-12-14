'use client';
import { useState, useEffect } from 'react';

export type ABVariant = 'green' | 'red';

interface ABTestResult {
  variant: ABVariant;
  colors: {
    primary: string;
    hover: string;
    text: string;
  };
}

const STORAGE_KEY = 'going_ab_cta_variant';

const variantColors: Record<ABVariant, ABTestResult['colors']> = {
  green: {
    primary: 'bg-emerald-500',
    hover: 'hover:bg-emerald-600',
    text: 'text-white',
  },
  red: {
    primary: 'bg-red-500',
    hover: 'hover:bg-red-600',
    text: 'text-white',
  },
};

export function useABTest(): ABTestResult {
  const [variant, setVariant] = useState<ABVariant>('green');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ABVariant | null;
    if (stored && (stored === 'green' || stored === 'red')) {
      setVariant(stored);
    } else {
      const newVariant: ABVariant = Math.random() < 0.5 ? 'green' : 'red';
      localStorage.setItem(STORAGE_KEY, newVariant);
      setVariant(newVariant);
      console.log('[A/B Test] Assigned variant:', newVariant);
    }
  }, []);

  return {
    variant,
    colors: variantColors[variant],
  };
}
