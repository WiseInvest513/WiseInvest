import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">页面未找到</h2>
        <p className="text-muted-foreground">
          抱歉，您访问的页面不存在。
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href="/">返回首页</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tools">查看工具</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

