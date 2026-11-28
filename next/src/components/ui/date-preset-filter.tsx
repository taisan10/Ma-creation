"use client";

import { Calendar as CalendarIcon, Check, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DatePreset,
  DATE_PRESET_LABELS,
  CustomDateRange,
} from "@/lib/date-filters";

export interface DatePresetFilterProps {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
  customRange?: CustomDateRange;
  onCustomRangeChange?: (range?: CustomDateRange) => void;
  allowedPresets?: DatePreset[];
  className?: string;
}

/**
 * Decent Professional Date Preset Filter
 * Styled with neutral outline borders and clean typography matching Shadcn theme.
 */
export function DatePresetFilter({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
  allowedPresets = ["all", "today", "7d", "this_month", "last_month", "6m", "1y", "custom"],
  className = "",
}: DatePresetFilterProps) {
  let displayLabel = DATE_PRESET_LABELS[value] || "All Time";
  if (value === "custom" && customRange?.from) {
    if (customRange.to) {
      displayLabel = `${format(customRange.from, "dd MMM")} - ${format(customRange.to, "dd MMM")}`;
    } else {
      displayLabel = format(customRange.from, "dd MMM yyyy");
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={`h-9 gap-1.5 text-xs font-normal border-border bg-transparent hover:bg-muted/50 ${className}`}
            >
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Date: {displayLabel}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44 text-xs">
          {allowedPresets
            .filter((p) => p !== "custom")
            .map((preset) => (
              <DropdownMenuItem
                key={preset}
                onClick={() => onChange(preset)}
                className="flex items-center justify-between cursor-pointer text-xs"
              >
                <span>{DATE_PRESET_LABELS[preset]}</span>
                {value === preset && <Check className="h-3.5 w-3.5 text-foreground ml-auto" />}
              </DropdownMenuItem>
            ))}

          {allowedPresets.includes("custom") && onCustomRangeChange && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onChange("custom")}
                className="flex items-center justify-between cursor-pointer text-xs font-medium"
              >
                <span>Custom Range</span>
                {value === "custom" && <Check className="h-3.5 w-3.5 text-foreground ml-auto" />}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clean neutral popover for Custom Date Range */}
      {value === "custom" && onCustomRangeChange && (
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs px-2.5 font-normal border-border bg-transparent gap-1.5"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Select Range</span>
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={
                customRange?.from
                  ? { from: customRange.from, to: customRange.to }
                  : undefined
              }
              onSelect={(range) => {
                onCustomRangeChange(range ? { from: range.from, to: range.to } : undefined);
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
