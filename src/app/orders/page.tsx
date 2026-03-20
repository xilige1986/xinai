'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, Clock, XCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface Order {
  id: number;
  orderNo: string;
  amount: number;
  status: number;
  payType: string | null;
  payTime: string | null;
  createdAt: string;
  course: {
    id: number;
    title: string;
    slug: string;
    coverImage: string | null;
  };
}

const statusMap: Record<number, { label: string; icon: React.ReactNode; color: string }> = {
  0: { label: '待支付', icon: <Clock className="h-4 w-4" />, color: 'text-yellow-600' },
  1: { label: '已支付', icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
  2: { label: '已取消', icon: <XCircle className="h-4 w-4" />, color: 'text-gray-500' },
  3: { label: '已退款', icon: <CreditCard className="h-4 w-4" />, color: 'text-blue-600' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6">我的订单</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">暂无订单</p>
              <Link href="/courses" className="mt-4 inline-block">
                <Button>去逛逛课程</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusMap[order.status] || statusMap[0];
              return (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                          {order.course.coverImage ? (
                            <img
                              src={order.course.coverImage}
                              alt={order.course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <span className="text-primary/50">无封面</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <Link href={`/courses/${order.course.slug}`}>
                            <h3 className="font-semibold hover:text-primary transition-colors">
                              {order.course.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            订单号：{order.orderNo}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`flex items-center gap-1 ${status.color}`}>
                              {status.icon}
                              {status.label}
                            </span>
                            <span>·</span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">¥{order.amount.toFixed(2)}</p>
                        {order.status === 1 && (
                          <Link href={`/courses/${order.course.slug}`}>
                            <Button size="sm" className="mt-2">
                              去学习
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
