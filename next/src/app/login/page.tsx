"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

import { useLogin } from "@/hooks/mutations/use-login";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim();
    const password = (formData.get("password") as string);

    if (!email || !password) return;

    login({ email, password });
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">MA Creation</span>
          </Link>
          <p className="text-xs text-muted-foreground">
            Client Portal & Enterprise GeM Consultancy Console
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold tracking-tight">Sign In</CardTitle>
              <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                <ShieldCheck className="h-3 w-3" />
                Secure Portal
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Enter your administrative credentials to access the control room.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="admin@macreation.com"
                    className="pl-9 text-sm"
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Password Input with Visibility Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9 pr-10 text-sm"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">Toggle password visibility</span>
                  </Button>
                </div>
              </div>

            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full gap-2 font-medium" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In to Control Room"
                )}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                <Link href="/" className="hover:underline text-primary">
                  ← Return to Home
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-muted-foreground font-mono">
          Session protected by JWT Bearer auth & HttpOnly refresh token
        </p>

      </div>
    </main>
  );
}
