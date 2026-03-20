'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface SubCategory {
  id: number;
  name: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
  subCategories: SubCategory[];
}

interface SubCategoryListProps {
  categories: Category[];
}

export function SubCategoryList({ categories }: SubCategoryListProps) {
  const handleDelete = async (subId: number) => {
    if (!confirm('确定要删除这个子分类吗？')) return;

    try {
      const response = await fetch(`/api/subcategories/${subId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }

      window.location.reload();
    } catch (err: any) {
      alert(err.message || '删除失败，请重试');
    }
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">{category.name}</div>
            <Link href={`/admin/categories/${category.id}/subcategories/new`}>
              <Button size="sm" variant="outline">
                <Plus className="h-3.5 w-3.5 mr-1" />
                添加子分类
              </Button>
            </Link>
          </div>
          {category.subCategories.length > 0 ? (
            <div className="space-y-2">
              {category.subCategories.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{sub.name}</Badge>
                    <span className="text-xs text-muted-foreground">/{sub.slug}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/subcategories/${sub.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(sub.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">暂无子分类</p>
          )}
        </div>
      ))}
    </div>
  );
}
