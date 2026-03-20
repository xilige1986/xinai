'use client';

import { useState, useEffect, useCallback } from 'react';

interface AccessCheckResult {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  canPurchaseWithMoney?: boolean;
  canPurchaseWithPoints?: boolean;
  moneyPrice?: number;
  requiredPoints?: number;
  userPoints?: number;
  refresh: () => void;
}

export function useCourseAccess(courseId: number): AccessCheckResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseOptions, setPurchaseOptions] = useState<{
    canPurchaseWithMoney?: boolean;
    canPurchaseWithPoints?: boolean;
    moneyPrice?: number;
    requiredPoints?: number;
    userPoints?: number;
  }>({});

  const checkAccess = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/access`);
      const data = await response.json();

      if (response.ok) {
        setHasAccess(data.hasAccess);
        setPurchaseOptions({
          canPurchaseWithMoney: data.canPurchaseWithMoney,
          canPurchaseWithPoints: data.canPurchaseWithPoints,
          moneyPrice: data.moneyPrice,
          requiredPoints: data.requiredPoints,
          userPoints: data.userPoints,
        });
      } else {
        setError(data.error || '检查权限失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return {
    hasAccess,
    isLoading,
    error,
    ...purchaseOptions,
    refresh: checkAccess,
  };
}
