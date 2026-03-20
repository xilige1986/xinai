'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Link, Quote, Eraser } from 'lucide-react';

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SimpleEditor({ value, onChange, placeholder }: SimpleEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatDoc = useCallback((cmd: string, valueArg: string = '') => {
    if (typeof document !== 'undefined') {
      document.execCommand(cmd, false, valueArg);
    }
  }, []);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    onChange(content === '<br>' ? '' : content);
  }, [onChange]);

  if (!isMounted) {
    return (
      <div className="h-[400px] border rounded-lg bg-muted/30 flex items-center justify-center">
        <span className="text-muted-foreground">加载中...</span>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 p-2 bg-muted/50 border-b flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc('bold')}
          className="h-8 w-8 p-0"
          title="粗体"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc('italic')}
          className="h-8 w-8 p-0"
          title="斜体"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc('underline')}
          className="h-8 w-8 p-0"
          title="下划线"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc('formatBlock', 'H1')}
          className="h-8 w-8 p-0"
          title="标题1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc('formatBlock', 'H2')}
          className="h-8 w-8 p-0"
          title="标题2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc('insertUnorderedList')}
          className="h-8 w-8 p-0"
          title="无序列表"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc('insertOrderedList')}
          className="h-8 w-8 p-0"
          title="有序列表"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc('formatBlock', 'BLOCKQUOTE')}
          className="h-8 w-8 p-0"
          title="引用"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt('请输入链接地址:');
            if (url) formatDoc('createLink', url);
          }}
          className="h-8 w-8 p-0"
          title="插入链接"
        >
          <Link className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatDoc('removeFormat')}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          title="清除格式"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      {/* 编辑区域 */}
      <div
        className="min-h-[350px] p-4 focus:outline-none prose prose-sm max-w-none"
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value || `<p>${placeholder || ''}</p>` }}
        style={{
          outline: 'none',
        }}
        onBlur={(e) => {
          // 如果内容为空，显示占位符
          if (e.currentTarget.innerHTML === '<br>') {
            e.currentTarget.innerHTML = `<p>${placeholder || ''}</p>`;
          }
        }}
        onFocus={(e) => {
          // 如果内容是占位符，清空
          if (e.currentTarget.innerHTML === `<p>${placeholder || ''}</p>`) {
            e.currentTarget.innerHTML = '<p><br></p>';
          }
        }}
      />
    </div>
  );
}
