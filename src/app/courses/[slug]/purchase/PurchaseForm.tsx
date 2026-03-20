'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseFormProps {
  courseId: number;
  price: number;
  courseTitle: string;
  existingOrderNo?: string;
}

export function PurchaseForm({
  courseId,
  price,
  courseTitle,
  existingOrderNo,
}: PurchaseFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [payType, setPayType] = useState('wechat');
  const [orderNo, setOrderNo] = useState(existingOrderNo || '');

  const handlePay = async () => {
    console.log('handlePay called, orderNo:', orderNo, 'existingOrderNo:', existingOrderNo);

    // 如果没有订单号，先创建订单
    if (!orderNo && !existingOrderNo) {
      console.log('Creating new order for course:', courseId);
      setIsLoading(true);
      try {
        const response = await fetch(`/api/courses/${courseId}/order`, {
          method: 'POST',
        });

        console.log('Create order response:', response.status);
        const data = await response.json();
        console.log('Create order data:', data);

        if (response.ok) {
          setOrderNo(data.order.orderNo);
          toast.success('订单创建成功');
          // 创建成功，使用新订单号继续支付
          await processPayment(data.order.orderNo);
        } else {
          toast.error(data.error || '创建订单失败');
        }
      } catch (error) {
        console.error('Create order error:', error);
        toast.error('网络错误，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 已有订单号，直接支付
      console.log('Using existing order, proceeding to payment');
      await processPayment(orderNo || existingOrderNo || '');
    }
  };

  const processPayment = async (currentOrderNo: string) => {
    if (!currentOrderNo) {
      toast.error('订单号缺失');
      return;
    }

    setIsLoading(true);
    try {
      // 模拟支付流程
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo: currentOrderNo, payType }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('支付成功！');
        router.push('/orders');
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          选择支付方式
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={payType} onValueChange={setPayType}>
          <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="wechat" id="wechat" />
            <Label htmlFor="wechat" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                  微信
                </div>
                <span>微信支付</span>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
            <RadioGroupItem value="alipay" id="alipay" />
            <Label htmlFor="alipay" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                  支付宝
                </div>
                <span>支付宝</span>
              </div>
            </Label>
          </div>
        </RadioGroup>

        <Button
          className="w-full"
          size="lg"
          onClick={handlePay}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          {orderNo || existingOrderNo ? '确认支付' : '创建订单并支付'} ¥{price.toFixed(2)}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          点击支付即表示您同意《购买协议》和《退款政策》
        </p>
      </CardContent>
    </Card>
  );
}
