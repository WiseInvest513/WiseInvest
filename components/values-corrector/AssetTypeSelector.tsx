"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssetType } from "@/lib/asset-service";

interface AssetTypeSelectorProps {
  value: AssetType;
  onSelect: (type: AssetType) => void;
}

const ASSET_TYPES: { value: AssetType; label: string; icon: string }[] = [
  { value: "crypto", label: "加密货币", icon: "₿" },
  { value: "stock", label: "美股", icon: "📈" },
  { value: "index", label: "指数", icon: "📊" },
];

export function AssetTypeSelector({ value, onSelect }: AssetTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedType = ASSET_TYPES.find(t => t.value === value) || ASSET_TYPES[0];

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between h-11"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">{selectedType.icon}</span>
          <span className="font-medium">{selectedType.label}</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg">
          <div className="p-1">
            {ASSET_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  onSelect(type.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center gap-3 ${
                  value === type.value ? "bg-muted" : ""
                }`}
              >
                <span className="text-lg">{type.icon}</span>
                <span className="font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

