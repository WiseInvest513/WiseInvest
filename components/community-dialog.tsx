"use client";
import { useEffect, useRef } from "react";
export function CommunityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const onChange = useRef(onOpenChange);
  onChange.current = onOpenChange;
  useEffect(() => {
    if (!open) return;
    const show = () => window.dispatchEvent(new Event("wise-community:request"));
    const closed = () => onChange.current(false);
    window.addEventListener("wise-community:ready", show);
    window.addEventListener("wise-community:closed", closed);
    show();
    return () => {
      window.removeEventListener("wise-community:ready", show);
      window.removeEventListener("wise-community:closed", closed);
      window.dispatchEvent(new Event("wise-community:close"));
    };
  }, [open]);
  return null;
}
