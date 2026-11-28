"use client";

import { useAuthStore } from "@/store/use-auth-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings, Globe, Shield } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

import { logout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function AdminUserNav() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const initials = getInitials(user?.name, "AD");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
            <Avatar size="sm" className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold leading-none">{user?.name || "Administrator"}</p>
                <Badge variant="secondary" className="text-[10px] uppercase font-mono px-1.5 py-0">
                  {user?.role || "admin"}
                </Badge>
              </div>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user?.email || "admin@macreation.com"}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/admin/settings" className="flex items-center gap-2 cursor-pointer w-full" />}>
            <Settings className="h-4 w-4" />
            <span>Site Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/admin/security" className="flex items-center gap-2 cursor-pointer w-full" />}>
            <Shield className="h-4 w-4" />
            <span>Security Monitor</span>
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/" className="flex items-center gap-2 cursor-pointer w-full" />}>
            <Globe className="h-4 w-4" />
            <span>Public Portal</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer flex items-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
