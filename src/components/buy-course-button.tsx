'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface BuyCourseButtonProps {
  courseId: number;
  price: number;
  courseTitle: string;
  onPurchaseSuccess?: () => void;
}

export default function BuyCourseButton({
  courseId,
  price,
  courseTitle,
  onPurchaseSuccess,
}: BuyCourseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [orderNo, setOrderNo] = useState('');

  const handleBuy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/order`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setOrderNo(data.order.orderNo);
        setShowPayDialog(true);
      } else {
        toast.error(data.error || '创建订单失败');
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = async (payType: 'wechat' | 'alipay') => {
    setIsLoading(true);
    try {
      // 模拟支付流程
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo, payType }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('支付成功！');
        setShowPayDialog(false);
        onPurchaseSuccess?.();
      } else {
        toast.error(data.error || '支付失败');
      }
    } catch (error) {
      toast.error('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        size="lg"
        className="w-full"
        onClick={handleBuy}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Lock className="h-4 w-4 mr-2" />
        )}
        立即购买 ¥{price.toFixed(2)}
      </Button>

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认支付</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-2">课程</p>
            <p className="font-semibold text-lg mb-4">{courseTitle}</p>
            <p className="text-3xl font-bold text-primary">¥{price.toFixed(2)}</p>
          </div>
          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => handlePay('wechat')}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                '微信支付'
              )}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              size="lg"
              onClick={() => handlePay('alipay')}
              disabled={isLoading}
            >
              支付宝支付
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
