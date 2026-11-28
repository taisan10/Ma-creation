"use client";

import { Button } from "@/components/ui/button";

export interface FilterTabItem<T extends string = string> {
  key: T;
  label: string;
  count?: number;
  hasAlert?: boolean;
}

export interface DataTableFilterTabsProps<T extends string = string> {
  tabs: FilterTabItem<T>[];
  activeTab: T;
  onChange: (key: T) => void;
  className?: string;
}

/**
 * Decent Professional Filter Tabs with Clean Count Pills
 * Strictly adheres to monochrome/neutral design without aggressive animations.
 */
export function DataTableFilterTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: DataTableFilterTabsProps<T>) {
  return (
    <div
      className={`flex items-center gap-1 border border-border rounded-lg bg-muted/40 p-1 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Button
            key={tab.key}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs rounded-md font-medium"
            onClick={() => onChange(tab.key)}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : tab.hasAlert
                    ? "bg-destructive/15 text-destructive font-medium"
                    : "bg-muted-foreground/15 text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
