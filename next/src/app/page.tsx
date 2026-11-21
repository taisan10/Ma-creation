import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">MA Creation</h1>
        <p className="text-muted-foreground text-sm">
          Next.js Enterprise Client Portal & Admin Console.
        </p>
        <div className="pt-4">
          <Button render={<Link href="/admin" />} size="lg">
            Go to Admin Dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}