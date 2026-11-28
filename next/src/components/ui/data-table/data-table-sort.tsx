"use client";

import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SortOptionItem<T extends string = string> {
  key: T;
  label: string;
}

export interface DataTableSortProps<T extends string = string> {
  value: T;
  onChange: (val: T) => void;
  options: SortOptionItem<T>[];
  labelPrefix?: string;
  className?: string;
}

/**
 * Decent Professional Sort Dropdown Component
 */
export function DataTableSort<T extends string = string>({
  value,
  onChange,
  options,
  labelPrefix = "Sort",
  className = "",
}: DataTableSortProps<T>) {
  const currentOption = options.find((o) => o.key === value) || options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={`h-9 gap-1.5 text-xs font-normal border-border bg-transparent hover:bg-muted/50 ${className}`}
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {labelPrefix}: {currentOption?.label || value}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40 text-xs">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className="flex items-center justify-between cursor-pointer text-xs"
          >
            <span>{opt.label}</span>
            {value === opt.key && <Check className="h-3.5 w-3.5 text-foreground ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
