"use client";

import { useState, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { CommunityDialog } from "@/components/community-dialog";
import { cn } from "@/lib/utils";

export function CommunityDialogButton({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300",
          className
        )}
      >
        {children ?? (
          <>
            <MessageCircle className="h-4 w-4" />
            打开群聊二维码
          </>
        )}
      </button>
      <CommunityDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
