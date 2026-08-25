"use client";

import { useState, type ReactNode } from "react";
import { CommunityDialog } from "@/components/community-dialog";

export function CommunityDialogLauncher({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-amber-300 transition-colors hover:bg-amber-400 hover:text-slate-950 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
      >
        {children}
      </button>
      <CommunityDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
