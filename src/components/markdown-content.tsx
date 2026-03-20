'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
}

// 缓存 remarkGfm 插件实例，避免重复创建
const remarkPlugins = [remarkGfm];

// 提取 Code 组件减少重复定义
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  return !inline && match ? (
    <SyntaxHighlighter
      style={oneLight}
      language={match[1]}
      PreTag="div"
      {...props}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code
      className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  );
};

// 静态组件定义，避免每次渲染重新创建
const components = {
  code: CodeBlock,
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-2xl font-bold text-foreground mt-8 mb-4 pb-2 border-b border-border">
      {children}
    </h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xl font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
      <span className="w-1 h-5 bg-primary rounded-full"></span>
      {children}
    </h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg font-medium text-foreground mt-5 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="text-base font-medium text-foreground mt-4 mb-2">
      {children}
    </h4>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="text-foreground/80 leading-relaxed mb-4">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc list-inside text-foreground/80 mb-4 space-y-1.5 ml-1">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal list-inside text-foreground/80 mb-4 space-y-1.5 ml-1">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="marker:text-primary">{children}</li>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary/30 bg-primary/5 pl-4 py-2 my-4 text-foreground/70 italic rounded-r-lg">
      {children}
    </blockquote>
  ),
  a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
    <a
      href={href}
      className="text-primary hover:text-primary/80 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-border">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-2.5 text-left text-sm font-semibold text-foreground border-b border-border">
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-2.5 text-sm text-foreground/80 border-b border-border/50">
      {children}
    </td>
  ),
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
  ),
  hr: () => <hr className="my-6 border-border" />,
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-foreground/90">{children}</em>
  ),
  del: ({ children }: { children: React.ReactNode }) => (
    <del className="line-through text-muted-foreground">{children}</del>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img
      src={src}
      alt={alt}
      className="rounded-lg max-w-full my-4 border border-border/50"
      loading="lazy"
    />
  ),
};

function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) return null;

  // 使用 useMemo 缓存渲染结果，只有 content 变化时才重新渲染
  const markdownElement = useMemo(() => (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      components={components}
    >
      {content}
    </ReactMarkdown>
  ), [content]);

  return <div className="markdown-content">{markdownElement}</div>;
}

// 使用 React.memo 防止父组件重渲染时重复渲染
export default MarkdownContent;
