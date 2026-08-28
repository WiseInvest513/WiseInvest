"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const handleSignOut = async () => {
    await fetch("/api/dev/mock-logout", { method: "POST" }).catch(() => null);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-xl border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      onClick={handleSignOut}
    >
      <LogOut className="mr-2 h-4 w-4" />
      退出登录
    </Button>
  );
}
