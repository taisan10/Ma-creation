"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState se ensure hota hai ki React re-render hone par naya cache na bane
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1 * 60 * 1000, // 1 minute tak data fresh rahega (zero refetch
            refetchOnWindowFocus: true, // Doosre tab se wapas aane par auto-sync hoga
          },
        },
      })
  );  

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}