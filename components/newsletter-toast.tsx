"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast as sonnerToast } from "sonner";

interface NewsletterToastProps {
  toastId: string | number;
  onClose: () => void;
}

export function NewsletterToast({ toastId, onClose }: NewsletterToastProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      sonnerToast.error("请输入有效的邮箱地址");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      sonnerToast.success("订阅成功！感谢您的关注");
      // Save to localStorage that user has subscribed
      localStorage.setItem("newsletter-subscribed", "true");
      localStorage.setItem("newsletter-subscribed-time", Date.now().toString());
      sonnerToast.dismiss(toastId);
      onClose();
    }, 1000);
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
            <Mail className="h-5 w-5 text-black" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">
              不想错过下一个百倍机会？
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm text-slate-600 mb-4 ml-12">
        订阅 Wise Invest 周刊，每周一获取最新的 Web3 研报和美股策略。
      </p>

      <form onSubmit={handleSubscribe} className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="输入您的邮箱地址"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            required
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            {isSubmitting ? "订阅中..." : "订阅"}
          </Button>
        </div>
      </form>
    </div>
  );
}

