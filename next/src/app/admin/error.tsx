"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Module Error]:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold">Something went wrong</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {error.message || "An unexpected error occurred while loading this administrative section."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-4">
          <Button onClick={() => reset()} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
