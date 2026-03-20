'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function PaySuccessContent() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get('orderNo');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在确认支付结果...');

  useEffect(() => {
    if (!orderNo) {
      setStatus('error');
      setMessage('订单号缺失');
      return;
    }

    // 查询支付状态
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/pay/query?orderNo=${orderNo}`);
        const data = await response.json();

        if (response.ok && data.order.status === 1) {
          setStatus('success');
          setMessage('支付成功！');
        } else {
          setStatus('error');
          setMessage('支付确认失败，请稍后查看订单状态');
        }
      } catch (error) {
        setStatus('error');
        setMessage('查询支付状态失败');
      }
    };

    checkStatus();

    // 轮询检查
    const timer = setInterval(checkStatus, 3000);
    setTimeout(() => clearInterval(timer), 30000);

    return () => clearInterval(timer);
  }, [orderNo]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <h2 className="text-xl font-semibold mb-2">处理中</h2>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2">支付成功！</h2>
              <p className="text-muted-foreground mb-6">
                您已成功购买课程，现在可以开始学习了
              </p>
              <div className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/orders">查看订单</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/courses">继续浏览课程</Link>
                </Button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2">支付确认异常</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="space-y-3">
                <Button className="w-full" asChild>
                  <Link href="/orders">查看订单状态</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/courses">返回课程列表</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaySuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold mb-2">加载中</h2>
            <p className="text-muted-foreground">请稍候...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaySuccessContent />
    </Suspense>
  );
}
