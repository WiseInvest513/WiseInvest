"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  TrendingUp,
  Coins,
  BarChart3,
  PieChart,
  Percent,
  Zap,
  Search as SearchIcon,
  FileText,
  Home,
  LucideIcon,
} from "lucide-react";
import { tools, type Tool } from "@/lib/data";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Calculator,
  TrendingUp,
  Coins,
  BarChart3,
  PieChart,
  Percent,
  Zap,
  Search: SearchIcon,
};

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToolSelect?: (tool: Tool) => void;
}

export function SearchCommand({
  open,
  onOpenChange,
  onToolSelect,
}: SearchCommandProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Navigation items
  const navItems = [
    { label: "首页", href: "/", icon: Home },
    { label: "推文", href: "/tweets", icon: FileText },
    { label: "工具", href: "/tools", icon: SearchIcon },
    { label: "文集", href: "/anthology", icon: FileText },
  ];

  // Filter tools based on search
  const filteredTools = tools.filter((tool) =>
    tool.name.toLowerCase().includes(search.toLowerCase()) ||
    tool.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleToolSelect = (tool: Tool) => {
    if (tool.status === "Available" && onToolSelect) {
      onToolSelect(tool);
      onOpenChange(false);
      setSearch("");
    }
  };

  const handleNavSelect = (href: string) => {
    router.push(href);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="搜索工具或导航..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>未找到结果</CommandEmpty>

        {/* Navigation Group */}
        {(!search || navItems.some((item) => item.label.toLowerCase().includes(search.toLowerCase()))) && (
          <CommandGroup heading="导航">
            {navItems
              .filter(
                (item) =>
                  !search ||
                  item.label.toLowerCase().includes(search.toLowerCase())
              )
              .map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    onSelect={() => handleNavSelect(item.href)}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
          </CommandGroup>
        )}

        {/* Tools Group */}
        {filteredTools.length > 0 && (
          <CommandGroup heading="工具">
            {filteredTools.map((tool) => {
              const Icon = iconMap[tool.icon] || Calculator;
              return (
                <CommandItem
                  key={tool.id}
                  onSelect={() => handleToolSelect(tool)}
                  disabled={tool.status !== "Available"}
                  className={tool.status === "Available" ? "cursor-pointer" : "cursor-not-allowed"}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{tool.name}</span>
                  {tool.type === "dynamic" && (
                    <CommandShortcut className="text-green-600">Live</CommandShortcut>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

