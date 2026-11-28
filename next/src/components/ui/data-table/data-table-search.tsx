"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface DataTableSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function DataTableSearch({
  value,
  onChange,
  placeholder = "Search records...",
  className = "w-full lg:w-80",
}: DataTableSearchProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8 h-9 text-xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
          title="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
